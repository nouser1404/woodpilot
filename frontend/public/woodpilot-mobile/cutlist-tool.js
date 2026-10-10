import { ELEMENT_NAMES,MATERIALS,edgeDescription,nestingReport } from './nesting-details.js';
import { drawNestingPanel } from './nesting-plan.js';
import { recoverableOffcuts } from './offcuts.js';
import { listOffcuts,importWorkspace } from './project-store.js';
import { validateCutList,calculateNesting,cutListCsv } from './manufacturing.js';
import { editMeasurement } from './measurement-input.js';
import { formatMeasure } from './cintrage.js';
import { downloadBlob,reportCanvas,reportPages } from './export-result.js';
export function createCutListTool({notify,haptic}) {
  let data={panel:{lengthMm:2800,widthMm:2070,sawKerfMm:3,edgeMarginMm:20},pieces:[]};
  const root=document.querySelector('#cutlistTool'),pieceSheet=document.querySelector('#pieceSheet');
  let editingIndex=null,draft,activePanel=0;
  const preset=pieceSheet.querySelector('[data-piece-preset]');
  for(const name of [...ELEMENT_NAMES,'Autre']){const option=document.createElement('option');option.value=name;option.textContent=name;preset.append(option);}
  const material=root.querySelector('[data-material]');
  for(const name of MATERIALS){const option=document.createElement('option');option.value=name;option.textContent=name;material.append(option);}
  material.onchange=()=>{data.material=material.value;render();};
  root.querySelector('[data-cutlist-project]').oninput=event=>{data.projectName=event.target.value.trim();};
  preset.onchange=()=>{pieceSheet.querySelector('[data-custom-name]').hidden=preset.value!=='Autre';};
  const labels={lengthMm:'Longueur',widthMm:'Largeur',thicknessMm:'Épaisseur',quantity:'Quantité'};
  function render() {
    validateCutList(data);
    material.value=data.material||MATERIALS[0];root.querySelector('[data-cutlist-project]').value=data.projectName||'';
    for(const key of ['lengthMm','widthMm','sawKerfMm','edgeMarginMm'])root.querySelector(`[data-value="${key}"]`).textContent=`${formatMeasure(data.panel[key]??0)} mm`;
    root.querySelectorAll('[data-panel-measurement]').forEach(button=>button.disabled=Boolean(data.sourceOffcut)&&['lengthMm','widthMm'].includes(button.dataset.panelMeasurement));
    const list=root.querySelector('[data-pieces]');list.replaceChildren();
    if(!data.pieces.length)list.textContent='Ajoutez vos pièces ou envoyez-les depuis Caisson.';
    data.pieces.forEach((piece,index)=>{
      const row=document.createElement('article');row.className='piece-row';
      const edit=document.createElement('button');edit.className='secondary-btn';edit.textContent=`P${index+1} · ${piece.quantity} × ${piece.name} · ${piece.lengthMm} × ${piece.widthMm} × ${piece.thicknessMm} mm${piece.allowRotation?'':' · fil bloqué'}`;edit.onclick=()=>openPiece(index);
      const remove=document.createElement('button');remove.className='icon-btn';remove.setAttribute('aria-label',`Retirer ${piece.name}`);remove.innerHTML='<span class="material-symbols-rounded">delete</span>';remove.onclick=()=>{data.pieces.splice(index,1);render();};row.append(edit,remove);list.append(row);
    });
    const groups=calculateNesting(data),panels=root.querySelector('[data-panels]');panels.replaceChildren();
    const panelSelect=root.querySelector('[data-panel-select]');panelSelect.replaceChildren();let flatIndex=0;
    let total=0,overflow=0;
    for(const group of groups) {
      total+=group.result.panels.length;overflow+=group.result.overflowPieces.length;
      
      group.result.panels.forEach((panel,index)=>{
        const option=document.createElement('option');option.value=String(flatIndex++);option.textContent=`Panneau ${index+1} · ${group.thickness} mm`;panelSelect.append(option);
        const article=document.createElement('article');article.className='nesting-panel';const title=document.createElement('h4');title.textContent=`Panneau ${index+1} · ${group.thickness} mm`;
        const svg=drawNestingPanel(data.panel,panel,title.textContent);
        const legend=document.createElement('ul');panel.pieces.forEach(p=>{const li=document.createElement('li');li.textContent=`${p.code} · ${p.name} · ${p.originalLengthMm} × ${p.originalWidthMm} mm${p.rotated?' · tourné de 90°':''} · ${edgeDescription(p)}`;legend.append(li);});const stats=document.createElement('p');stats.textContent=`${panel.pieces.length} occurrence(s) · taux de chute ${(100-panel.usedAreaMm2/(data.panel.lengthMm*data.panel.widthMm)*100).toLocaleString('fr-FR',{maximumFractionDigits:1})} % · pointillés orange : chants plaqués${data.panel.edgeMarginMm?` · marge ${data.panel.edgeMarginMm} mm par bord (limite grise), utile ${data.panel.lengthMm-2*data.panel.edgeMarginMm} × ${data.panel.widthMm-2*data.panel.edgeMarginMm} mm`:``}`;article.append(title,stats,svg,legend);panels.append(article);
      });
      group.result.overflowPieces.forEach(p=>{const warning=document.createElement('p');warning.className='nesting-overflow';warning.textContent=`${data.sourceOffcut?'Non placée sur la chute unique':'Hors format'} : ${p.name} · ${p.originalLengthMm} × ${p.originalWidthMm} mm`;panels.append(warning);});
    }
    activePanel=Math.min(activePanel,Math.max(0,flatIndex-1));panelSelect.value=String(activePanel);
    panels.querySelectorAll('article').forEach((article,i)=>article.hidden=i!==activePanel);panelSelect.disabled=flatIndex===0;
    root.querySelector('[data-source-offcut]').textContent=data.sourceOffcut?`Chute unique : ${data.sourceOffcut.name} · ${data.sourceOffcut.thicknessMm} mm. Aucun panneau supplémentaire disponible.`:'Panneaux commerciaux';
    root.querySelector('[data-commercial-panels]').hidden=!data.sourceOffcut;
    root.querySelector('[data-panel-count]').textContent=`${total} panneau(x)`;
    root.querySelector('[data-overflow-count]').textContent=!data.pieces.length?'Ajoutez des pièces ou importez celles du caisson.':overflow?`${overflow} pièce(s) ${data.sourceOffcut?'non placée(s) sur cette chute':'hors format'} — plan incomplet`:'Toutes les pièces tiennent dans le format choisi.';
    root.querySelector('[data-overflow-count]').classList.toggle('nesting-overflow',overflow>0);
  }
  function renderDraft() {for(const key of Object.keys(labels))pieceSheet.querySelector(`[data-value="${key}"]`).textContent=`${draft[key]}${key==='quantity'?'':' mm'}`;}
  function openPiece(index=null) {
    if(index===null&&data.pieces.length>=100){notify('Maximum : 100 lignes.');return;}
    editingIndex=index;draft=index===null?{name:'Tablette',lengthMm:600,widthMm:400,thicknessMm:19,quantity:1,allowRotation:false}:{...data.pieces[index]};
    preset.value=ELEMENT_NAMES.includes(draft.name)?draft.name:'Autre';preset.onchange();pieceSheet.querySelectorAll('[data-edge]').forEach(input=>input.checked=Boolean(draft[input.dataset.edge]));pieceSheet.querySelector('[data-piece-name]').value=draft.name;pieceSheet.querySelector('[data-rotation]').checked=draft.allowRotation;pieceSheet.querySelector('[role="alert"]').textContent='';renderDraft();pieceSheet.showModal();
  }
  pieceSheet.querySelectorAll('[data-measurement]').forEach(button=>button.onclick=()=>{
    const key=button.dataset.measurement;
    editMeasurement({label:labels[key],value:draft[key],unit:key==='quantity'?'':'mm',integer:key==='quantity',min:key==='quantity'?1:.001,max:key==='quantity'?200:100000,trigger:button,onConfirm(value){draft[key]=value;renderDraft();}});
  });
  pieceSheet.querySelector('form').onsubmit=event=>{
    event.preventDefault();try{draft.name=preset.value==='Autre'?pieceSheet.querySelector('[data-piece-name]').value.trim():preset.value;pieceSheet.querySelectorAll('[data-edge]').forEach(input=>draft[input.dataset.edge]=input.checked);draft.allowRotation=pieceSheet.querySelector('[data-rotation]').checked;
      const next=structuredClone(data);if(editingIndex===null)next.pieces.push(draft);else next.pieces[editingIndex]=draft;validateCutList(next);data=next;render();pieceSheet.close();haptic();
    }catch(error){pieceSheet.querySelector('[role="alert"]').textContent=error.message;}
  };
  root.querySelector('[data-add-piece]').onclick=()=>openPiece();
  root.querySelectorAll('[data-panel-measurement]').forEach(button=>button.onclick=()=>{
    const key=button.dataset.panelMeasurement;
    editMeasurement({label:{lengthMm:'Longueur du panneau',widthMm:'Largeur du panneau',sawKerfMm:'Trait de scie',edgeMarginMm:'Marge sur chaque bord'}[key],value:data.panel[key]??0,min:['sawKerfMm','edgeMarginMm'].includes(key)?0:.001,max:key==='edgeMarginMm'?Math.min(data.panel.lengthMm,data.panel.widthMm)/2-.001:key==='sawKerfMm'?20:100000,trigger:button,onConfirm(value){const next={...data,panel:{...data.panel,[key]:value}};validateCutList(next);data=next;render();}});
  });
  root.querySelector('[data-commercial-panels]').onclick=()=>{delete data.sourceOffcut;render();};
  root.querySelector('[data-save-offcuts]').onclick=async()=>{try{const flat=calculateNesting(data).flatMap(group=>group.result.panels.map(panel=>({panel,thickness:group.thickness}))),selected=flat[activePanel];if(!selected)throw new Error('Aucun panneau à récupérer.');const existing=await listOffcuts(),origin=JSON.stringify({panel:data.panel,pieces:data.pieces,source:data.sourceOffcut?.id,index:activePanel});if(existing.some(item=>item.origin===origin))throw new Error('Les chutes de ce plan sont déjà conservées.');const offcuts=recoverableOffcuts(selected.panel,selected.thickness).map(item=>({...item,id:crypto.randomUUID(),origin}));if(existing.length+offcuts.length>1000)throw new Error('Maximum : 1000 chutes conservées, corbeille comprise.');if(!offcuts.length)throw new Error('Aucune chute rectangulaire de 100 × 100 mm minimum.');await importWorkspace([],offcuts);notify(`${offcuts.length} chute(s) conservée(s). Vérifiez leurs dimensions après coupe.`);}catch(error){notify(error.message);}};
  root.querySelector('[data-csv]').onclick=()=>{downloadBlob(new Blob([cutListCsv(data)],{type:'text/csv;charset=utf-8'}),'woodpilot-liste-debit.csv');notify('Liste de débit CSV téléchargée.');};
  root.querySelector('[data-panel-select]').onchange=event=>{activePanel=Number(event.target.value);render();};
  async function panelCanvas(article,paged=false) {
    const text=`WoodPilot — Plan détaillé\n${data.projectName?'Projet : '+data.projectName+'\n':''}Matériau : ${data.material||MATERIALS[0]}\nDate : ${new Date().toLocaleDateString('fr-FR')}\n${article.querySelector('h4').textContent}\n${article.querySelector('p').textContent}\nPanneau ${data.panel.lengthMm} × ${data.panel.widthMm} mm · trait de scie ${data.panel.sawKerfMm} mm\nMarge : ${data.panel.edgeMarginMm??0} mm sur chaque bord\n${data.sourceOffcut?'Chute unique : '+data.sourceOffcut.name:'Panneaux commerciaux'}\n${root.querySelector('[data-overflow-count]').textContent}\n${[...article.querySelectorAll('li')].map(li=>li.textContent).join('\n')}\nPlan indicatif, sans séquence de coupe. Fil bloqué : pièce parallèle à la longueur du panneau.`;
    return paged?reportPages(text,article.querySelector('svg'),true):reportCanvas(text,article.querySelector('svg'),true);
  }
  render();
  return {canvas(){const article=root.querySelectorAll('.nesting-panel')[activePanel];return article?panelCanvas(article):reportCanvas(this.text(),null,true);},async canvases(){const pages=await reportPages(this.text(),null,true);for(const article of root.querySelectorAll('.nesting-panel'))pages.push(...await panelCanvas(article,true));return pages;},root,open(){root.showModal();},reuseOffcut(item){const next={...data,panel:{lengthMm:item.lengthMm,widthMm:item.widthMm,sawKerfMm:data.panel.sawKerfMm,edgeMarginMm:0},sourceOffcut:{id:item.id,name:item.name,thicknessMm:item.thicknessMm,lengthMm:item.lengthMm,widthMm:item.widthMm}};validateCutList(next);data=next;render();},snapshot(){return structuredClone(data);},load(next){validateCutList(next);data=structuredClone(next);render();},setProjectName(name){if(!data.projectName){data.projectName=name;render();}},replacePieces(pieces){const next={...data,pieces};validateCutList(next);data=next;render();},hasPieces(){return data.pieces.length>0;},text(){return nestingReport(data,calculateNesting(data));}};
}
