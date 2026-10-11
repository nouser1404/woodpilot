const rad=Math.PI/180;
export function inclination(gravity){
  if(!gravity||![gravity.x,gravity.y,gravity.z].every(Number.isFinite))throw new RangeError('Mesure invalide.');
  const norm=Math.hypot(gravity.x,gravity.y,gravity.z);
  if(norm<7||norm>12)throw new RangeError('Gardez le téléphone immobile.');
  return Math.atan2(Math.hypot(gravity.x,gravity.y),Math.abs(gravity.z))/rad;
}
export function slopeFromAngle(angle){
  if(!Number.isFinite(angle)||angle<0||angle>90)throw new RangeError('Angle invalide.');
  return {angle,percent:angle>=89.9?null:Math.tan(angle*rad)*100};
}
// Stability uses the unfiltered vector, not a rounded display or a repeated stale sample.
export function stableInclination(previous,gravity,now){
  const angle=inclination(gravity),norm=Math.hypot(gravity.x,gravity.y,gravity.z);
  if(Math.abs(norm-9.81)>.65)return {samples:[],stable:false,angle};
  let samples=previous?.samples||[];
  if(samples.length&&(now-samples.at(-1).time>500||now<=samples.at(-1).time))samples=[];
  samples=samples.filter(s=>now-s.time<=2500);
  const point={x:gravity.x/norm,y:gravity.y/norm,z:gravity.z/norm,time:now,angle};
  const reference=samples[0];
  if(reference){
    const motion=Math.acos(Math.max(-1,Math.min(1,reference.x*point.x+reference.y*point.y+reference.z*point.z)))/rad;
    if(motion>.3)samples=[];
  }
  samples.push(point);
  const stable=samples.length>=5&&now-samples[0].time>=2000;
  return {samples,stable,angle:stable?samples.reduce((sum,s)=>sum+s.angle,0)/samples.length:angle};
}
export function validateInclination(data){
  slopeFromAngle(data?.angle);
  if(typeof data.measuredAt!=='string'||!Number.isFinite(Date.parse(data.measuredAt)))throw new RangeError('Date de mesure invalide.');
  return data;
}
