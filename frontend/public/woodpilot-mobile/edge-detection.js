import {edgePixels} from './edge-pixels.js';
// Bounded Sobel + Hough transform, independent of the UI and of real dimensions.
export function detectSegments({width,height,data}, {maxSegments=35}={}) {
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<3||height<3||width>960||height>960||data.length!==width*height*4)throw new RangeError('Image de détection invalide.');
  const points=edgePixels({width,height,data});
  if(!points.length)return [];
  const diagonal=Math.ceil(Math.hypot(width,height)),bins=2*diagonal+1,angles=180,accumulator=new Uint16Array(angles*bins);
  const cos=Array.from({length:angles},(_,a)=>Math.cos(a*Math.PI/180)),sin=cos.map((_,a)=>Math.sin(a*Math.PI/180));
  // Vote close to the gradient normal rather than at every angle.
  for(const p of points){const normal=((Math.round(p.angle*180/Math.PI)%180)+180)%180;for(let d=-6;d<=6;d++){const a=(normal+d+180)%180,r=Math.round(p.x*cos[a]+p.y*sin[a])+diagonal;accumulator[a*bins+r]++;}}
  const peaks=[],threshold=Math.max(18,Math.min(width,height)*.08);
  for(let a=0;a<angles;a++)for(let r=0;r<bins;r++)if(accumulator[a*bins+r]>=threshold)peaks.push({a,r:r-diagonal,votes:accumulator[a*bins+r]});
  peaks.sort((a,b)=>b.votes-a.votes||a.a-b.a||a.r-b.r);const segments=[];
  for(const peak of peaks.slice(0,500)){
    const c=cos[peak.a],s=sin[peak.a];const along=points.filter(p=>Math.abs(p.x*c+p.y*s-peak.r)<1.6&&Math.abs(Math.cos(p.angle)*c+Math.sin(p.angle)*s)>.94).map(p=>-p.x*s+p.y*c).sort((a,b)=>a-b);
    let start=0;
    for(let i=1;i<=along.length;i++)if(i===along.length||along[i]-along[i-1]>5){
      const from=along[start],to=along[i-1],length=to-from;start=i;
      if(!Number.isFinite(length)||length<Math.max(30,Math.min(width,height)*.08))continue;
      const point=t=>({x:Math.max(0,Math.min(1,(peak.r*c-t*s)/width)),y:Math.max(0,Math.min(1,(peak.r*s+t*c)/height))});
      const candidate={a:point(from),b:point(to)};
      if(segments.some(line=>{
        const dx=(line.b.x-line.a.x)*width,dy=(line.b.y-line.a.y)*height,l=Math.hypot(dx,dy);
        if(Math.abs((dx*(-s)+dy*c)/l)<.9945)return false;
        const values=[line.a,line.b].map(p=>-p.x*width*s+p.y*height*c),lo=Math.min(...values),hi=Math.max(...values);
        const x=(candidate.a.x+candidate.b.x)*width/2,y=(candidate.a.y+candidate.b.y)*height/2;
        return Math.abs((x-line.a.x*width)*dy-(y-line.a.y*height)*dx)/l<3&&Math.min(hi,to)-Math.max(lo,from)>Math.min(hi-lo,length)*.5;
      }))continue;
      segments.push(candidate);if(segments.length>=maxSegments)return segments;
    }
  }
  return segments;
}
export function closestSegment(point,segments,width,height,tolerance=14) {
  let best=null,distance=tolerance;
  segments.forEach(segment=>{const ax=segment.a.x*width,ay=segment.a.y*height,dx=(segment.b.x-segment.a.x)*width,dy=(segment.b.y-segment.a.y)*height;
    const t=Math.max(0,Math.min(1,((point.x*width-ax)*dx+(point.y*height-ay)*dy)/(dx*dx+dy*dy||1)));
    const d=Math.hypot(point.x*width-ax-t*dx,point.y*height-ay-t*dy);if(d<distance){distance=d;best=segment;}
  });return best;
}
