// Geometric balancing over the complete inner string: equal collets, equal goings on the walking line.
const point=(x,y)=>({x,y}),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const cross=(a,b)=>a.x*b.y-a.y*b.x;
function chain(points){let length=0;const segments=[];for(let i=1;i<points.length;i++){const n=dist(points[i-1],points[i]);if(n>1e-8){segments.push({a:points[i-1],b:points[i],start:length,length:n});length+=n;}}return {points,segments,length};}
function at(path,s){const p=path.segments.find(p=>s<=p.start+p.length+1e-8)??path.segments.at(-1);const t=Math.max(0,Math.min(1,(s-p.start)/p.length));return point(p.a.x+t*(p.b.x-p.a.x),p.a.y+t*(p.b.y-p.a.y));}
function slice(path,from,to){return [at(path,from),...path.segments.filter(s=>s.start>from+1e-6&&s.start<to-1e-6).map(s=>s.a),at(path,to)];}
function rayHit(a,b,path){const d=point(b.x-a.x,b.y-a.y);let best=null;
 for(const s of path.segments){const e=point(s.b.x-s.a.x,s.b.y-s.a.y),v=point(s.a.x-a.x,s.a.y-a.y),den=cross(d,e);if(Math.abs(den)<1e-8)continue;const t=cross(v,e)/den,u=cross(v,d)/den;if(t>=1-1e-7&&u>=-1e-7&&u<=1+1e-7&&(!best||t<best.t))best={t,s:s.start+Math.max(0,Math.min(1,u))*s.length};}
 if(!best)throw new RangeError('Balancement impossible avec ces longueurs. Augmentez les volées.');return best.s;
}
export function balancedGeometry({type,width,gap,direction,flightRuns},treads,rise){
 const [a,b]=flightRuns,w=width,r=w/2,half=type==='half',turn=direction==='right'?-1:1;
 const inner=chain(half?[point(0,r),point(a,r),point(a,r+gap),point(a-b,r+gap)]:[point(0,r),point(a,r),point(a,r+b)]);
 const outer=chain(half?[point(0,-r),point(a+w,-r),point(a+w,3*r+gap),point(a-b,3*r+gap)]:[point(0,-r),point(a+w,-r),point(a+w,r+b)]);
 const walkLength=a+b+(half?gap+Math.PI*r:Math.PI*r/2);
 function walking(s){
  if(s<=a)return point(s,0);s-=a;
  if(s<=Math.PI*r/2){const angle=-Math.PI/2+s/r;return point(a+r*Math.cos(angle),r+r*Math.sin(angle));}s-=Math.PI*r/2;
  if(!half)return point(a+r,r+s);
  if(s<=gap)return point(a+r,r+s);s-=gap;
  if(s<=Math.PI*r/2){const angle=s/r;return point(a+r*Math.cos(angle),r+gap+r*Math.sin(angle));}s-=Math.PI*r/2;
  return point(a-s,w+gap);
 }
 const cuts=[];
 for(let i=0;i<=treads;i++){
  const inS=inner.length*i/treads,p=at(inner,inS),walk=walking(walkLength*i/treads);
  const outS=i===0?0:i===treads?outer.length:rayHit(p,walk,outer);
  if(i&&outS<=cuts.at(-1).outS+1e-7)throw new RangeError('Les lignes de balancement se croisent : modifiez les volées ou le nombre de marches.');
  cuts.push({inS,outS,walk});
 }
 const mirror=p=>point(p.x,p.y*turn),surfaces=[],positions=[];
 for(let i=0;i<treads;i++){
  const polygon=[...slice(outer,cuts[i].outS,cuts[i+1].outS),...slice(inner,cuts[i].inS,cuts[i+1].inS).reverse()].map(mirror);
  // Prevent a cut crossing the open well between the two flights.
  for(let j=0;j<polygon.length;j++){const p=polygon[j],q=polygon[(j+1)%polygon.length];for(let k=1;k<8;k++){const x=p.x+(q.x-p.x)*k/8,y=(p.y+(q.y-p.y)*k/8)*turn;if(x<a-1e-6&&y>r+1e-6&&(!half||y<r+gap-1e-6))throw new RangeError('Balancement traversant le jour : ajustez la géométrie.');}}
  const from=i*walkLength/treads,to=(i+1)*walkLength/treads;
  surfaces.push({polygon,z:(i+1)*rise,label:`M${i+1}`,kind:'tread',from,to});positions.push({number:i+1,x:from,z:(i+1)*rise});
 }
 surfaces.push({polygon:[mirror(at(inner,inner.length)),mirror(at(outer,outer.length))],z:(treads+1)*rise,label:'Arrivée',kind:'arrival',from:walkLength,to:walkLength});
 return {surfaces,positions,developed:walkLength,going:walkLength/treads,collet:inner.length/treads,walkingPath:Array.from({length:101},(_,i)=>mirror(walking(walkLength*i/100)))};
}
