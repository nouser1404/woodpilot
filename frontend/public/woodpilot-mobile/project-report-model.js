import {bendingText} from './cintrage.js';
import {slopeText} from './slope.js';
import {miterText,spacingText} from './calculators.js';
import {aretiersText} from './aretiers.js';
import {helixText} from './helix.js';
import {triangleText} from './triangle.js';
import {stairLayoutText} from './stairs-layout.js';
import {hygrometryText} from './hygrometry.js';
import {generateCabinet,calculateNesting} from './manufacturing.js';
import {nestingReport} from './nesting-details.js';
import {validateRalSelection,RAL_PALETTE,ralFamily,RAL_WARNING} from './ral-model.js';
import {decorSelectionText} from './decor-model.js';
import {validateInclination,slopeFromAngle} from './inclinometer-model.js';
const mm=n=>Math.round(n).toLocaleString('fr-FR');
export function projectEntryText(entry,date){
 const d=entry.data;
 switch(entry.toolId){
 case 'bending':return bendingText(d.chord,d.sagitta);
 case 'slope':return slopeText(d.run,d.rise);
 case 'angles':return miterText(d.angle);
 case 'spacing':return spacingText(d.length,d.width,d.count,d.endGaps);
 case 'aretiers':return aretiersText(d);
 case 'helix':return helixText(d);
 case 'triangle':return triangleText(d);
 case 'stairs':return stairLayoutText(d);
 case 'hygrometry':return hygrometryText(d);
 case 'ral':validateRalSelection(d);return d.kind?decorSelectionText(d):`Palette de couleurs\nRAL ${d.code} · ${ralFamily(d.code)}\nCouleur ${d.hex} · origine : ${d.source==='photo'?'photo':d.source==='palette'?'nuancier':'saisie manuelle'}\n${RAL_WARNING}`;
 case 'cutlist':return nestingReport(d,calculateNesting(d),date);
 case 'cabinet':return `Caisson · ${mm(d.width)} × ${mm(d.height)} × ${mm(d.depth)} mm\nDessus/dessous entre côtés, fond rapporté.\n${generateCabinet(d).map(p=>`${p.quantity} × ${p.name} : ${mm(p.lengthMm)} × ${mm(p.widthMm)} × ${mm(p.thicknessMm)} mm`).join('\n')}\nSans façades, jeux de montage ni compensation de chants.`;
 case 'inclino':validateInclination(d);return `Inclinomètre\nAngle ${d.angle.toLocaleString('fr-FR',{maximumFractionDigits:1})}°\nPente ${slopeFromAngle(d.angle).percent?.toLocaleString('fr-FR',{maximumFractionDigits:1})??'verticale'} %\nMesure : ${new Date(d.measuredAt).toLocaleString('fr-FR')}`;
 case 'offcuts':return `Chutes enregistrées\n${d.offcuts.filter(s=>!s.deletedAt).map(s=>`${s.name} : ${mm(s.lengthMm)} × ${mm(s.widthMm)} × ${mm(s.thicknessMm)} mm${s.usedAt?' · utilisée':''}`).join('\n')}`;
 case 'photo':return 'Photo Métré'; // Recalculée à la résolution de la photo par le renderer dédié.
 default:throw new Error(`L’export ne prend pas en charge l’outil « ${entry.toolId} ». Aucun document incomplet n’a été téléchargé.`);
 }
}
export function projectReportSections(project,date=new Date()){
 if(!project||project.deletedAt||!Array.isArray(project.entries))throw new Error('Projet indisponible.');
 const entries=project.entries.filter(e=>!e.deletedAt);if(entries.length>1000)throw new Error('Projet trop volumineux.');
 return {name:project.name,cover:`WoodPilot — Dossier technique\nProjet : ${project.name}\nCréé le ${new Date(project.createdAt).toLocaleDateString('fr-FR')}\nExporté le ${date.toLocaleString('fr-FR')}\n${entries.length} élément(s) enregistré(s)\n\nNotes techniques\n${project.notes||'Aucune note technique.'}\n\nContenu\n${entries.map((e,i)=>`${i+1}. ${e.title} · ${new Date(e.createdAt).toLocaleString('fr-FR')}`).join('\n')}`,entries:entries.map((entry,i)=>({...entry,heading:`${i+1}. ${entry.title}\nProjet : ${project.name}\nEnregistré le ${new Date(entry.createdAt).toLocaleString('fr-FR')}`,text:projectEntryText(entry,date)}))};
}
export function projectReportFilename(name){const slug=String(name).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'-').replace(/^-|-$/g,'').slice(0,60);return 'woodpilot-projet-'+(slug||'dossier')+'.pdf';}
export function projectRalSwatch(data){return data?.kind?null:RAL_PALETTE.find(c=>c.code===data?.code)?.hex||null;}
