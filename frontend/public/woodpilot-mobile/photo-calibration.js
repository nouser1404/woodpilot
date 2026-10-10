export const PHOTO_WARNING='Mesure indicative : vérifier au mètre avant fabrication';
const cross=(a,b,c)=>(b.x-a.x)*(c.y-b.y)-(b.y-a.y)*(c.x-b.x);
export function homography(corners) {
  if(!Array.isArray(corners)||corners.length!==4||corners.some(p=>!p||![p.x,p.y].every(Number.isFinite)))throw new RangeError('Coins invalides.');
  const sides=corners.map((p,i)=>Math.hypot(p.x-corners[(i+1)%4].x,p.y-corners[(i+1)%4].y));
  const turns=corners.map((p,i)=>cross(p,corners[(i+1)%4],corners[(i+2)%4]));
  if(Math.min(...sides)<1e-6||Math.max(...sides)/Math.min(...sides)>8||turns.some(v=>v*turns[0]<=0)||Math.min(...turns.map(Math.abs))/Math.max(...sides)**2<.04)throw new RangeError('Perspective trop forte ou coins confondus : reprenez une photo.');
  // Normalize source coordinates before Gaussian elimination to avoid pixel-scale conditioning.
  const origin=corners[0],scale=Math.max(...sides),target=[[0,0],[50,0],[50,50],[0,50]],rows=[];
  corners.forEach((p,i)=>{const x=(p.x-origin.x)/scale,y=(p.y-origin.y)/scale,[u,v]=target[i];rows.push([x,y,1,0,0,0,-u*x,-u*y,u],[0,0,0,x,y,1,-v*x,-v*y,v]);});
  for(let col=0;col<8;col++){let pivot=col;for(let r=col+1;r<8;r++)if(Math.abs(rows[r][col])>Math.abs(rows[pivot][col]))pivot=r;
    if(Math.abs(rows[pivot][col])<1e-9)throw new RangeError('Calibration singulière.');
    [rows[col],rows[pivot]]=[rows[pivot],rows[col]];const d=rows[col][col];for(let j=col;j<=8;j++)rows[col][j]/=d;
    for(let r=0;r<8;r++)if(r!==col){const f=rows[r][col];for(let j=col;j<=8;j++)rows[r][j]-=f*rows[col][j];}}
  return {coefficients:rows.map(r=>r[8]),origin,scale};
}
export function transformPoint(h,p){const x=(p.x-h.origin.x)/h.scale,y=(p.y-h.origin.y)/h.scale,c=h.coefficients,w=c[6]*x+c[7]*y+1;
  if(!Number.isFinite(w)||w<=1e-5)throw new RangeError('Point hors du plan exploitable : reprenez une photo de face.');
  const result={x:(c[0]*x+c[1]*y+c[2])/w,y:(c[3]*x+c[4]*y+c[5])/w};
  if(![result.x,result.y].every(Number.isFinite))throw new RangeError('Mesure invalide.');return result;}
export function calibratedDistance(calibration,a,b,width,height){const pixel=p=>({x:p.x*width,y:p.y*height});let value;
  if(calibration?.type==='aruco'){const h=homography(calibration.corners.map(pixel)),pa=transformPoint(h,pixel(a)),pb=transformPoint(h,pixel(b));value=Math.hypot(pa.x-pb.x,pa.y-pb.y);}
  else if(calibration?.type==='known'){const ref=Math.hypot((calibration.a.x-calibration.b.x)*width,(calibration.a.y-calibration.b.y)*height);if(ref<2||!Number.isFinite(calibration.value)||calibration.value<=0)throw new RangeError('Distance de référence invalide.');value=Math.hypot((a.x-b.x)*width,(a.y-b.y)*height)*calibration.value/ref;}
  else throw new RangeError('Confirmez une calibration avant de mesurer.');
  if(!Number.isFinite(value)||value<=0||value>1000000)throw new RangeError('Mesure hors limites.');return value;}
export function validateCalibration(c){const point=p=>p&&[p.x,p.y].every(v=>Number.isFinite(v)&&v>=0&&v<=1);
  if(c?.type==='aruco'&&c.id===0&&c.size===50&&c.corners?.length===4&&c.corners.every(point)){homography(c.corners);return c;}
  if(c?.type==='known'&&point(c.a)&&point(c.b)&&Number.isFinite(c.value)&&c.value>0&&c.value<=1000000&&Math.hypot(c.a.x-c.b.x,c.a.y-c.b.y)>1e-6)return c;
  throw new RangeError('Calibration enregistrée invalide.');}
