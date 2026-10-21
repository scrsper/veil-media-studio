// Accumulate mask coverage in linear light. RGB stays premultiplied through
// filtering so transparent mask edges cannot produce a dark fringe.
export function compositeMask(color:Float32Array,surface:Float32Array,pixels:Uint8ClampedArray,rgb:readonly number[],roughness:number|null){
 for(let i=0;i<pixels.length;i+=4){
  const a=pixels[i+3]/255;if(a===0)continue;const keep=1-a;
  for(let k=0;k<3;k++)color[i+k]=rgb[k]*a+color[i+k]*keep;
  color[i+3]=a+color[i+3]*keep;
  if(roughness!==null){surface[i]=roughness*a+surface[i]*keep;surface[i+3]=a+surface[i+3]*keep;}
 }
}
export function encodeAtlas(data:Float32Array,srgb:boolean){
 const bytes=new Uint8Array(data.length);
 for(let i=0;i<data.length;i++){
  let v=Math.max(0,Math.min(1,data[i]));
  if(srgb&&i%4!==3)v=v<=.0031308?v*12.92:1.055*Math.pow(v,1/2.4)-.055;
  bytes[i]=Math.round(v*255);
 }
 return bytes;
}
