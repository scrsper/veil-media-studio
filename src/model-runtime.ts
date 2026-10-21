import metadata from './model-runtime.json';

// glTF material indices remain stable even when the loader clones materials.
export function isExternallyControlledMaterial(modelName:string,materialIndex:number|undefined):boolean{
  if(materialIndex===undefined)return false;
  const file=`public/assets/${modelName}.glb`;
  return metadata.models.some(record=>record.file===file&&record.visibilityMaterialIndices.includes(materialIndex));
}
