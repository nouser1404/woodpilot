import {formatMeasure} from './cintrage.js';
export function calculateHelix(data){
 const {radius,height,turns}=data||{};
 if(!Number.isFinite(radius)||radius<=0||radius>1000000||!Number.isFinite(height)||height<0||height>1000000||!Number.isFinite(turns)||turns<=0||turns>100)throw new RangeError('Rayon positif, hauteur positive ou nulle (maximum 1 000 000 mm), nombre de tours strictement positif jusqu’à 100.');
 const run=2*Math.PI*radius*turns,length=Math.hypot(run,height),pitch=height/turns;
 if(![run,length,pitch].every(v=>Number.isFinite(v)&&v<=1000000000))throw new RangeError('Le développement dépasse les limites du calcul.');
 return {run,length,pitch,angle:Math.atan2(height,run)*180/Math.PI,percent:height/run*100,rotation:turns*360};
}
export function helixText(data){const r=calculateHelix(data);return ['WoodPilot — Courbe hélicoïdale','Hélice circulaire de rayon et de pas constants',`Rayon de la ligne mesurée : ${formatMeasure(data.radius)} mm`,`Hauteur totale : ${formatMeasure(data.height)} mm`,`Nombre de tours : ${formatMeasure(data.turns)}`,`Rotation totale : ${formatMeasure(r.rotation)}°`,`Longueur développée : ${formatMeasure(r.length)} mm`,`Développement horizontal : ${formatMeasure(r.run)} mm`,`Pas (hauteur par tour) : ${formatMeasure(r.pitch)} mm`,`Angle de pente : ${formatMeasure(r.angle)}°`,`Pente : ${formatMeasure(r.percent)} %`,'Longueur = √((2π × rayon × tours)² + hauteur²)','Longueur mesurée sur la ligne au rayon saisi ; sans correction de section, de fabrication ou de cintrage.'].join('\n');}
