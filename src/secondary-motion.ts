import * as THREE from 'three';
import {createRigidState,stepConstrained,type RigidState,type ConstraintSettings} from './constrained-motion';

export type ChainSettings={root:string;fps:number;settings:{Damping:number;Stiffness:number;LimitAngle:number};gravity:{X:number;Y:number;Z:number};collision:{spheres:unknown[];capsules:unknown[];planes:unknown[];asset:unknown;world:boolean};alpha:number};
export type Particle={position:THREE.Vector3;previous:THREE.Vector3};
// KawaiiPhysics' zero-gravity component-space integration and length constraint.
// Equations checked against upstream AnimNode_KawaiiPhysicsSimulation.cpp.
// The loaded virtual-bone constraint layer is solved after this chain.
export function stepParticle(p:Particle,anchor:THREE.Vector3,target:THREE.Vector3,settings:ChainSettings['settings']){
 const velocity=p.position.clone().sub(p.previous).multiplyScalar(1-settings.Damping);
 p.previous.copy(p.position);p.position.add(velocity).lerp(target,settings.Stiffness);
 const length=target.distanceTo(anchor),direction=p.position.clone().sub(anchor);
 if(direction.lengthSq()<1e-12)direction.copy(target).sub(anchor);
 p.position.copy(anchor).add(direction.normalize().multiplyScalar(length));
}
type Chain={source:ChainSettings;root:THREE.Bone;child:THREE.Bone;particle:Particle;length:number;rigid?:RigidState};
export function createSecondaryMotion(data:{kawaii:ChainSettings[];constrained?:ConstraintSettings[]}){
 for(const n of data.kawaii){if(n.fps!==60||n.settings.LimitAngle!==0||Object.values(n.gravity).some(v=>v!==0)||n.collision.world||n.collision.asset||n.collision.spheres.length||n.collision.capsules.length||n.collision.planes.length)throw Error('Unsupported loaded motion configuration');}
 let chains:Chain[]=[],registered:THREE.Bone[]=[];
 function reset(){chains=[];registered=[];}
 function step(group:THREE.Group,iterable:Iterable<THREE.Bone>,enabled:boolean){
  const bones=[...iterable];if(!enabled){reset();return;}
  group.updateMatrixWorld(true);
  if(bones.length!==registered.length||bones.some((b,i)=>b!==registered[i])){
   registered=bones;chains=[];
   for(const source of data.kawaii){const root=bones.find(b=>b.name===source.root),child=root?.children.find(c=>c.name===source.root.replace('_Base','_001')) as THREE.Bone|undefined;if(!root||!child)continue;const point=group.worldToLocal(child.getWorldPosition(new THREE.Vector3()));chains.push({source,root,child,particle:{position:point.clone(),previous:point.clone()},length:0});}
  }
  for(const c of chains){
   const anchor=group.worldToLocal(c.root.getWorldPosition(new THREE.Vector3())),target=group.worldToLocal(c.child.getWorldPosition(new THREE.Vector3())),length=target.distanceTo(anchor);
   // Slider/model changes reset rest geometry rather than injecting an impulse.
   if(Math.abs(length-c.length)>1e-5||c.particle.position.distanceTo(target)>3){c.particle.position.copy(target);c.particle.previous.copy(target);c.length=length;c.rigid=undefined;}
   stepParticle(c.particle,anchor,target,c.source.settings);
   const delta=new THREE.Quaternion().setFromUnitVectors(target.clone().sub(anchor).normalize(),c.particle.position.clone().sub(anchor).normalize());delta.slerp(new THREE.Quaternion(),1-c.source.alpha);
   const groupQ=group.getWorldQuaternion(new THREE.Quaternion()),worldDelta=groupQ.clone().multiply(delta).multiply(groupQ.clone().invert());
   // Apply the same solution to the body's and clothing's duplicate skeletons.
   for(const root of bones.filter(b=>b.name===c.root.name)){
    const child=root.children.find(b=>b.name===c.child.name) as THREE.Bone|undefined;if(!child)continue;
    const childQ=child.getWorldQuaternion(new THREE.Quaternion()),rootQ=root.getWorldQuaternion(new THREE.Quaternion());
    root.quaternion.copy(root.parent!.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(worldDelta.clone().multiply(rootQ)));root.updateWorldMatrix(false,true);
    child.position.copy(root.worldToLocal(group.localToWorld(c.particle.position.clone())));
    child.quaternion.copy(root.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(childQ));child.updateWorldMatrix(false,true);
   }
   const constraint=data.constrained?.find(s=>s.bone===c.child.name);
   if(constraint){
    // Skeleton virtual bones retain the pre-chain target position. CopyBone
    // supplies the post-chain component rotation before AnimDynamics evaluation.
    const rotation=groupQ.clone().invert().multiply(c.child.getWorldQuaternion(new THREE.Quaternion()));
    const point=target.clone().multiplyScalar(100);
    c.rigid??=createRigidState(point,rotation,constraint);
    const solved=stepConstrained(c.rigid,point,rotation,constraint);
    const world=group.localToWorld(solved.position.multiplyScalar(.01)),worldQ=groupQ.clone().multiply(solved.rotation);
    for(const child of bones.filter(b=>b.name===c.child.name)){
     child.position.copy(child.parent!.worldToLocal(world.clone()));
     child.quaternion.copy(child.parent!.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(worldQ));child.updateWorldMatrix(false,true);
    }
   }
  }
 }
 return {step,reset};
}
