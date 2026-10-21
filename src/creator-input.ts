import './creator-input.css';

type Options = {
  root: HTMLElement;
  canvas: HTMLCanvasElement;
  busy: () => boolean;
  camera: (yaw: number, pitch: number, zoom: number) => void;
};

// Standard browser gamepad layout: Xbox / PlayStation / compatible controllers.
// This adapter uses existing DOM handlers so every input shares the same appearance state.
export function installCreatorInput({root, canvas, busy, camera}: Options) {
  const abort = new AbortController(), signal = abort.signal;
  const selector = 'button,input:not([type=hidden]):not([type=file]),select,summary,[tabindex="0"]';
  const zones = ['#main-tabs', '.appearance-tools', '#categories', '.editor-content', '.camera', '.input-toolbar', '.media-return-zone'];
  let mode = 'mouse', lastFocus: HTMLElement | null = null, focusZone = 0, focusIndex = 0;
  let restoreFocus: HTMLElement | null = null, colorTarget: HTMLInputElement | null = null;
  let colorOriginal = '', padIndex = -1, armed = false, editingLight = false;
  const held = new Map<string, number>();
  canvas.tabIndex = 0;
  canvas.setAttribute('aria-label', 'Character view. Arrow keys rotate; plus and minus zoom.');
  const toolbar = document.createElement('div');
  toolbar.className = 'input-toolbar';
  toolbar.innerHTML = '<span id="input-hint">Drag to rotate · Scroll to zoom</span><button type="button" id="input-help" aria-haspopup="dialog">Controls <kbd>?</kbd></button>';
  root.append(toolbar);
  const hint = toolbar.querySelector('span')!;
  const dialog = document.createElement('dialog');
  dialog.className = 'input-dialog';
  dialog.setAttribute('aria-label', 'Creator controls');
  root.append(dialog);
  const helpButton = toolbar.querySelector<HTMLButtonElement>('button')!;

  function visible(el: HTMLElement) {
    return !el.matches(':disabled') && !el.closest('[inert],[hidden]') && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
  }
  function items(scope: ParentNode = dialog.open ? dialog : root) {
    return Array.from(scope.querySelectorAll<HTMLElement>(selector)).filter(visible);
  }
  function focus(el?: HTMLElement) {
    if (!el) return;
    el.focus({preventScroll: true});
    el.scrollIntoView({block: 'nearest', inline: 'nearest'});
    lastFocus = el;
  }
  function setMode(next: string) {
    mode = next; root.dataset.input = next;
    hint.textContent = next === 'controller'
      ? 'D-pad navigate · A / × select · LB / RB tabs · Y / △ panels'
      : next === 'keyboard' ? 'Tab navigate · ← → adjust · F6 panels · Q / E tabs' : 'Drag to rotate · Scroll to zoom';
  }
  function closeDialog(cancel = false) {
    if (cancel && colorTarget) {colorTarget.value = colorOriginal; change(colorTarget);}
    dialog.close(); colorTarget = null;
    if (restoreFocus?.isConnected && visible(restoreFocus)) focus(restoreFocus);
  }
  function showHelp() {
    if (dialog.open) {closeDialog(); return;}
    restoreFocus = document.activeElement as HTMLElement;
    dialog.innerHTML = `<h2>Make it yours</h2><p>Switch between mouse, keyboard and controller at any time.</p>
      <div class="control-guide"><section><h3>Mouse & keyboard</h3><p>Drag the character to rotate. Scroll to zoom.</p><p><kbd>Tab</kbd> / <kbd>Shift Tab</kbd> Move focus<br><kbd>Enter</kbd> / <kbd>Space</kbd> Select<br><kbd>← →</kbd> Adjust focused sliders<br><kbd>F6</kbd> / <kbd>Shift F6</kbd> Change panel<br><kbd>Q E</kbd> Previous / next section<br><kbd>Esc</kbd> Close / return to sections</p><p>Focus the character view to rotate with arrows and zoom with <kbd>+</kbd> / <kbd>−</kbd>.</p></section>
      <section><h3>Controller</h3><p><kbd>D-pad / left stick</kbd> Navigate<br><kbd>← →</kbd> Adjust slider / choice<br><kbd>A / ×</kbd> Select / edit color or light pad<br><kbd>B / ○</kbd> Back / cancel color<br><kbd>LB RB / L1 R1</kbd> Change section<br><kbd>Y / △</kbd> Next panel<br><kbd>Right stick</kbd> Rotate character<br><kbd>LT RT / L2 R2</kbd> Zoom out / in<br><kbd>Menu / Options</kbd> This guide</p><p>Connect a standard controller, then press and release a button. File import uses your system's file picker and may need a mouse or keyboard.</p></section></div><button type="button" class="primary">Done</button>`;
    dialog.querySelector('button')!.onclick = () => closeDialog();
    dialog.showModal(); focus(dialog.querySelector('button')!);
  }
  function change(el: HTMLInputElement | HTMLSelectElement) {
    el.dispatchEvent(new Event('input', {bubbles: true}));
    el.dispatchEvent(new Event('change', {bubbles: true}));
  }
  function showColor(target: HTMLInputElement) {
    restoreFocus = target; colorTarget = target; colorOriginal = target.value;
    dialog.innerHTML = '<h2>Edit color</h2><p>Tab or controller up / down selects a channel. Left / right adjusts it. Escape / B cancels.</p><div class="color-preview"></div><div class="color-channels"></div><button type="button" class="primary">Done</button>';
    const title = target.getAttribute('aria-label') || target.closest('label')?.textContent?.trim() || 'Color';
    dialog.querySelector('h2')!.textContent = title;
    const channels = ['Red', 'Green', 'Blue'];
    for (let i = 0; i < 3; i++) {
      const row = document.createElement('label');
      row.innerHTML = `${channels[i]}<input type="range" min="0" max="255" step="1" aria-label="${channels[i]}"><output></output>`;
      const input = row.querySelector('input')!;
      input.value = String(parseInt(target.value.slice(1+i*2, 3+i*2), 16));
      row.querySelector('output')!.value = input.value;
      input.oninput = () => {
        row.querySelector('output')!.value = input.value;
        target.value = '#' + Array.from(dialog.querySelectorAll('input')).map(x => (+x.value).toString(16).padStart(2, '0')).join('');
        (dialog.querySelector('.color-preview') as HTMLElement).style.background = target.value;
        change(target);
      };
      dialog.querySelector('.color-channels')!.append(row);
    }
    (dialog.querySelector('.color-preview') as HTMLElement).style.background = target.value;
    dialog.querySelector('button')!.onclick = () => closeDialog();
    dialog.showModal(); focus(dialog.querySelector('input')!);
  }
  function section(delta: number) {
    if (busy() || dialog.open) return;
    const tabs = items(root.querySelector('#main-tabs')!);
    const i = tabs.findIndex(t => t.classList.contains('active'));
    const next = tabs[(i + delta + tabs.length) % tabs.length];
    next?.click(); focus(next);
  }
  function panel(delta = 1) {
    if (dialog.open) return;
    const current = zones.findIndex(z => document.activeElement?.closest(z));
    for (let step = 1; step <= zones.length; step++) {
      const index = (current + delta * step + zones.length * 2) % zones.length;
      const container = root.querySelector(zones[index]);
      const choices = container ? items(container) : [];
      if (choices.length) {focus(choices[0]); return;}
    }
  }
  function back() {
    const returnToEditor = root.querySelector<HTMLButtonElement>('.media-return:not([hidden])');
    if(returnToEditor) {returnToEditor.click(); return;}
    if (editingLight) {editingLight=false; setMode(mode); return;}
    if (dialog.open) {closeDialog(true); return;}
    const disclosure = document.activeElement?.closest('details[open]');
    if (disclosure) {(disclosure as HTMLDetailsElement).open = false; focus(disclosure.querySelector('summary')!); return;}
    focus(root.querySelector('#main-tabs .active') as HTMLElement);
  }
  function adjust(el: HTMLElement, delta: number): boolean {
    if (el instanceof HTMLInputElement && ['range', 'number'].includes(el.type)) {
      const min = el.min === '' ? -Number.MAX_SAFE_INTEGER : +el.min, max = el.max === '' ? Number.MAX_SAFE_INTEGER : +el.max;
      el.value = String(Math.max(min, Math.min(max, (+el.value || 0) + delta * (+el.step || 1)))); change(el); return true;
    }
    if (el instanceof HTMLSelectElement) {
      const available = Array.from(el.options).filter(o => !o.disabled);
      const i = available.findIndex(o => o.selected);
      el.value = available[Math.max(0, Math.min(available.length - 1, i + delta))]?.value ?? el.value;
      change(el); return true;
    }
    return false;
  }
  function navigate(x: number, y: number) {
    const all = items(), active = document.activeElement as HTMLElement;
    if (!all.includes(active)) {focus(all[0]); return;}
    if (x && adjust(active, x)) return;
    if (active.id === 'light-pad' && editingLight) {active.dispatchEvent(new KeyboardEvent('keydown', {key:x ? x > 0 ? 'ArrowRight' : 'ArrowLeft' : y > 0 ? 'ArrowDown' : 'ArrowUp', bubbles:true})); return;}
    // Within thumbnail grids, directional focus follows the visible grid. Else up/down
    // follows document order, including items below the scroll edge.
    const grid = active.closest('.hair-grid,.native-face-grid,.head-choice-grid,.preset-grid');
    if (grid) {
      const a = active.getBoundingClientRect(), ax = a.x+a.width/2, ay = a.y+a.height/2;
      const candidates = items(grid).filter(e => e !== active).map(el => {
        const b = el.getBoundingClientRect(), dx = b.x+b.width/2-ax, dy = b.y+b.height/2-ay;
        return {el, forward:dx*x+dy*y, side:Math.abs(dx*y-dy*x)};
      }).filter(v => v.forward > 4).sort((a,b) => a.forward+a.side*3-b.forward-b.side*3);
      if (candidates.length) {focus(candidates[0].el); return;}
    }
    focus(all[(all.indexOf(active) + (y || x) + all.length) % all.length]);
  }
  function activate() {
    let el = document.activeElement as HTMLElement;
    if (!items().includes(el)) {focus(items()[0]); return;}
    if (el.id === 'light-pad') {editingLight=!editingLight; setMode(mode); if(editingLight) hint.textContent='D-pad moves lighting · A / × or B / ○ finishes'; return;}
    if (el instanceof HTMLInputElement && el.type === 'color') {showColor(el); return;}
    if (el instanceof HTMLSelectElement) {adjust(el, 1); return;}
    // File dialogs require trusted activation; never attempt a synthetic picker.
    if (el.id === 'load' || el.id === 'import-preset') {
      hint.textContent = 'Load appearance: use Enter or a mouse to open the system file picker.'; return;
    }
    el.click();
  }
  helpButton.onclick = showHelp;
  dialog.addEventListener('cancel', e => {e.preventDefault(); closeDialog(true);}, {signal});
  root.addEventListener('focusin', e => {
    lastFocus = e.target as HTMLElement;
    if (editingLight && lastFocus.id !== 'light-pad') {editingLight=false; setMode(mode);}
    const z = zones.findIndex(z => lastFocus?.closest(z));
    if (z >= 0) {focusZone = z; focusIndex = items(root.querySelector(zones[z])!).indexOf(lastFocus);}
  }, {signal});
  const observer = new MutationObserver(() => {
    if (mode === 'mouse' || dialog.open || busy() || !lastFocus || lastFocus.isConnected) return;
    const zone = root.querySelector(zones[focusZone]), list = zone ? items(zone) : items();
    focus(list[Math.max(0, Math.min(focusIndex, list.length-1))]);
  });
  observer.observe(root, {childList:true, subtree:true, attributes:true, attributeFilter:['inert']});
  root.addEventListener('pointerdown', () => setMode('mouse'), {signal});
  root.addEventListener('pointermove', e => {if ((e.movementX || e.movementY) && mode !== 'mouse') setMode('mouse');}, {signal});
  document.addEventListener('keydown', e => {
    if (!root.contains(document.activeElement) && document.activeElement !== document.body) return;
    setMode('keyboard');
    const el = e.target as HTMLElement;
    if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
    const typing = el.matches('textarea,[contenteditable=true],input:not([type=range]):not([type=checkbox]):not([type=color])');
    if (e.key === 'Escape') {e.preventDefault(); back(); return;}
    if (typing) return;
    if (dialog.open) return;
    if (e.key === 'F6') {e.preventDefault(); panel(e.shiftKey ? -1 : 1);}
    if (e.key.toLowerCase() === 'q' || e.key.toLowerCase() === 'e') {e.preventDefault(); if (!e.repeat) section(e.key.toLowerCase() === 'q' ? -1 : 1);}
    if (e.key === '?') {e.preventDefault(); if (!e.repeat) showHelp();}
    if (el instanceof HTMLInputElement && el.type === 'color' && (e.key === 'Enter' || e.key === ' ')) {e.preventDefault(); showColor(el);}
    if (el === canvas && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','_'].includes(e.key)) {
      e.preventDefault(); camera(e.key==='ArrowLeft'?-.09:e.key==='ArrowRight'?.09:0, e.key==='ArrowUp'?-.06:e.key==='ArrowDown'?.06:0, ['+','='].includes(e.key)?-.08:['-','_'].includes(e.key)?.08:0);
    }
  }, {signal});

  function repeat(key: string, down: boolean, now: number, action: () => void, repeats = false) {
    if (!down) {held.delete(key); return;}
    const next = held.get(key);
    if (next === undefined) {held.set(key, now+380); action();}
    else if (repeats && now >= next) {held.set(key, now+110); action();}
  }
  function pause() {armed = false; held.clear();}
  window.addEventListener('blur', pause, {signal});
  document.addEventListener('visibilitychange', pause, {signal});
  window.addEventListener('gamepaddisconnected', () => {pause(); padIndex = -1; if(mode==='controller') setMode('keyboard');}, {signal});
  function step(now: number, dt: number) {
    if (document.hidden || !document.hasFocus()) {pause(); return;}
    let pads: (Gamepad | null)[];
    try {pads = Array.from(navigator.getGamepads?.() || []);} catch {return;}
    const active = (p:Gamepad) => p.buttons.some(b=>b.pressed) || p.axes.some(a=>Math.abs(a)>.25);
    const pad = pads.find(p=>p?.connected && p.mapping==='standard' && active(p)) || pads.find(p=>p?.connected && p.index===padIndex && p.mapping==='standard');
    if (!pad) return;
    if (pad.index !== padIndex) {padIndex = pad.index; pause();}
    if (!armed) {if(!active(pad)) armed=true; return;}
    if (active(pad)) {if(mode!=='controller') setMode('controller');}
    const button = (i:number) => !!pad.buttons[i]?.pressed;
    const axis = (i:number) => {const v=pad.axes[i] || 0; return Math.abs(v)<.25 ? 0 : Math.sign(v)*(Math.abs(v)-.25)/.75;};
    repeat('help',button(9),now,showHelp);
    repeat('back',button(1),now,back);
    if (busy()) {pause(); return;}
    repeat('select',button(0),now,activate);
    repeat('panel',button(3),now,()=>panel());
    repeat('prev',button(4),now,()=>section(-1));
    repeat('next',button(5),now,()=>section(1));
    repeat('up',button(12)||axis(1)<-.5,now,()=>navigate(0,-1),true);
    repeat('down',button(13)||axis(1)>.5,now,()=>navigate(0,1),true);
    repeat('left',button(14)||axis(0)<-.5,now,()=>navigate(-1,0),true);
    repeat('right',button(15)||axis(0)>.5,now,()=>navigate(1,0),true);
    if (!dialog.open) {
      const trigger = (i:number) => Math.max(0, (pad.buttons[i]?.value || 0)-.1)/.9;
      const zoom = trigger(6)-trigger(7), x=axis(2), y=axis(3);
      if(x||y||zoom) camera(x*Math.min(dt,.05)*1.8,y*Math.min(dt,.05)*1.2,zoom*Math.min(dt,.05)*1.4);
    }
  }
  return {step, dispose() {abort.abort(); observer.disconnect(); dialog.remove(); toolbar.remove(); canvas.removeAttribute('tabindex'); delete root.dataset.input;}};
}
