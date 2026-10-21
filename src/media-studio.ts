import * as THREE from 'three';
import './media-studio.css';

type Options = {
  root: HTMLElement; renderer: THREE.WebGLRenderer; scene: THREE.Scene;
  camera: THREE.PerspectiveCamera; busy: () => boolean;
  appearance: () => Record<string, unknown>; target: THREE.Vector3;
};
const sizes: Record<string, [number, number]> = {
  landscape: [1920, 1080], portrait: [1080, 1920], square: [2048, 2048], ultra: [3840, 2160],
};
function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 30000);
}

// Captures use the actual posed scene and materials. No model replacement or rerigging.
export function installMediaStudio(o: Options) {
  const {root, renderer, scene, camera} = o;
  const section = document.createElement('section');
  section.className = 'media-panel';
  section.setAttribute('aria-label', 'Media output');
  section.innerHTML = `<h2>Media output</h2>
    <label class="cosmetic-field">Image size<select id="media-size"><option value="landscape">Landscape · 1920 × 1080</option><option value="portrait">Portrait · 1080 × 1920</option><option value="square">Square · 2048 × 2048</option><option value="ultra">Ultra HD · 3840 × 2160</option></select></label>
    <label class="cosmetic-field">Background<select id="media-background"><option value="forest">Forest</option><option value="transparent">Transparent</option><option value="black">Black</option><option value="white">White</option></select></label>
    <div class="media-buttons"><button id="media-capture" class="primary">Export PNG</button><button id="media-shot">Save shot</button><button id="media-clean" aria-pressed="false">Clean stage</button></div>
    <p class="cosmetic-note">PNG exports only the character and stage. Save shot includes appearance, camera and output settings. Load it with Load appearance.</p>
    <p id="media-status" role="status" aria-live="polite">Ready for a new shot.</p>`;
  root.querySelector('.appearance-tools')!.prepend(section);
  const size = section.querySelector<HTMLSelectElement>('#media-size')!;
  const background = section.querySelector<HTMLSelectElement>('#media-background')!;
  const capture = section.querySelector<HTMLButtonElement>('#media-capture')!;
  const status = section.querySelector<HTMLElement>('#media-status')!;
  const clean = section.querySelector<HTMLButtonElement>('#media-clean')!;
  const returnButton = document.createElement('button');
  returnButton.className = 'media-return'; returnButton.textContent = 'Back to editor'; returnButton.hidden = true;
  const returnZone = document.createElement('div'); returnZone.className = 'media-return-zone';
  returnZone.append(returnButton); root.append(returnZone);
  let exporting = false;
  function cleanStage(enabled: boolean) {
    root.classList.toggle('media-clean-stage', enabled);
    returnButton.hidden = !enabled; clean.setAttribute('aria-pressed', String(enabled));
    (enabled ? returnButton : clean).focus();
  }
  const onKey = (event: KeyboardEvent) => {
    if(event.key === 'Escape' && root.classList.contains('media-clean-stage')) cleanStage(false);
  };
  window.addEventListener('keydown', onKey);
  clean.onclick = () => cleanStage(true); returnButton.onclick = () => cleanStage(false);
  const snapshot = () => ({
    version: 1, size: size.value, background: background.value,
    camera: {position: camera.position.toArray(), target: o.target.toArray(), fov: camera.fov},
  });
  section.querySelector<HTMLButtonElement>('#media-shot')!.onclick = () => {
    if(o.busy()) {status.textContent = 'Wait for the character to finish loading.'; return;}
    download(new Blob([JSON.stringify({...o.appearance(), media: snapshot()}, null, 2)], {type: 'application/json'}), 'veil-media-shot.json');
    status.textContent = 'Shot saved. Load it to restore the appearance and camera.';
  };
  capture.onclick = async () => {
    if(exporting || o.busy()) {status.textContent = 'Wait for the character to finish loading.'; return;}
    exporting = true; capture.disabled = true;
    const oldSize = renderer.getSize(new THREE.Vector2()), ratio = renderer.getPixelRatio();
    const oldAspect = camera.aspect, oldView = camera.view ? {...camera.view} : null;
    const oldBackground = scene.background;
    const [width, height] = sizes[size.value] || sizes.landscape;
    try {
      status.textContent = 'Rendering PNG…';
      renderer.setPixelRatio(1); renderer.setSize(width, height, false);
      camera.clearViewOffset(); camera.aspect = width / height; camera.updateProjectionMatrix();
      scene.background = background.value === 'transparent' ? null : new THREE.Color(
        background.value === 'white' ? '#eeeeea' : background.value === 'black' ? '#080908' : '#10271e');
      renderer.render(scene, camera);
      // Snapshot synchronously before restoring the live renderer and asynchronous PNG encoding.
      const output = document.createElement('canvas'); output.width = width; output.height = height;
      const context = output.getContext('2d'); if(!context) throw new Error('Image export is unavailable in this browser.');
      context.drawImage(renderer.domElement, 0, 0);
      const blob = await new Promise<Blob>((resolve, reject) => output.toBlob(b => b ? resolve(b) : reject(new Error('PNG encoding failed.')), 'image/png'));
      download(blob, `veil-media-${width}x${height}.png`);
      status.textContent = `Exported ${width} × ${height} PNG.`;
    } catch(error) { status.textContent = `Export failed: ${(error as Error).message}`; }
    finally {
      scene.background = oldBackground; renderer.setPixelRatio(ratio); renderer.setSize(oldSize.x, oldSize.y, false);
      camera.aspect = oldAspect; camera.view = oldView; camera.updateProjectionMatrix(); renderer.render(scene, camera);
      exporting = false; capture.disabled = false;
    }
  };
  return {
    get exporting() {return exporting;},
    restore(value: unknown) {
      const v = value as ReturnType<typeof snapshot> | undefined;
      const vector = (x: unknown): x is number[] => Array.isArray(x) && x.length === 3 && x.every(n => typeof n === 'number' && Number.isFinite(n) && Math.abs(n) < 100);
      if(!v || v.version !== 1 || !v.camera || !vector(v.camera.position) || !vector(v.camera.target) || !Number.isFinite(v.camera.fov) || v.camera.fov < 10 || v.camera.fov > 90) return;
      if(v.size in sizes) size.value = v.size;
      if(['forest','transparent','black','white'].includes(v.background)) background.value = v.background;
      camera.position.fromArray(v.camera.position); o.target.fromArray(v.camera.target); camera.fov = v.camera.fov;
      camera.lookAt(o.target); camera.updateProjectionMatrix(); status.textContent = 'Shot camera and output settings restored.';
    },
    dispose() {window.removeEventListener('keydown', onKey); section.remove(); returnZone.remove();},
  };
}
