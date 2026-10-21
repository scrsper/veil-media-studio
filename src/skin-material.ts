import * as THREE from 'three';

// Adapt the loaded skin parameters to Three's BRDF. Diffuse-normal smoothing
// follows SP_Head.NormalScale; it is not Unreal's screen-space Burley diffusion.
export function configureSkinMaterial(mat:THREE.MeshStandardMaterial,data:any){
 const settings=data.materials[mat.name];if(!settings)return;
 const source=settings.scalars,loader=new THREE.TextureLoader();
 const empty=new THREE.DataTexture(new Uint8Array([0,0,0,0]),1,1);empty.needsUpdate=true;
 const dye=settings.textures.SkinColorMask?loader.load('/assets/textures/'+settings.textures.SkinColorMask+'.png'):empty;
 dye.flipY=false;dye.colorSpace=THREE.NoColorSpace;
 const u={skinTint:{value:new THREE.Color(1,1,1)},skinGlossOffset:{value:0},skinSpecular:{value:.08*(source.Spec??.5)},skinNormalDiffusion:{value:data.profile.NormalScale??.25},skinDye:{value:dye},makeupColorMap:{value:empty},makeupSurfaceMap:{value:empty}};
 mat.userData.skinUniforms=u;mat.userData.sourceSkin=settings;
 mat.color.set(0xffffff);mat.roughness=1;mat.metalness=0;mat.metalnessMap=null;
 mat.normalScale.set(source['Base Normal Intensity']??.7,-(source['Base Normal Intensity']??.7));mat.aoMapIntensity=1;
 const previous=mat.onBeforeCompile;
 mat.onBeforeCompile=(shader,renderer)=>{previous.call(mat,shader,renderer);Object.assign(shader.uniforms,u);
  if(mat.userData.continuousSkin){
   shader.vertexShader='attribute float _skin_detail_weight; varying float vSkinDetailWeight;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvSkinDetailWeight=_skin_detail_weight;');
   shader.fragmentShader='varying float vSkinDetailWeight;\n'+shader.fragmentShader;
  }
  shader.fragmentShader=`uniform vec3 skinTint;uniform float skinGlossOffset;uniform float skinSpecular;uniform float skinNormalDiffusion;uniform sampler2D skinDye;uniform sampler2D makeupColorMap;uniform sampler2D makeupSurfaceMap;vec3 skinDiffuseNormal;\n`+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
float protectedMouth=texture2D(skinDye,vMapUv).a;
diffuseColor.rgb*=mix(skinTint,vec3(1.0),protectedMouth);
vec4 makeupLayer=texture2D(makeupColorMap,vMapUv);
float makeupAllowed=1.0-protectedMouth;
diffuseColor.rgb=diffuseColor.rgb*(1.0-makeupLayer.a*makeupAllowed)+makeupLayer.rgb*makeupAllowed;`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
roughnessFactor=clamp(roughnessFactor+skinGlossOffset,0.06,1.0);
vec4 makeupSurface=texture2D(makeupSurfaceMap,vMapUv);
roughnessFactor=roughnessFactor*(1.0-makeupSurface.a*makeupAllowed)+makeupSurface.r*makeupAllowed;`);
  if(mat.userData.continuousSkin){
   shader.fragmentShader=shader.fragmentShader.replace('roughnessFactor=clamp(roughnessFactor+skinGlossOffset','roughnessFactor=mix(0.65,roughnessFactor,vSkinDetailWeight);\nroughnessFactor=clamp(roughnessFactor+skinGlossOffset');
   shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',THREE.ShaderChunk.normal_fragment_maps.replaceAll('normalScale','(normalScale * vSkinDetailWeight)')+'\nskinDiffuseNormal=normalize(mix(nonPerturbedNormal,normal,skinNormalDiffusion));');
  }
  shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
skinDiffuseNormal=normalize(mix(nonPerturbedNormal,normal,skinNormalDiffusion));`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <lights_physical_fragment>',`#include <lights_physical_fragment>
material.specularColor=vec3(skinSpecular);`);
  let physical=THREE.ShaderChunk.lights_physical_pars_fragment;
  physical=physical.replace('material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords )','material.diffuseColor * LTC_Evaluate( skinDiffuseNormal, viewDir, position, mat3( 1.0 ), rectCoords )');
  physical=physical.replace('reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );','reflectedLight.directDiffuse += saturate(dot(skinDiffuseNormal,directLight.direction)) * directLight.color * BRDF_Lambert( material.diffuseColor );');
  shader.fragmentShader=shader.fragmentShader.replace('#include <lights_physical_pars_fragment>',physical);
 };
 mat.customProgramCacheKey=()=> 'skin-source-parameters-eight-v3-'+!!mat.userData.continuousSkin;mat.needsUpdate=true;
}

