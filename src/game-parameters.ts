export type GameRange={Min:number;Mid:number;Max:number;SliderUIRangeType:string};
export function rangeBounds(r:GameRange):[number,number]{
 if(r.SliderUIRangeType.endsWith('::MidMax'))return [r.Mid,r.Max];
 if(r.SliderUIRangeType.endsWith('::MaxMin'))return [r.Max,r.Min];
 return [r.Min,r.Max];
}
// PercentageToValue in the loaded native slider uses this affine conversion.
export function toRaw(percent:number,r:GameRange){const [a,b]=rangeBounds(r);return a+(b-a)*Math.max(0,Math.min(100,percent))/100;}
export function toPercent(value:number,r:GameRange){const [a,b]=rangeBounds(r);return a===b?50:Math.max(0,Math.min(100,(value-a)/(b-a)*100));}
export const bodyParameters:Record<string,string>={'Height':'Height','Head Size':'Size_Head','Shoulder Width':'Width_Shoulder','Chest Size':'Size_Breast','Waist Size':'Width_Waist','Arm Thickness':'Thick_Arm','Arm Length':'Length_UpperArm','Pelvis Size':'Width_Pelvis','Hip Size':'Size_Butt','Hip Height':'UpDown_Butt','Leg Thickness':'Thick_Leg','Thigh Length':'Length_Thigh','Thigh Thickness':'Thick_Quadriceps','Calf Length':'Length_Calf','Calf Thickness':'Thick_CalfMuscle','Foot Width':'Width_Foot'};
