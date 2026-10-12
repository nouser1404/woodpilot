import {PANEL_DECORS,PANEL_TEXTURES} from './decor-catalog.js';
export {PANEL_DECORS,PANEL_TEXTURES};
export const decorSearch=(items,query='')=>{const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');const q=normalize(query);return items.filter(s=>normalize([s.code,s.name,s.family||'',s.manufacturer].join(' ')).includes(q));};
export function validateDecorSelection(data){
 if(data?.kind==='decor'){const entry=PANEL_DECORS.find(s=>s.code===data.decorCode);if(!entry||!entry.finishes.includes(data.finish))throw new RangeError('Décor ou finition invalide.');}
 else if(data?.kind==='texture'){if(!PANEL_TEXTURES.some(s=>s.code===data.textureCode))throw new RangeError('Texture invalide.');}
 else throw new RangeError('Sélection de panneau invalide.');
 return data;
}
export function decorSelectionText(data){validateDecorSelection(data);const texture=data.kind==='texture',entry=(texture?PANEL_TEXTURES:PANEL_DECORS).find(s=>s.code===(texture?data.textureCode:data.decorCode));return `WoodPilot — Palette de couleurs\n${entry.manufacturer} · ${entry.code} · ${entry.name}${texture?'':`\nFinition : ${data.finish}`}\n${entry.url}\nAperçu numérique indicatif : confirmer sur échantillon physique. Disponibilité selon le support et le fournisseur.`;}
