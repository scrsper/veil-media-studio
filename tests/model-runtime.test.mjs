import {build} from 'esbuild';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
await build({entryPoints:['src/model-runtime.ts'],bundle:true,format:'esm',outfile:'tests/model-runtime-bundle.mjs'});
const {isExternallyControlledMaterial}=await import('./model-runtime-bundle.mjs');
for(const sex of ['Female','Male']){
  const name=`Veil_${sex}_OriginalSkin`;
  const data=fs.readFileSync(`public/assets/${name}.glb`);
  const json=JSON.parse(data.subarray(20,20+data.readUInt32LE(12)));
  assert.equal(json.materials[2].extras.authoredAnatomy,undefined);
  assert.equal(isExternallyControlledMaterial(name,2),true);
  for(let i=0;i<json.materials.length;i++)if(i!==2)assert.equal(isExternallyControlledMaterial(name,i),false);
  assert.equal(isExternallyControlledMaterial(`Veil_${sex}_BaseBody`,2),false);
  assert.equal(isExternallyControlledMaterial(name,undefined),false);
  const material=new THREE.MeshStandardMaterial();
  const controlled=new WeakSet();
  if(isExternallyControlledMaterial(name,2))controlled.add(material);
  const mesh=new THREE.Mesh(new THREE.BufferGeometry(),material);
  for(const enabled of [false,true,false]){
    if(controlled.has(mesh.material))mesh.visible=enabled;
    assert.equal(mesh.visible,enabled);
  }
}
console.log('External runtime metadata: both models, material scope and visibility toggles passed.');
