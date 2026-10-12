import {balancedGeometry} from './stairs-balanced.js';
import {calculateStairs} from './stairs.js';
import {formatMeasure,formatAngle} from './cintrage.js';
export const STAIR_TYPES={straight:'Droit',quarter:'Quart tournant',half:'Demi-tournant',doubleLanding:'Deux paliers',tripleLanding:'Trois paliers',helix:'Hélicoïdal'};
const tau=Math.PI*2,point=(x,y)=>({x,y});
const add=(p,d,k)=>point(p.x+d.x*k,p.y+d.y*k);
const vector=a=>point(Math.cos(a),Math.sin(a));
function rectangle(p,d,length,width){const n=point(-d.y,d.x);return [add(p,n,-width/2),add(add(p,d,length),n,-width/2),add(add(p,d,length),n,width/2),add(p,n,width/2)];}
export function stairConfig(input){return {type:'straight',turning:'landing',width:900,landingDepth:900,gap:100,direction:'left',diameter:2000,coreDiameter:150,sweep:360,walkingRadius:700,...input};}
export function distributeRisers(total,runs){
 if(total<2*runs.length)throw new RangeError('Il faut au moins deux hauteurs par volée.');
 const remaining=total-2*runs.length,sum=runs.reduce((a,b)=>a+b,0),exact=runs.map(x=>remaining*x/sum),counts=exact.map(x=>2+Math.floor(x));
 let rest=total-counts.reduce((a,b)=>a+b,0);
 const order=exact.map((x,i)=>({i,f:x-Math.floor(x)})).sort((a,b)=>b.f-a.f||a.i-b.i);
 for(let i=0;i<rest;i++)counts[order[i].i]++;
 return counts;
}
function comfort(h,g){return Math.max(150-h,0,h-200)*20+Math.max(220-g,0,g-350)*10+Math.max(600-2*h-g,0,2*h+g-640)*10+Math.abs(2*h+g-630)+Math.abs(h-175)*.2;}
function warnings(h,goings){const list=[];if(h<150||h>200)list.push('Hauteur hors du repère de confort choisi (150–200 mm).');if(goings.some(g=>g<220||g>350))list.push('Au moins un giron est hors du repère choisi (220–350 mm).');if(goings.some(g=>2*h+g<600||2*h+g>640))list.push('Au moins un pas de Blondel est hors du repère choisi (600–640 mm).');if(Math.max(...goings)-Math.min(...goings)>1)list.push('Girons différents entre les volées : ajustez leurs longueurs ou la répartition.');return list;}
export function calculateStairLayout(input){
 const data=stairConfig(input);calculateStairs(data);
 if(!Object.hasOwn(STAIR_TYPES,data.type)||!['left','right'].includes(data.direction))throw new RangeError('Type ou sens d’escalier invalide.');
 if(!Number.isFinite(data.width)||data.width<100||data.width>3000)throw new RangeError('Emmarchement entre 100 et 3 000 mm.');
 const turn=data.direction==='left'?1:-1;
 const surfaces=[],flights=[],positions=[];let developed=0;
 function surface(polygon,z,label,kind,from,to){surfaces.push({polygon,z,label,kind,from,to});}
 if(!['landing','balanced'].includes(data.turning))throw new RangeError('Choix du tournant invalide.');
 if(['quarter','half'].includes(data.type)&&data.turning==='balanced'){
  const runs=data.flightRuns??[data.run/2,data.run/2];
  if(runs.length!==2||runs.some(x=>!Number.isFinite(x)||x<=0||x>30000)||!Number.isFinite(data.gap)||data.gap<0||data.gap>3000)throw new RangeError('Deux volées positives et jour central positif ou nul requis.');
  const length=runs[0]+runs[1]+Math.PI*data.width/4*(data.type==='half'?2:1)+(data.type==='half'?data.gap:0);
  let n=data.risers;if(n===null){let score=Infinity;for(let k=3;k<=60;k++){const cost=comfort(data.height/k,length/(k-1));if(cost<score){score=cost;n=k;}}}
  const h=data.height/n,geometry=balancedGeometry({...data,flightRuns:runs},n-1,h),g=geometry.going;
  return {data,risers:n,treads:n-1,landingCount:0,rise:h,going:g,goings:[g],blondel:2*h+g,angle:Math.atan2(h,g)*180/Math.PI,depth:g+data.nosing,flights:[],...geometry,warnings:[...warnings(h,[g]),'Balancement géométrique sur toutes les marches, à collets constants ; sans compensation des nez ou assemblages.']};
 }
 if(data.type==='helix'){
  const {diameter,coreDiameter,sweep,walkingRadius}=data;
  if(![diameter,coreDiameter,sweep,walkingRadius].every(Number.isFinite)||diameter<400||diameter>10000||coreDiameter<0||coreDiameter>=diameter||sweep<30||sweep>1080||walkingRadius<=coreDiameter/2||walkingRadius>=diameter/2)throw new RangeError('Diamètres, angle (30–1080°) et rayon de foulée entre noyau et extérieur requis.');
  const arc=walkingRadius*sweep*Math.PI/180;
  let n=data.risers;
  if(n===null){let score=Infinity;for(let k=2;k<=60;k++){const cost=comfort(data.height/k,arc/(k-1));if(cost<score){score=cost;n=k;}}}
  const h=data.height/n,g=arc/(n-1),stepAngle=sweep*Math.PI/180/(n-1),inner=coreDiameter/2,outer=diameter/2;
  for(let i=0;i<n-1;i++){
   const polygon=[];for(let k=0;k<=8;k++){const a=turn*(i+k/8)*stepAngle;polygon.push(add(point(0,0),vector(a),outer));}for(let k=8;k>=0;k--){const a=turn*(i+k/8)*stepAngle;polygon.push(add(point(0,0),vector(a),inner));}
   surface(polygon,(i+1)*h,`M${i+1}`,'tread',i*g,(i+1)*g);positions.push({number:i+1,x:i*g,z:(i+1)*h,angle:i*sweep/(n-1)});
  }
  surface([add(point(0,0),vector(turn*sweep*Math.PI/180),inner),add(point(0,0),vector(turn*sweep*Math.PI/180),outer)],data.height,'Arrivée','arrival',arc,arc);
  const messages=warnings(h,[g]);if(sweep>=360)messages.push(`Montée par tour : ${formatMeasure(h*360/(sweep/(n-1)))} mm ; échappée à vérifier avec épaisseur des marches et arrivée.`);
  return {data,risers:n,treads:n-1,landingCount:0,rise:h,going:g,goings:[g],blondel:2*h+g,angle:Math.atan2(h,g)*180/Math.PI,depth:g+data.nosing,warnings:messages,positions,surfaces,flights,developed:arc,stepAngle:sweep/(n-1),walkingRadius,innerGoing:inner*stepAngle,outerGoing:outer*stepAngle,usableWidth:outer-inner};
 }
 const p={straight:0,quarter:1,half:1,doubleLanding:2,tripleLanding:3}[data.type],flightCount=p+1;
 if(p&&(!Number.isFinite(data.landingDepth)||data.landingDepth<data.width||data.landingDepth>5000))throw new RangeError('La profondeur des paliers doit être au moins égale à l’emmarchement (maximum 5 000 mm).');
 if(data.type==='half'&&(!Number.isFinite(data.gap)||data.gap<0||data.gap>3000))throw new RangeError('Jour central entre 0 et 3 000 mm.');
 const runs=data.flightRuns??Array.from({length:flightCount},()=>data.run/flightCount);
 if(!Array.isArray(runs)||runs.length!==flightCount||runs.some(x=>!Number.isFinite(x)||x<=0||x>30000))throw new RangeError('Renseignez une longueur positive pour chaque volée.');
 let n=data.risers;
 function counts(k){return data.flightRisers??distributeRisers(k,runs);}
 if(data.flightRisers){if(!Array.isArray(data.flightRisers)||data.flightRisers.length!==flightCount||data.flightRisers.some(x=>!Number.isInteger(x)||x<2||x>60))throw new RangeError('Au moins deux hauteurs entières par volée.');n=data.flightRisers.reduce((a,b)=>a+b,0);if(n>60)throw new RangeError('Maximum : 60 hauteurs.');}
 if(n===null){let best=Infinity;for(let k=flightCount*2;k<=60;k++){const c=counts(k),gs=runs.map((r,i)=>r/(c[i]-1));const score=gs.reduce((sum,g)=>sum+comfort(data.height/k,g),0)+Math.max(...gs)-Math.min(...gs);if(score<best){best=score;n=k;}}}
 const ns=counts(n);if(ns.reduce((a,b)=>a+b,0)!==n)throw new RangeError('Répartition des hauteurs incohérente.');
 const h=data.height/n,gs=runs.map((r,i)=>r/(ns[i]-1));let origin=point(0,0),a=0,level=0,number=0;
 for(let f=0;f<flightCount;f++){
  const d=vector(a),g=gs[f],start=developed;
  flights.push({number:f+1,risers:ns[f],run:runs[f],going:g,blondel:2*h+g,angle:Math.atan2(h,g)*180/Math.PI});
  for(let i=0;i<ns[f]-1;i++){level++;number++;surface(rectangle(add(origin,d,i*g),d,g,data.width),level*h,`M${number}`,'tread',developed,developed+g);positions.push({number,x:developed,z:level*h,flight:f+1});developed+=g;}
  const end=add(origin,d,runs[f]);level++;
  if(f<p){
   let polygon,pathLength;
   if(data.type==='half'){
    const normal=vector(a+turn*Math.PI/2),centre=add(add(end,d,data.landingDepth/2),normal,(data.width+data.gap)/2);
    polygon=rectangle(add(centre,d,-data.landingDepth/2),d,data.landingDepth,2*data.width+data.gap);
    origin=add(end,normal,data.width+data.gap);a+=turn*Math.PI;pathLength=data.landingDepth+data.width+data.gap;
   }else{polygon=rectangle(end,d,data.landingDepth,data.width);a+=turn*Math.PI/2;origin=add(add(end,d,data.landingDepth/2),vector(a),data.width/2);pathLength=(data.landingDepth+data.width)/2;}
   surface(polygon,level*h,`P${f+1}`,'landing',developed,developed+pathLength);developed+=pathLength;
  }else surface(rectangle(end,d,Math.min(300,data.width/3),data.width),data.height,'Arrivée','arrival',developed,developed);
  flights[f].from=start;
 }
 const messages=warnings(h,gs);
 if(p)messages.push('Vue de côté projetée : toutes les volées sont représentées, y compris celles masquées en réalité.');
 return {data,risers:n,treads:n-1-p,landingCount:p,rise:h,going:gs[0],goings:gs,blondel:2*h+gs[0],angle:Math.atan2(h,gs[0])*180/Math.PI,depth:gs[0]+data.nosing,warnings:messages,positions,surfaces,flights,developed};
}
export function stairLayoutText(input){const r=calculateStairLayout(input),d=r.data;
 return [`WoodPilot — ${STAIR_TYPES[d.type]}`,`Sens : ${d.direction==='left'?'gauche':'droite'}`,`Nez de marche : ${formatMeasure(d.nosing)} mm`,...(['quarter','half'].includes(d.type)?[`Tournant : ${d.turning==='balanced'?'marches balancées à collets constants':'palier'}`]:[]),`Hauteur sol à sol : ${formatMeasure(d.height)} mm`,`${r.risers} hauteurs · ${r.treads} marches · ${r.landingCount} palier(s)`,`Hauteur unitaire : ${formatMeasure(r.rise)} mm`,...(d.type==='helix'?[`Diamètre extérieur / noyau : ${formatMeasure(d.diameter)} / ${formatMeasure(d.coreDiameter)} mm`,`Rayon de foulée : ${formatMeasure(d.walkingRadius)} mm · rotation ${formatAngle(d.sweep)}°`,`Giron sur la foulée (arc) : ${formatMeasure(r.going)} mm`,`Angle par marche : ${formatAngle(r.stepAngle)}°`,`Giron intérieur / extérieur (arc) : ${formatMeasure(r.innerGoing)} / ${formatMeasure(r.outerGoing)} mm`]:[`Emmarchement : ${formatMeasure(d.width)} mm`,...(r.collet?[`Balancement à collet constant : ${formatMeasure(r.collet)} mm · giron sur la foulée ${formatMeasure(r.going)} mm`]:[]),...r.flights.map(f=>`Volée ${f.number} : ${f.risers} hauteurs · recul ${formatMeasure(f.run)} mm · giron ${formatMeasure(f.going)} mm · Blondel ${formatMeasure(f.blondel)} mm · pente ${formatAngle(f.angle)}°`)]),...r.warnings,...r.surfaces.filter(s=>s.kind==='landing').map(s=>`${s.label} : hauteur ${formatMeasure(s.z)} mm`),'Positions sur le développé de la foulée :',...r.positions.map(p=>`M${p.number} : distance ${formatMeasure(p.x)} mm · hauteur ${formatMeasure(p.z)} mm`),'Cotes théoriques sans compensation des nez, épaisseurs, assemblages ou garde-corps dans les polygones.','Arrivée sur étage. Calculs non arrondis, cotes affichées au mm. Vérifier trémie, échappée et structure.'].join('\n');}
