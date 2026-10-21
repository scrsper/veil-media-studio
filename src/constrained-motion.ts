import {Vector3 as V,Quaternion as Q,MathUtils} from 'three';

export type ConstraintSettings={bone:string;box:number[];offset:number[];min:number[];max:number[];angularMin:number[];angularMax:number[];linearDamping:number;angularDamping:number;linearSpring:number;angularSpring:number;gravity:number;pre:number;post:number};
export type RigidState={position:V;rotation:Q;velocity:V;momentum:V};
const axes=[new V(1,0,0),new V(0,1,0),new V(0,0,1)];
// Component-space centimeters, unit mass. loaded box dimensions are full extents.
// This specialized browser solver preserves the loaded limits and coefficients;
// it is not a binary-equivalent port of Unreal's general AnimDynamics solver.
export function createRigidState(anchor:V,rotation:Q,s:ConstraintSettings):RigidState{
 return {position:anchor.clone().add(new V().fromArray(s.offset).applyQuaternion(rotation)),rotation:rotation.clone(),velocity:new V(),momentum:new V()};
}
export function stepConstrained(b:RigidState,anchor:V,rotation:Q,s:ConstraintSettings,dt=1/60){
 const [x,y,z]=s.box,inv=new V(12/(y*y+z*z),12/(x*x+z*z),12/(x*x+y*y));
 const inertia=(v:V)=>v.clone().applyQuaternion(b.rotation.clone().invert()).multiply(inv).applyQuaternion(b.rotation);
 const lever=new V().fromArray(s.offset).negate().applyQuaternion(b.rotation);
 b.velocity.multiplyScalar(Math.pow(1-s.linearDamping,dt)).addScaledVector(b.position.clone().sub(anchor),-s.linearSpring*dt);
 b.velocity.y-=980*s.gravity*dt;
 b.momentum.multiplyScalar(Math.pow(1-s.angularDamping,dt));
 // Source angular spring aligns local UE Y (browser Z) with the animated target.
 const current=axes[2].clone().applyQuaternion(b.rotation),target=axes[2].clone().applyQuaternion(rotation);
 b.momentum.addScaledVector(current.cross(target),s.angularSpring*dt);
 type Limit={axis:V;target:number;min:number;max:number;sum:number;angular:boolean};
 const limits:Limit[]=[],joint=b.position.clone().add(lever),relative=b.rotation.clone().premultiply(rotation.clone().invert());
 if(relative.w<0)relative.set(-relative.x,-relative.y,-relative.z,-relative.w);
 const angle=2*Math.acos(MathUtils.clamp(relative.w,-1,1)),sin=Math.sqrt(Math.max(0,1-relative.w*relative.w));
 const rotvec=new V(relative.x,relative.y,relative.z).multiplyScalar(sin>1e-8?angle/sin:2);
 for(let i=0;i<3;i++){
  const axis=axes[i].clone().applyQuaternion(rotation),distance=joint.clone().sub(anchor).dot(axis);
  const add=(value:number,low:number,high:number,angular:boolean)=>limits.push({axis,target:value,min:low,max:high,sum:0,angular});
  if(s.min[i]===s.max[i])add(-(distance-s.min[i])/dt,-Infinity,Infinity,false);
  else {add(-(distance-s.min[i])/dt,0,Infinity,false);add(-(distance-s.max[i])/dt,-Infinity,0,false);}
  const low=MathUtils.degToRad(s.angularMin[i]),high=MathUtils.degToRad(s.angularMax[i]),a=rotvec.getComponent(i);
  if(low===high)add(-(a-low)/dt,-Infinity,Infinity,true);
  else {add(-(a-low)/dt,0,Infinity,true);add(-(a-high)/dt,-Infinity,0,true);}
 }
 function solve(post=false){for(const l of limits){
  const spin=inertia(b.momentum),velocity=l.angular?spin:b.velocity.clone().add(spin.cross(lever));
  const denom=l.angular?l.axis.dot(inertia(l.axis)):1+l.axis.dot(inertia(lever.clone().cross(l.axis)).cross(lever));
  const wanted=post&&l.angular?(l.min<0?0:Math.min(l.target,0)):l.target;
  const next=MathUtils.clamp(l.sum+(wanted-velocity.dot(l.axis))/denom,l.min,l.max),impulse=l.axis.clone().multiplyScalar(next-l.sum);l.sum=next;
  if(l.angular)b.momentum.add(impulse);else{b.velocity.add(impulse);b.momentum.add(lever.clone().cross(impulse));}
 }}
 // Solve linear limits before angular limits, matching the loaded engine stage order.
 limits.sort((a,b)=>Number(a.angular)-Number(b.angular));
 for(let i=0;i<s.pre;i++)solve();
 const nextPosition=b.position.clone().addScaledVector(b.velocity,dt),spin=inertia(b.momentum),speed=spin.length();
 const nextRotation=b.rotation.clone();if(speed>1e-10)nextRotation.premultiply(new Q().setFromAxisAngle(spin.divideScalar(speed),speed*dt)).normalize();
 for(let i=0;i<s.post;i++)solve(true);
 b.position.copy(nextPosition);b.rotation.copy(nextRotation);
 // Enforce the loaded locked swing and ±1 degree twist after finite-step integration.
 const local=b.rotation.clone().premultiply(rotation.clone().invert());
 const twist=MathUtils.clamp(2*Math.atan2(local.z,local.w),MathUtils.degToRad(s.angularMin[2]),MathUtils.degToRad(s.angularMax[2]));
 b.rotation.copy(rotation).multiply(new Q().setFromAxisAngle(axes[2],twist));
 const output=b.position.clone().sub(new V().fromArray(s.offset).applyQuaternion(b.rotation));
 const delta=output.clone().sub(anchor).applyQuaternion(rotation.clone().invert());
 for(let i=0;i<3;i++)delta.setComponent(i,MathUtils.clamp(delta.getComponent(i),s.min[i],s.max[i]));
 output.copy(anchor).add(delta.applyQuaternion(rotation));
 b.position.copy(output).add(new V().fromArray(s.offset).applyQuaternion(b.rotation));
 return {position:output,rotation:b.rotation.clone()};
}
