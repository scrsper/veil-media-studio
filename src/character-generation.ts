export type Appearance={head?:string;face:Record<string,number>;body:Record<string,number>;cosmetics:Record<string,string|number>;skin?:{color:string;gloss:number};selection?:string};
export type GenerationLocks={face:boolean;body:boolean;hair:boolean;colors:boolean};
export const studioPresets=[
 {name:'Soft features',seed:2401,face:{Chin_Width:-12,Chin_Length:-8,Eye_Size:7,Lip_Thickness:6},body:{'Shoulder Width':44,'Height':44},hair:'#493024',iris:'#856441'},
 {name:'Sculpted',seed:5307,face:{Chin_Width:12,CheekBone_Height:9,Chin_Length:5,Eye_Size:-5},body:{'Shoulder Width':58,'Waist Size':43},hair:'#211a18',iris:'#68766f'},
 {name:'Athletic',seed:7813,face:{Chin_Width:5,Nose_Size:3},body:{'Shoulder Width':62,'Arm Thickness':57,'Thigh Thickness':56,'Calf Thickness':55},hair:'#38291e',iris:'#806139'},
 {name:'Silver court',seed:9901,face:{Chin_Length:4,EyeTail_UpDown:6,NoseBridge_Height:7},body:{'Height':62,'Shoulder Width':47},hair:'#a59f95',iris:'#738394'},
 {name:'Wanderer',seed:4229,face:{Nose_Size:6,Chin_Forward:4,Lip_Width:3},body:{'Height':53,'Waist Size':47,'Leg Thickness':49},hair:'#684a30',iris:'#6d704d'},
 {name:'Warm copper',seed:6751,face:{AppleZone_Height:5,Lip_Thickness:5,Eye_Size:3},body:{'Height':47,'Hip Size':54},hair:'#813d24',iris:'#5c785d'}
];
export function seeded(seed:number){let n=seed>>>0;return ()=>{n+=0x6D2B79F5;let t=n;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
const clamp=(v:number)=>Math.round(Math.min(100,Math.max(0,v)));
export function generateCharacter(base:Appearance,seed:number,hairs:string[],locks:GenerationLocks,presetIndex?:number):Appearance{
 const next=structuredClone(base),random=seeded(seed),preset=presetIndex===undefined?null:studioPresets[presetIndex];
 const balanced=(spread:number)=>(random()+random()+random()-1.5)*spread;
 if(!locks.face)for(const name in next.face){if(name.startsWith('Native_')){next.face[name]=0;continue;}next.face[name]=clamp(base.face[name]+balanced(preset?7:15)+(preset?.face[name as keyof typeof preset.face]??0));}
 if(!locks.body)for(const name in next.body)next.body[name]=clamp(preset?.body[name as keyof typeof preset.body]??(base.body[name]+balanced(14)));
 if(!locks.hair&&hairs.length)next.cosmetics.hair=hairs[Math.floor(random()*hairs.length)];
 if(!locks.colors){
  const hair=preset?.hair??['#241c19','#493024','#766047','#a59f95','#813d24','#342a27'][Math.floor(random()*6)];
  const iris=preset?.iris??['#856441','#68766f','#738394','#6d704d','#523b2d'][Math.floor(random()*5)];
  Object.assign(next.cosmetics,{hairColor:hair,hairTip:hair,browColor:hair,irisColor:iris,irisEdgeColor:iris,scleraColor:'#f3f1f1'});
 }
 return next;
}
