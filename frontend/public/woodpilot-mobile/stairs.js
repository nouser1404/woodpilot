import {formatMeasure,formatAngle} from './cintrage.js';
function validate(data){
 if(!data||!Number.isFinite(data.height)||data.height<=0||data.height>12000||!Number.isFinite(data.run)||data.run<=0||data.run>30000)throw new RangeError('Hauteur et reculement positifs : maximum 12 000 et 30 000 mm.');
 if(data.risers!==null&&(!Number.isInteger(data.risers)||data.risers<2||data.risers>60))throw new RangeError('Choisissez de 2 à 60 hauteurs, ou le calcul automatique.');
 if(!Number.isFinite(data.nosing)||data.nosing<0||data.nosing>100)throw new RangeError('Nez de marche entre 0 et 100 mm.');
}
const outside=(value,min,max)=>Math.max(min-value,0,value-max);
export function suggestRisers(height,run){
 let best=2,score=Infinity;
 for(let n=2;n<=60;n++){
  const h=height/n,g=run/(n-1),blondel=2*h+g;
  const cost=outside(h,150,200)*20+outside(g,220,350)*10+outside(blondel,600,640)*10+Math.abs(blondel-630)+Math.abs(h-175)*.2;
  if(cost<score){score=cost;best=n;}
 }
 return best;
}
export function calculateStairs(data){
 validate(data);const risers=data.risers??suggestRisers(data.height,data.run),treads=risers-1;
 const rise=data.height/risers,going=data.run/treads,blondel=2*rise+going,angle=Math.atan2(rise,going)*180/Math.PI;
 const warnings=[];
 if(blondel<600||blondel>640)warnings.push('Pas de Blondel hors du repère de confort choisi (600–640 mm).');
 if(rise<150||rise>200)warnings.push('Hauteur hors du repère de conception choisi (150–200 mm).');
 if(going<220||going>350)warnings.push('Giron hors du repère de conception choisi (220–350 mm).');
 return {risers,treads,rise,going,blondel,angle,depth:going+data.nosing,warnings,positions:Array.from({length:treads},(_,i)=>({number:i+1,x:i*going,z:(i+1)*rise}))};
}
export function stairsText(data){
 const r=calculateStairs(data);
 return ['WoodPilot — Escalier droit',`Hauteur sol fini à sol fini : ${formatMeasure(data.height)} mm`,`Reculement horizontal : ${formatMeasure(data.run)} mm`,`${r.risers} hauteurs · ${r.treads} marches à fabriquer · arrivée sur l’étage`,`Hauteur unitaire : ${formatMeasure(r.rise)} mm`,`Giron : ${formatMeasure(r.going)} mm`,`Nez de marche : ${formatMeasure(data.nosing)} mm`,`Profondeur de marche : ${formatMeasure(r.depth)} mm`,`Pente de la ligne des nez : ${formatAngle(r.angle)}°`,`Pas de Blondel (2h + g) : ${formatMeasure(r.blondel)} mm`,...r.warnings,'Positions théoriques depuis le départ :',...r.positions.map(p=>`Marche ${p.number} : recul ${formatMeasure(p.x)} mm · hauteur ${formatMeasure(p.z)} mm`),'Cotes arrondies à l’affichage : répartir la hauteur totale, ne pas cumuler les hauteurs arrondies.','Escalier droit sans palier. Giron entre nez ; profondeur = giron + nez. Sans épaisseur, assemblages ou dimensionnement des limons.','Repères de confort indicatifs ; trémie, échappée, garde-corps et exigences du bâtiment restent à vérifier.'].join('\n');
}
