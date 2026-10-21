import type {Bone} from 'three';

// The loaded Veil_Female/Veil_Male rigs address Quadriceps and CalfMuscle separately.
// These amplitudes remain provisional until the native parameter remaps are decoded.
// Keep volume changes off the parent joint chain so they cannot enlarge the feet.
export function applyLegVolume(bones:Iterable<Bone>, values:Record<string,number>){
 const scale=(name:string,amount:number)=>1+((values[name]??50)-50)/50*amount;
 const leg=scale('Leg Thickness',.12);
 for(const bone of bones){
  let thickness=1;
  if(/^[LR]_Quadriceps$/.test(bone.name))thickness=leg*scale('Thigh Thickness',.18);
  else if(/^[LR]_CalfMuscle$/.test(bone.name))thickness=leg*scale('Calf Thickness',.18);
  else if(/^[LR]_(ThighTwist|Knee)$/.test(bone.name))thickness=leg;
  else continue;
  bone.scale.y*=thickness;bone.scale.z*=thickness;
 }
}
