import * as THREE from 'three';

export type Spring={position:number;velocity:number};
// Analytic critically damped response: stable even when rendering is irregular.
export function follow(s:Spring,target:number,dt:number,rate:number){
 const error=s.position-target,c=s.velocity+rate*error,e=Math.exp(-rate*dt);
 s.position=target+(error+c*dt)*e;s.velocity=(s.velocity-rate*c*dt)*e;
}
export function createLookTracking(canvas:HTMLCanvasElement,camera:THREE.Camera){
 const pointer=new THREE.Vector2(),ray=new THREE.Raycaster();let active=false,dragging=false;
 const springs=Array.from({length:4},()=>({position:0,velocity:0}));
 canvas.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||dragging)return;const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2);active=true;});
 canvas.addEventListener('pointerleave',()=>active=false);
 canvas.addEventListener('pointerdown',()=>{dragging=true;active=false;});
 window.addEventListener('pointerup',()=>dragging=false);
 window.addEventListener('blur',()=>{active=false;dragging=false;});
 function reset(){springs.forEach(s=>{s.position=0;s.velocity=0;});}
 function step(group:THREE.Group,iterable:Iterable<THREE.Bone>,enabled:boolean,dt=1/60){
  const bones=[...iterable],head=bones.find(b=>b.name==='Bip001-Head');if(!head)return;
  group.updateMatrixWorld(true);const headPosition=head.getWorldPosition(new THREE.Vector3()),groupRotation=group.getWorldQuaternion(new THREE.Quaternion());
  let yaw=0,pitch=0;
  if(enabled&&active&&!dragging){
   ray.setFromCamera(pointer,camera);const distance=Math.max(.4,camera.position.distanceTo(headPosition)*.7),target=ray.ray.at(distance,new THREE.Vector3());
   const direction=target.sub(headPosition).applyQuaternion(groupRotation.clone().invert());
   if(direction.z>0){yaw=THREE.MathUtils.clamp(Math.atan2(direction.x,direction.z),-.38,.38);pitch=THREE.MathUtils.clamp(-Math.atan2(direction.y,Math.hypot(direction.x,direction.z)),-.24,.24);}
  }
  const targets=[yaw*.5,pitch*.5,yaw,pitch];springs.forEach((s,i)=>follow(s,targets[i],dt,i<2?7:15));
  const turn=(bone:THREE.Bone,y:number,p:number)=>{
   const delta=new THREE.Quaternion().setFromEuler(new THREE.Euler(p,y,0,'YXZ'));
   const worldDelta=groupRotation.clone().multiply(delta).multiply(groupRotation.clone().invert());
   const world=bone.getWorldQuaternion(new THREE.Quaternion());
   bone.quaternion.copy(bone.parent!.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(worldDelta.multiply(world)));bone.updateWorldMatrix(false,true);
  };
  for(const b of bones)if(b.name==='Bip001-Head')turn(b,springs[0].position,springs[1].position);
  // Both eyes share a distant gaze direction, avoiding a cross-eyed near target.
  for(const b of bones)if(/^b_[LR]_Eye$/.test(b.name))turn(b,springs[2].position-springs[0].position,springs[3].position-springs[1].position);
 }
 return {step,reset};
}
