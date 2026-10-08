import { formatMeasure } from './cintrage.js';
// Conventions métier de nouser1404/appcalpi/Aretiers, référence documentée dans docs/mobile/ARETIERS.md.
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const dot=(a,b)=>a.reduce((sum,v,i)=>sum+v*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const norm=a=>Math.hypot(...a);
const distance=(a,b)=>norm(sub(a,b));
export function calculateAretiers({n,R,H,dx=0,dy=0,zCut=0,zCut2=0}) {
  if(!Number.isInteger(n)||n<3||n>24 || ![R,H,dx,dy,zCut,zCut2].every(Number.isFinite) || R<.001 || H<.001 || Math.max(R,H,Math.abs(dx),Math.abs(dy))>1000000)throw new RangeError('Choisissez 3 à 24 faces et des dimensions valides (maximum 1 000 000 mm).');
  if(zCut<0||zCut>=H||zCut2<0||zCut2>=H)throw new RangeError('Chaque hauteur de tronquage doit être comprise entre 0 et la hauteur du sommet (exclue).');
  const apex=[dx,dy,H],base=Array.from({length:n},(_,i)=>[R*Math.cos(2*Math.PI*i/n),R*Math.sin(2*Math.PI*i/n),0]);
  const levels=[...new Set([zCut,zCut2].filter(z=>z>0))].sort((a,b)=>a-b);
  const sections=levels.map(z=>({z,points:base.map(v=>v.map((coordinate,i)=>coordinate*(1-z/H)+apex[i]*(z/H)))}));
  const normals=base.map((point,i)=>cross(sub(point,apex),sub(base[(i+1)%n],apex)));
  const items=base.map((point,i)=>{
    const left=normals[(i+n-1)%n],right=normals[i];
    const delta=Math.acos(Math.max(-1,Math.min(1,dot(left,right)/(norm(left)*norm(right)))))*180/Math.PI;
    const length=distance(apex,point),cutLength=length*((levels.at(-1)||H)/H);
    return {index:i,length,cutLength,delta,interior:180-delta,bevelFace:delta/2,bevelTool:90-delta/2};
  });
  return {apex,base,sections,items,baseEdge:2*R*Math.sin(Math.PI/n)};
}
export function faceTemplate(data,index) {
  const model=calculateAretiers(data);if(!Number.isInteger(index)||index<0||index>=data.n)throw new RangeError('Face invalide.');
  const next=(index+1)%data.n,b=model.baseEdge,left=model.items[index].length,right=model.items[next].length;
  const x=(left*left-right*right+b*b)/(2*b),y=Math.sqrt(Math.max(0,left*left-x*x));
  const z=Math.max(data.zCut||0,data.zCut2||0),t=z/data.H;
  const points=z>0?[[0,0],[b,0],[b+(x-b)*t,y*t],[x*t,y*t]]:[[0,0],[b,0],[x,y]];
  return {points,base:b,left:model.items[index].cutLength,right:model.items[next].cutLength};
}
export function templateSvg(data,index) {
  const {points}=faceTemplate(data,index),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
  const minX=Math.min(...xs),maxX=Math.max(...xs),height=Math.max(...ys),margin=20,w=maxX-minX+margin*2,h=height+margin*2;
  const coordinates=points.map(([x,y])=>`${x-minX+margin},${height-y+margin}`).join(' ');
  // Gabarit 1:1, sans compensation d'épaisseur, de trait de scie ou de jeu.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}mm" height="${h}mm" viewBox="0 0 ${w} ${h}"><title>WoodPilot — Gabarit face ${index+1}, dimensions extérieures</title><polygon points="${coordinates}" fill="none" stroke="black" stroke-width="0.3"/></svg>`;
}
export function aretiersText(data) {
  const model=calculateAretiers(data);
  return `WoodPilot — Arêtiers\nPyramide à base régulière de ${data.n} faces\nRayon aux sommets : ${formatMeasure(data.R)} mm\nHauteur du sommet : ${formatMeasure(data.H)} mm\nDésaxage X / Y : ${formatMeasure(data.dx)} / ${formatMeasure(data.dy)} mm\nTronquages : ${formatMeasure(data.zCut)} / ${formatMeasure(data.zCut2)} mm\nCôté de base : ${formatMeasure(model.baseEdge)} mm\n${model.items.map(item=>`Arêtier ${item.index+1} : longueur ${formatMeasure(item.cutLength)} mm ; δ ${formatMeasure(item.delta)}° ; δ/2 ${formatMeasure(item.bevelFace)}° ; 90° − δ/2 ${formatMeasure(item.bevelTool)}°`).join('\n')}\nδ = angle entre normales, convention du dépôt appcalpi.\nBiseau de référence = δ/2 ; réglage outil de référence = 90° − δ/2.\nDimensions extérieures, sans compensation d’épaisseur ni trait de scie.`;
}
