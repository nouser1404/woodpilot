import {validateDecorSelection} from './decor-model.js';
import {RAL_PALETTE} from './ral-palette.js';
export {RAL_PALETTE};
export const RAL_WARNING='Correspondance indicative : confirmer avec un nuancier physique avant de commander la peinture.';
export function parseHex(value){
  const hex=String(value).trim().toUpperCase();if(!/^#[0-9A-F]{6}$/.test(hex))throw new RangeError('Couleur HEX attendue : # suivi de 6 caractères.');
  return [1,3,5].map(offset=>parseInt(hex.slice(offset,offset+2),16));
}
export const rgbHex=rgb=>'#'+rgb.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('').toUpperCase();
export function rgbLab(rgb){
  if(!Array.isArray(rgb)||rgb.length!==3||rgb.some(v=>!Number.isFinite(v)||v<0||v>255))throw new RangeError('Couleur RGB invalide.');
  const [r,g,b]=rgb.map(v=>{const s=v/255;return s<=.04045?s/12.92:((s+.055)/1.055)**2.4;});
  const f=t=>t>(6/29)**3?Math.cbrt(t):t/(3*(6/29)**2)+4/29;
  const x=f((.4124564*r+.3575761*g+.1804375*b)/.95047),y=f(.2126729*r+.7151522*g+.072175*b),z=f((.0193339*r+.119192*g+.9503041*b)/1.08883);
  return [116*y-16,500*(x-y),200*(y-z)];
}
const paletteLab=RAL_PALETTE.map(color=>({...color,lab:rgbLab(parseHex(color.hex))}));
export function closestRal(hex,count=3){
  const lab=rgbLab(parseHex(hex));return paletteLab.map(({lab:other,...color})=>({...color,distance:Math.hypot(...other.map((v,i)=>v-lab[i]))})).sort((a,b)=>a.distance-b.distance||a.code.localeCompare(b.code)).slice(0,count);
}
export function samplePhotoColor(image,x,y,radius=5){
  if(!image||!Number.isInteger(image.width)||!Number.isInteger(image.height)||image.width<1||image.height<1||image.data?.length!==image.width*image.height*4||![x,y].every(Number.isFinite))throw new RangeError('Photo invalide.');
  x=Math.max(0,Math.min(image.width-1,Math.round(x)));y=Math.max(0,Math.min(image.height-1,Math.round(y)));
  const total=[0,0,0];let weight=0;
  for(let py=Math.max(0,y-radius);py<=Math.min(image.height-1,y+radius);py++)for(let px=Math.max(0,x-radius);px<=Math.min(image.width-1,x+radius);px++){
    const offset=(py*image.width+px)*4,alpha=image.data[offset+3]/255;weight+=alpha;for(let channel=0;channel<3;channel++)total[channel]+=image.data[offset+channel]*alpha;
  }
  if(!weight)throw new RangeError('Zone transparente : choisissez une zone peinte.');return rgbHex(total.map(v=>v/weight));
}
export const ralFamily=code=>({'1':'Jaunes et beiges','2':'Oranges','3':'Rouges','4':'Violets','5':'Bleus','6':'Verts','7':'Gris','8':'Bruns','9':'Blancs et noirs'})[code[0]]||'';
export function validateRalSelection(data){if(data?.kind)return validateDecorSelection(data);parseHex(data?.hex);if(!RAL_PALETTE.some(color=>color.code===data.code)||!['photo','manual','palette'].includes(data.source))throw new RangeError('Référence RAL invalide.');return data;}
