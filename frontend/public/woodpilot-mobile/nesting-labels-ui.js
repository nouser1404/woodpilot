import {LABEL_FORMATS,nestingLabels,labelMarkup,labelsDocument} from './nesting-labels.js';
import {calculateNesting} from './manufacturing.js';
export function createNestingLabels(getData,notify){
 const dialog=document.createElement('dialog');dialog.className='tool-dialog';dialog.setAttribute('aria-label','Étiquettes de pièces');
 dialog.innerHTML='<header class="tool-header"><h2>Étiquettes</h2><button data-close class="icon-btn" aria-label="Fermer les étiquettes"><span class="material-symbols-rounded" aria-hidden="true">close</span></button></header><label class="field-label">Support<select aria-label="Format des étiquettes"></select></label><p data-label-summary></p><p class="calculation-note">Une étiquette par pièce placée. La référence P1-1 désigne la première occurrence de P1 sur le plan. Dimensions avant rotation.</p><div class="label-preview"></div><button data-print class="primary-btn"><span class="material-symbols-rounded" aria-hidden="true">print</span>Aperçu et impression</button>';
 document.body.append(dialog);dialog.querySelector('[data-close]').onclick=()=>dialog.close();
 const select=dialog.querySelector('select');for(const [key,f] of Object.entries(LABEL_FORMATS)){const option=document.createElement('option');option.value=key;option.textContent=f.name;select.append(option);}
 let labels=[];
 dialog.querySelector('[data-print]').onclick=()=>{const html=labelsDocument(labels,select.value),w=window.open('','_blank');if(!w){notify('Autorisez l’ouverture de l’aperçu d’impression dans votre navigateur.');return;}w.opener=null;w.document.open();w.document.write(html);w.document.close();};
 return {open(){const data=getData(),groups=calculateNesting(data);labels=nestingLabels(data,groups);if(!labels.length){notify('Calpinez au moins une pièce avant de créer les étiquettes.');return;}const missing=groups.reduce((n,g)=>n+g.result.overflowPieces.length,0);dialog.querySelector('[data-label-summary]').textContent=`${labels.length} étiquette(s)${missing?` · ${missing} pièce(s) non placée(s), sans étiquette`:''}`;dialog.querySelector('.label-preview').innerHTML=labels.map(labelMarkup).join('');dialog.showModal();}};
}
