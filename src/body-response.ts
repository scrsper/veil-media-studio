import * as THREE from 'three';
import {toRaw,type GameRange,bodyParameters} from './game-parameters';

export function bodyRawValues(values:Record<string,number>,ranges:Record<string,GameRange>){
 return Object.fromEntries(Object.entries(bodyParameters).map(([ui,param])=>[param,toRaw(values[ui]??50,ranges[param])]));
}
// Targets come from the original body RigVM and ranges from PcCustomizeFeatureTable_Bone.
// Conversion from each scalar to a scale vector remains a reconstruction of the native evaluator.
export function applySourceBody(group:THREE.Group,boneIterable:Iterable<THREE.Bone>,values:Record<string,number>,ranges:Record<string,GameRange>,bodyType:string){
 const bones=[...boneIterable],hasPelvisWidth=bodyType==='Veil_Female',raw=bodyRawValues(values,ranges),changes=new Map<THREE.Bone,THREE.Vector3>();
 group.scale.setScalar(1);group.position.y=0;
 for(const b of bones){b.matrixAutoUpdate=true;b.updateMatrix();}group.updateMatrixWorld(true);
 const foot=bones.find(b=>b.name==='Bip001-L-Foot'),baseFootY=foot?.getWorldPosition(new THREE.Vector3()).y??0;
 const scale=(b:THREE.Bone,x:number,y=x,z=x)=>changes.set(b,new THREE.Vector3(x,y,z));
 const worldAxisScale=(b:THREE.Bone,value:number,axis:THREE.Vector3)=>{const q=b.getWorldQuaternion(new THREE.Quaternion()).invert(),local=axis.clone().applyQuaternion(q);const a=[Math.abs(local.x),Math.abs(local.y),Math.abs(local.z)],s=new THREE.Vector3(1,1,1);s.setComponent(a.indexOf(Math.max(...a)),value);changes.set(b,s);};
 for(const b of bones){const n=b.name;
  if(n==='Bip001-Head')scale(b,raw.Size_Head);
  if(/^(b_[LR]_Breast_Base|[LR]_Breast)$/.test(n))scale(b,raw.Size_Breast);
  if(n==='Stomach')worldAxisScale(b,raw.Width_Waist,new THREE.Vector3(1,0,0));
  if(n==='Pelvis_Width'||(!hasPelvisWidth&&n==='Bip001-Pelvis'))worldAxisScale(b,raw.Width_Pelvis,new THREE.Vector3(1,0,0));
  if(/^[LR]_Butt$/.test(n)){scale(b,raw.Size_Butt);const up=new THREE.Vector3(0,raw.UpDown_Butt/100,0).applyQuaternion(b.parent!.getWorldQuaternion(new THREE.Quaternion()).invert());b.position.add(up);}
  if(/^Bip001-[LR]-Clavicle$/.test(n)){const q=b.parent!.getWorldQuaternion(new THREE.Quaternion()),world=b.position.clone().applyQuaternion(q);world.x*=raw.Width_Shoulder;b.position.copy(world.applyQuaternion(q.invert()));}
  if(/^Bip001-[LR]-UpperArm$/.test(n))scale(b,raw.Length_UpperArm,raw.Thick_Arm,raw.Thick_Arm);
  if(/^Bip001-[LR]-Forearm$/.test(n))scale(b,toRaw(values['Arm Length']??50,ranges.Length_LowerArm),raw.Thick_Arm,raw.Thick_Arm);
  if(/^Bip001-[LR]-Thigh$/.test(n))scale(b,raw.Length_Thigh,raw.Thick_Leg,raw.Thick_Leg);
  if(/^Bip001-[LR]-Calf$/.test(n))scale(b,raw.Length_Calf,raw.Thick_Leg,raw.Thick_Leg);
  if(/^Bip001-[LR]-Foot$/.test(n))worldAxisScale(b,raw.Width_Foot,new THREE.Vector3(1,0,0));
  // Overall thickness must reach vertices attached to the primary limb and
  // twist bones too. Muscle controls add their own multiplier only once.
  if(/^[LR]_Quadriceps$/.test(n))scale(b,1,raw.Thick_Quadriceps,raw.Thick_Quadriceps);
  if(/^[LR]_CalfMuscle$/.test(n))scale(b,1,raw.Thick_CalfMuscle,raw.Thick_CalfMuscle);
 }
 for(const [b,s]of changes)b.scale.multiply(s);
 for(const b of bones){b.updateMatrix();const parentScale=changes.get(b.parent as THREE.Bone);
  if(parentScale&&(/^Bip001-[LR]-(Calf|Foot|Forearm|Hand)$/.test(b.name)||(!hasPelvisWidth&&b.parent?.name==='Bip001-Pelvis'))){
   // Keep the new joint position, but cancel inherited stretch in the child's
   // linear transform. Retain the matrix so a rotated foot cannot acquire shear
   // from decomposing a non-uniform compensation back into a quaternion.
   const e=b.matrix.elements;for(let col=0;col<3;col++){e[col*4]/=parentScale.x;e[col*4+1]/=parentScale.y;e[col*4+2]/=parentScale.z;}
   b.matrixAutoUpdate=false;
  }
 }
 group.scale.setScalar(raw.Height);group.updateMatrixWorld(true);
 if(foot){const y=foot.getWorldPosition(new THREE.Vector3()).y;group.position.y=baseFootY*raw.Height-y;group.updateMatrixWorld(true);}
 return raw;
}

