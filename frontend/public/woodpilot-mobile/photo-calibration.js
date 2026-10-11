export const PHOTO_WARNING='Mesure indicative : vérifier au mètre avant fabrication';
const cross=(a,b,c)=>(b.x-a.x)*(c.y-b.y)-(b.y-a.y)*(c.x-b.x);
export const ARUCO_SIZES=Object.freeze({0:50,1:150});
export function homography(corners,size=50) {
  if(!Number.isFinite(size)||size<=0)throw new RangeError("Taille de repère invalide.");
  if(!Array.isArray(corners)||corners.length!==4||corners.some(p=>!p||![p.x,p.y].every(Number.isFinite)))throw new RangeError('Coins invalides.');
  const sides=corners.map((p,i)=>Math.hypot(p.x-corners[(i+1)%4].x,p.y-corners[(i+1)%4].y));
  const turns=corners.map((p,i)=>cross(p,corners[(i+1)%4],corners[(i+2)%4]));
  if(Math.min(...sides)<1e-6||Math.max(...sides)/Math.min(...sides)>8||turns.some(v=>v*turns[0]<=0)||Math.min(...turns.map(Math.abs))/Math.max(...sides)**2<.04)throw new RangeError('Perspective trop forte ou coins confondus : reprenez une photo.');
  // Normalize source coordinates before Gaussian elimination to avoid pixel-scale conditioning.
  const origin=corners[0],scale=Math.max(...sides),target=[[0,0],[size,0],[size,size],[0,size]],rows=[];
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
  if(calibration?.type==='aruco'){const corners=calibration.corners.map(pixel),size=ARUCO_SIZES[calibration.id];if(size!==calibration.size)throw new RangeError('Taille de repère incohérente.');
    const measure=points=>{const h=homography(points,size),pa=transformPoint(h,pixel(a)),pb=transformPoint(h,pixel(b));return Math.hypot(pa.x-pb.x,pa.y-pb.y);};
    value=measure(corners);
    // Sensitivity check, not a certified accuracy estimate: disturb each detected
    // corner by two detector pixels and reject excessive perspective extrapolation.
    const ratio=Math.min(1,1800/Math.max(width,height));
    const dx=2*width/(calibration.detectionWidth||Math.round(width*ratio)),dy=2*height/(calibration.detectionHeight||Math.round(height*ratio));
    for(let i=0;i<4;i++)for(const [x,y] of [[dx,0],[-dx,0],[0,dy],[0,-dy],[dx,dy],[-dx,-dy],[dx,-dy],[-dx,dy]]){
      const points=corners.map((p,j)=>j===i?{x:p.x+x,y:p.y+y}:p);
      let perturbed;try{perturbed=measure(points);}catch{throw new RangeError('Mesure trop instable : rapprochez le repère des points et reprenez une photo moins oblique.');}
      if(Math.abs(perturbed-value)>value*.1)throw new RangeError('Mesure trop instable : utilisez le grand repère, rapprochez-le des points ou reprenez une photo moins oblique.');
    }}
  else if(calibration?.type==='known'){const ref=Math.hypot((calibration.a.x-calibration.b.x)*width,(calibration.a.y-calibration.b.y)*height);if(ref<2||!Number.isFinite(calibration.value)||calibration.value<=0)throw new RangeError('Distance de référence invalide.');value=Math.hypot((a.x-b.x)*width,(a.y-b.y)*height)*calibration.value/ref;}
  else throw new RangeError('Confirmez une calibration avant de mesurer.');
  if(!Number.isFinite(value)||value<=0||value>1000000)throw new RangeError('Mesure hors limites.');return value;}
export function validateCalibration(c){const point=p=>p&&[p.x,p.y].every(v=>Number.isFinite(v)&&v>=0&&v<=1);
  if(c?.type==='aruco'&&Number.isInteger(c.id)&&Object.hasOwn(ARUCO_SIZES,c.id)&&c.size===ARUCO_SIZES[c.id]&&c.corners?.length===4&&c.corners.every(point)){if(['detectionWidth','detectionHeight'].some(key=>c[key]!==undefined&&(!Number.isInteger(c[key])||c[key]<1||c[key]>2400)))throw new RangeError('Résolution de calibration invalide.');homography(c.corners,c.size);return c;}
  if(c?.type==='known'&&point(c.a)&&point(c.b)&&Number.isFinite(c.value)&&c.value>0&&c.value<=1000000&&Math.hypot(c.a.x-c.b.x,c.a.y-c.b.y)>1e-6)return c;
  throw new RangeError('Calibration enregistrée invalide.');}

export function recalculatePhotoLines(lines,width,height){
  return lines.map(line=>{
    const next=structuredClone(line);
    if(next.source){try{next.value=calibratedDistance(next.calibration,next.a,next.b,width,height);delete next.unreliable;}catch{next.unreliable=true;}}
    return next;
  });
}
