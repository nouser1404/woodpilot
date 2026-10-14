// Coefficients moyens (% dimension / point % humidité du bois), Éduscol CGM TMA 2022, DS 2/9.
export const HYGROMETRY_SOURCE='https://sti.eduscol.education.fr/sites/eduscol.education.fr.sti/files/concours-examens/14665/14665-dossier-source.pdf';
export const EQUILIBRIUM_SOURCE='https://www.fpl.fs.usda.gov/documnts/pdf1973/simps73a.pdf';
export const WOOD_MOVEMENT_SPECIES=[
 ['oak','Chêne',.20,.32],['beech','Hêtre',.21,.41],['ash','Frêne',.19,.32],['chestnut','Châtaignier',.14,.24],['maple','Érable',.15,.26],['cherry','Merisier',.17,.28],['douglas','Douglas',.17,.27],['spruce','Épicéa',.17,.31],['larch','Mélèze',.16,.32],['maritime-pine','Pin maritime',.15,.30],['fir','Sapin',.14,.31],['framire','Framiré',.11,.17],['iroko','Iroko',.16,.27],['movingui','Movingui',.19,.30],['sapele','Sapelli',.22,.29],['sipo','Sipo',.20,.24],['teak','Teck',.14,.27],
].map(([id,name,radial,tangential])=>({id,name,radial,tangential}));
export const HYGROMETRY_DEFAULTS={species:'oak',orientation:'tangential',dimension:600,mode:'wood',initialMoisture:12,finalMoisture:18,initialRh:45,finalRh:70,initialTemperature:20,finalTemperature:20};
export const ORIENTATION_LABELS={tangential:'Sur dosse · tangentiel',radial:'Sur quartier · radial',unknown:'Débit inconnu · plage estimée'};
function range(value,min,max,label){if(!Number.isFinite(value)||value<min||value>max)throw new RangeError(`${label} : valeur attendue entre ${min} et ${max}.`);return value;}
// Hailwood–Horrobin / Simpson, paramètres en °C du Wood Handbook (FPL).
export function equilibriumMoisture(relativeHumidity,temperature){
 const h=range(relativeHumidity,10,95,'Humidité relative de l’air (%)')/100,t=range(temperature,0,40,'Température (°C)');
 const w=349+1.29*t+.0135*t*t,k=.805+.000736*t-.00000273*t*t,k1=6.27-.00938*t-.000303*t*t,k2=1.91+.0407*t-.000293*t*t,kh=k*h;
 return 1800/w*(kh/(1-kh)+(k1*kh+2*k1*k2*kh*kh)/(1+k1*kh+k1*k2*kh*kh));
}
export function calculateHygrometry(data){
 if(!data||typeof data!=='object')throw new RangeError('Données hygrométriques invalides.');
 const species=WOOD_MOVEMENT_SPECIES.find(s=>s.id===data.species);if(!species)throw new RangeError('Choisissez une essence référencée.');
 if(!Object.hasOwn(ORIENTATION_LABELS,data.orientation)||!['wood','air'].includes(data.mode))throw new RangeError('Choisissez le sens du débit et le mode d’humidité.');
 for(const [key,min,max] of [['initialMoisture',1,20],['finalMoisture',1,20],['initialRh',10,95],['finalRh',10,95],['initialTemperature',0,40],['finalTemperature',0,40]])if(data[key]!==undefined)range(data[key],min,max,key);
 const dimension=range(data.dimension,1,100000,'Dimension (mm)');
 const initial=data.mode==='wood'?range(data.initialMoisture,1,20,'Humidité initiale du bois (%)'):equilibriumMoisture(data.initialRh,data.initialTemperature);
 const final=data.mode==='wood'?range(data.finalMoisture,1,20,'Humidité finale du bois (%)'):equilibriumMoisture(data.finalRh,data.finalTemperature);
 if(initial>20||final>20)throw new RangeError('Humidité estimée supérieure à 20 % : ce modèle de bois en service ne couvre pas cette situation.');
 const deltaMoisture=final-initial;
 const directions=data.orientation==='unknown'?['radial','tangential']:[data.orientation];
 const variants=directions.map(direction=>{const coefficient=species[direction],change=dimension*coefficient*deltaMoisture/100;return {direction,coefficient,change,finalDimension:dimension+change,percent:coefficient*deltaMoisture};});
 const movement=Math.max(...variants.map(v=>Math.abs(v.change)));
 return {species,dimension,initialMoisture:initial,finalMoisture:final,deltaMoisture,variants,movement,movementAllowance:Math.ceil(movement),action:deltaMoisture>0?'Dilatation':deltaMoisture<0?'Retrait':'Aucune variation'};
}
export const moistureText=value=>value.toLocaleString('fr-FR',{maximumFractionDigits:1});
export function movementText(value){if(value===0)return '0 mm';if(Math.abs(value)<.5)return (value>0?'+':'−')+' moins de 1 mm';return (value>0?'+':'−')+Math.round(Math.abs(value)).toLocaleString('fr-FR')+' mm';}
export function hygrometryText(data){const r=calculateHygrometry(data);return `WoodPilot — Variation hygrométrique\n${r.species.name} · ${ORIENTATION_LABELS[data.orientation]}\nDimension perpendiculaire au fil : ${Math.round(r.dimension)} mm\nHumidité du bois : ${moistureText(r.initialMoisture)} → ${moistureText(r.finalMoisture)} %${data.mode==='air'?` (estimée à l’équilibre)\nAir : ${data.initialRh} % HR à ${data.initialTemperature} °C → ${data.finalRh} % HR à ${data.finalTemperature} °C`:''}\n${r.action}\n${r.variants.map(v=>`${v.direction==='radial'?'Radial':'Tangentiel'} : ${movementText(v.change)} · dimension finale ≈ ${Math.round(v.finalDimension)} mm`).join('\n')}\nMouvement total à permettre : ${r.movementAllowance} mm (arrondi supérieur, hors marge de montage)\nEstimation moyenne pour bois massif non modifié, non contraint, entre 1 et 20 % d’humidité. Pas de délai de stabilisation ni de prévision de tuilage.\nCoefficients : Éduscol, CGM TMA 2022, DS 2/9\n${HYGROMETRY_SOURCE}`;}
