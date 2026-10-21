import * as THREE from 'three';
import {RectAreaLightUniformsLib} from 'three/addons/lights/RectAreaLightUniformsLib.js';

export async function createGameLighting(scene:THREE.Scene,renderer:THREE.WebGLRenderer,data:any){
 RectAreaLightUniformsLib.init();
 const target=new THREE.Vector3(0,1.35,0),lights=['KeyLight','FillLight','BackLight'].map(()=>new THREE.RectAreaLight());
 lights.forEach(l=>scene.add(l));
 const shadow=new THREE.DirectionalLight(0xffffff,.35);shadow.castShadow=true;shadow.shadow.mapSize.set(2048,2048);Object.assign(shadow.shadow.camera,{left:-2,right:2,top:3,bottom:-1});shadow.shadow.bias=-.0003;shadow.target.position.copy(target);scene.add(shadow,shadow.target);
 const environments=new Map<string,THREE.Texture>();
 const pmrem=new THREE.PMREMGenerator(renderer);
 for(const name of ['02_HDR_12288x6144','approaching_storm_4k']){
  const metadata=await fetch('/assets/lighting/'+name+'.json').then(r=>r.json());
  const bytes=await fetch('/assets/lighting/'+name+'.rgba32f').then(r=>r.arrayBuffer());
  if(bytes.byteLength!==metadata.width*metadata.height*16)throw Error('Incomplete loaded environment');
  const texture=new THREE.DataTexture(new Float32Array(bytes),metadata.width,metadata.height,THREE.RGBAFormat,THREE.FloatType);texture.mapping=THREE.EquirectangularReflectionMapping;texture.colorSpace=THREE.LinearSRGBColorSpace;texture.needsUpdate=true;
  const environment=pmrem.fromEquirectangular(texture);environments.set(name,environment.texture);texture.dispose();
 }
 pmrem.dispose();
 let mode='daylight',baseYaw=0,basePitch=0,distance=2;
 function position(light:THREE.RectAreaLight,yaw:number,pitch:number,d:number){const y=THREE.MathUtils.degToRad(yaw),p=THREE.MathUtils.degToRad(-pitch);light.position.set(Math.sin(y)*Math.cos(p)*d,target.y+Math.sin(p)*d,Math.cos(y)*Math.cos(p)*d);light.lookAt(target);}
 function updateShadow(){shadow.position.copy(lights[0].position);shadow.color.copy(lights[0].color);}
 function setMode(value:string){mode=data.lighting[value]?value:'daylight';const profile=data.lighting[mode];
  ['KeyLight','FillLight','BackLight'].forEach((name,i)=>{const p=profile.lights[name]||{},light=lights[i],rotation=p.RotationOffset||{};light.width=(p.SourceWidth||250)/100;light.height=(p.SourceHeight||300)/100;light.color.set('#'+(p.LightColor?.Hex||'FFFFFF'));
   // Preserve the loaded power ratios and source dimensions. Unreal/Three exposure differs.
   light.intensity=(p.Intensity??500)/(Math.PI*light.width*light.height*100);
   position(light,rotation.Yaw||0,rotation.Pitch||0,(p.TargetArmLength||200)/100);
   if(i===0){baseYaw=rotation.Yaw||0;basePitch=rotation.Pitch||0;distance=(p.TargetArmLength||200)/100;}
  });const cube=profile.sky?.Cubemap?.ObjectName?.split("'")[1]||'02_HDR_12288x6144';scene.environment=environments.get(cube)||environments.get('02_HDR_12288x6144')!;scene.environmentIntensity=profile.sky?.Intensity??.5;updateShadow();
 }
 function move(x:number,y:number){position(lights[0],70-x*140,-y*40,distance);updateShadow();}
 function reset(){position(lights[0],baseYaw,basePitch,distance);updateShadow();return {x:(70-baseYaw)/140,y:-basePitch/40};}
 function restorePosition(p:number[]){lights[0].position.fromArray(p);lights[0].lookAt(target);updateShadow();}
 function padPosition(){const direction=lights[0].position.clone().sub(target);const yaw=THREE.MathUtils.radToDeg(Math.atan2(direction.x,direction.z)),pitch=-THREE.MathUtils.radToDeg(Math.atan2(direction.y,Math.hypot(direction.x,direction.z)));return {x:THREE.MathUtils.clamp((70-yaw)/140,0,1),y:THREE.MathUtils.clamp(-pitch/40,0,1)};}
 setMode('daylight');return {lights,target,setMode,move,reset,restorePosition,padPosition};
}
