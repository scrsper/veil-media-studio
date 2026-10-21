import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const registry=JSON.parse(fs.readFileSync('ASSET-REGISTRY.json','utf8'));
const attribution=JSON.parse(fs.readFileSync('ATTRIBUTIONS.json','utf8'));
const byPath=new Map(attribution.models.map(m=>[m.file,m]));
let models=0;
for(const entry of registry.entries){
  const file=path.resolve(entry.path);
  if(!file.startsWith(process.cwd()+path.sep))throw Error('Asset path outside project: '+entry.path);
  const bytes=fs.readFileSync(file);
  const sha=crypto.createHash('sha256').update(bytes).digest('hex');
  if(sha!==entry.sha256 || bytes.length!==entry.bytes)throw Error('Asset missing, modified or still an LFS pointer: '+entry.path);
  if(entry.path.endsWith('.glb')){
    models++;
    const record=byPath.get(entry.path);
    if(!record||record.editingSha256!==sha)throw Error('Attribution does not match model: '+entry.path);
    if(bytes.subarray(0,4).toString()!=='glTF'||bytes.readUInt32LE(8)!==bytes.length)throw Error('Invalid GLB header: '+entry.path);
    const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
    for(const item of [...(json.images||[]),...(json.buffers||[])]){
      if(item.uri&&!item.uri.startsWith('data:')&&!fs.existsSync(path.resolve(path.dirname(file),decodeURIComponent(item.uri))))throw Error('Missing model dependency: '+entry.path+' -> '+item.uri);
    }
  }
}
console.log(`Verified ${registry.entries.length} assets, ${models} models and their attribution references.`);
