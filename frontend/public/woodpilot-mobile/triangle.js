import {formatMeasure} from './cintrage.js';
export const TRIANGLE_MODES={legs:['adjacent','opposite'],hypAdjacent:['hypotenuse','adjacent'],hypOpposite:['hypotenuse','opposite'],adjacentAngle:['adjacent','angle'],oppositeAngle:['opposite','angle'],hypAngle:['hypotenuse','angle']};
export const TRIANGLE_LABELS={adjacent:'Base (côté adjacent à α)',opposite:'Hauteur (côté opposé à α)',hypotenuse:'Diagonale (hypoténuse)',angle:'Angle α par rapport à la base'};
export function calculateTriangle(data){
 if(!data||!Object.hasOwn(TRIANGLE_MODES,data.mode))throw new RangeError('Choisissez deux données connues du triangle rectangle.');
 const keys=TRIANGLE_MODES[data.mode];
 for(const key of keys){const value=data[key];if(!Number.isFinite(value)||value<=0||(key==='angle'?value>=90:value>1000000))throw new RangeError(key==='angle'?'L’angle α doit être strictement entre 0° et 90°.':'Les côtés doivent être positifs, au maximum 1 000 000 mm.');}
 let {adjacent:a,opposite:b,hypotenuse:c,angle}=data;
 if(data.mode==='legs')c=Math.hypot(a,b);
 else if(data.mode==='hypAdjacent'||data.mode==='hypOpposite'){
  const leg=data.mode==='hypAdjacent'?a:b;
  if(c<=leg)throw new RangeError('La diagonale doit être plus grande que le côté connu.');
  const other=Math.sqrt((c-leg)*(c+leg));if(data.mode==='hypAdjacent')b=other;else a=other;
 }else{
  const radians=angle*Math.PI/180;
  if(data.mode==='adjacentAngle'){b=a*Math.tan(radians);c=a/Math.cos(radians);}
  if(data.mode==='oppositeAngle'){a=b/Math.tan(radians);c=b/Math.sin(radians);}
  if(data.mode==='hypAngle'){a=c*Math.cos(radians);b=c*Math.sin(radians);}
 }
 if(![a,b,c].every(v=>Number.isFinite(v)&&v>=.001&&v<=1000000))throw new RangeError('Le résultat dépasse les limites : côtés de 0,001 à 1 000 000 mm.');
 angle=Math.atan2(b,a)*180/Math.PI;
 return {adjacent:a,opposite:b,hypotenuse:c,angle,complement:90-angle,percent:b/a*100};
}
export function triangleText(data){
 const r=calculateTriangle(data);
 return ['WoodPilot — Pythagore / Trigonométrie','Triangle rectangle uniquement',`Données connues : ${TRIANGLE_MODES[data.mode].map(key=>`${TRIANGLE_LABELS[key]} = ${formatMeasure(data[key])}${key==='angle'?'°':' mm'}`).join(' ; ')}`,`Base : ${formatMeasure(r.adjacent)} mm`,`Hauteur : ${formatMeasure(r.opposite)} mm`,`Diagonale : ${formatMeasure(r.hypotenuse)} mm`,`Angle α / base : ${formatMeasure(r.angle)}°`,`Angle complémentaire : ${formatMeasure(r.complement)}°`,`Pente : ${formatMeasure(r.percent)} %`,'Pythagore : diagonale² = base² + hauteur²','Trigonométrie : tan α = hauteur/base ; sin α = hauteur/diagonale ; cos α = base/diagonale','Les calculs utilisent les valeurs complètes, sans arrondir les résultats intermédiaires.'].join('\n');
}
