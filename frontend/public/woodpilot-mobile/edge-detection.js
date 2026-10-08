// Bounded Sobel + Hough transform, independent of the UI and of real dimensions.
export function detectSegments({width,height,data}, {maxSegments=35}={}) {
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<3||height<3||width>480||height>480||data.length!==width*height*4)throw new RangeError('Image de détection invalide.');
  const gray=new Float32Array(width*height),points=[];
  for(let i=0;i<gray.length;i++)gray[i]=.299*data[4*i]+.587*data[4*i+1]+.114*data[4*i+2];
  for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++){
    const i=y*width+x,gx=-gray[i-width-1]+gray[i-width+1]-2*gray[i-1]+2*gray[i+1]-gray[i+width-1]+gray[i+width+1];
    const gy=-gray[i-width-1]-2*gray[i-width]-gray[i-width+1]+gray[i+width-1]+2*gray[i+width]+gray[i+width+1];
    if(Math.hypot(gx,gy)>180)points.push({x,y,angle:Math.atan2(gy,gx)});
  }
  if(!points.length)return [];
  const diagonal=Math.ceil(Math.hypot(width,height)),bins=2*diagonal+1,angles=180,accumulator=new Uint16Array(angles*bins);
  const cos=Array.from({length:angles},(_,a)=>Math.cos(a*Math.PI/180)),sin=cos.map((_,a)=>Math.sin(a*Math.PI/180));
  // Vote close to the gradient normal rather than at every angle.
  for(const p of points){const normal=((Math.round(p.angle*180/Math.PI)%180)+180)%180;for(let d=-2;d<=2;d++){const a=(normal+d+180)%180,r=Math.round(p.x*cos[a]+p.y*sin[a])+diagonal;accumulator[a*bins+r]++;}}
  const peaks=[],threshold=Math.max(18,Math.min(width,height)*.08);
  for(let a=0;a<angles;a++)for(let r=0;r<bins;r++)if(accumulator[a*bins+r]>=threshold)peaks.push({a,r:r-diagonal,votes:accumulator[a*bins+r]});
  peaks.sort((a,b)=>b.votes-a.votes||a.a-b.a||a.r-b.r);const accepted=[],segments=[];
  for(const peak of peaks.slice(0,500)){
    if(accepted.some((p,index)=>{const delta=Math.abs(p.a-peak.a),segment=segments[index],x=(segment.a.x+segment.b.x)*width/2,y=(segment.a.y+segment.b.y)*height/2;return Math.min(delta,180-delta)<=6&&Math.abs(x*cos[peak.a]+y*sin[peak.a]-peak.r)<6;}))continue;
    const c=cos[peak.a],s=sin[peak.a];const along=points.filter(p=>Math.abs(p.x*c+p.y*s-peak.r)<1.6).map(p=>-p.x*s+p.y*c).sort((a,b)=>a-b);
    let start=0,best=null;
    for(let i=1;i<=along.length;i++)if(i===along.length||along[i]-along[i-1]>9){const length=along[i-1]-along[start];if(length>=Math.max(30,Math.min(width,height)*.12)&&(!best||length>best.length))best={from:along[start],to:along[i-1],length};start=i;}
    if(!best)continue;accepted.push(peak);
    const point=t=>({x:Math.max(0,Math.min(1,(peak.r*c-t*s)/width)),y:Math.max(0,Math.min(1,(peak.r*s+t*c)/height))});
    segments.push({a:point(best.from),b:point(best.to)});if(segments.length>=maxSegments)break;
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
