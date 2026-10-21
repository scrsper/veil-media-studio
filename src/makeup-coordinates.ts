export type Bounds={x0:number;y0:number;x1:number;y1:number};
export function supportBounds(data:ArrayLike<number>,width:number,height:number,channel=3,threshold=8):Bounds{
 let x0=width,y0=height,x1=-1,y1=-1;for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(data[(y*width+x)*4+channel]>threshold){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
 return x1<0?{x0:0,y0:0,x1:1,y1:1}:{x0:x0/width,y0:y0/height,x1:(x1+1)/width,y1:(y1+1)/height};
}
export function landmarkBounds(landmarks:Record<string,{uv:number[]}>,names:string[],padding=0):Bounds{
 const points=names.map(n=>landmarks[n]?.uv).filter(Boolean);if(!points.length)throw Error('Missing loaded UV landmarks');
 return {x0:Math.min(...points.map(p=>p[0]))-padding,x1:Math.max(...points.map(p=>p[0]))+padding,y0:Math.min(...points.map(p=>p[1]))-padding,y1:Math.max(...points.map(p=>p[1]))+padding};
}
export function fitTransform(source:Bounds,target:Bounds,mirror=false){
 const sx=(target.x1-target.x0)/Math.max(source.x1-source.x0,1e-6),sy=(target.y1-target.y0)/Math.max(source.y1-source.y0,1e-6);
 return {sx:mirror?-sx:sx,sy,tx:mirror?target.x1+sx*source.x0:target.x0-sx*source.x0,ty:target.y0-sy*source.y0};
}
