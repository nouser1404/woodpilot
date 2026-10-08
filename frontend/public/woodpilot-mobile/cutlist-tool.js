import { recoverableOffcuts } from './offcuts.js';
import { listOffcuts,importWorkspace } from './project-store.js';
import { validateCutList,calculateNesting,cutListCsv } from './manufacturing.js';
import { editMeasurement } from './measurement-input.js';
import { formatMeasure } from './cintrage.js';
import { downloadBlob,reportCanvas,reportPages } from './export-result.js';
export function createCutListTool({notify,haptic}) {
  let data={panel:{lengthMm:2800,widthMm:2070,sawKerfMm:4},pieces:[]};
  const root=document.querySelector('#cutlistTool'),pieceSheet=document.querySelector('#pieceSheet');
  let editingIndex=null,draft,activePanel=0;
  const labels={lengthMm:'Longueur',widthMm:'Largeur',thicknessMm:'Épaisseur',quantity:'Quantité'};
  function render() {
    validateCutList(data);
    for(const key of ['lengthMm','widthMm','sawKerfMm'])root.querySelector(`[data-value="${key}"]`).textContent=`${formatMeasure(data.panel[key])} mm`;
    root.querySelectorAll('[data-panel-measurement]').forEach(button=>button.disabled=Boolean(data.sourceOffcut)&&button.dataset.panelMeasurement!=='sawKerfMm');
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
        const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox',`0 0 ${data.panel.lengthMm} ${data.panel.widthMm}`);svg.setAttribute('role','img');svg.setAttribute('aria-label',title.textContent);
        const outline=document.createElementNS(svg.namespaceURI,'rect');outline.setAttribute('width',data.panel.lengthMm);outline.setAttribute('height',data.panel.widthMm);outline.setAttribute('class','panel-outline');svg.append(outline);
        panel.pieces.forEach(piece=>{
          const rect=document.createElementNS(svg.namespaceURI,'rect');for(const [key,value] of Object.entries({x:piece.x,y:piece.y,width:piece.lengthMm,height:piece.widthMm}))rect.setAttribute(key,String(value));rect.setAttribute('class','slat');svg.append(rect);
          const label=document.createElementNS(svg.namespaceURI,'text');label.setAttribute('x',String(piece.x+piece.lengthMm/2));label.setAttribute('y',String(piece.y+piece.widthMm/2));label.setAttribute('class','piece-label');label.setAttribute('font-size',String(Math.min(60,piece.widthMm/2,piece.lengthMm/3)));label.textContent=piece.code;svg.append(label);
        });
        const legend=document.createElement('ul');panel.pieces.forEach(p=>{const li=document.createElement('li');li.textContent=`${p.code} · ${p.name} · ${p.originalLengthMm} × ${p.originalWidthMm} mm${p.rotated?' · tourné de 90°':''}`;legend.append(li);});article.append(title,svg,legend);panels.append(article);
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
    pieceSheet.querySelector('[data-piece-name]').value=draft.name;pieceSheet.querySelector('[data-rotation]').checked=draft.allowRotation;pieceSheet.querySelector('[role="alert"]').textContent='';renderDraft();pieceSheet.showModal();
  }
  pieceSheet.querySelectorAll('[data-measurement]').forEach(button=>button.onclick=()=>{
    const key=button.dataset.measurement;
    editMeasurement({label:labels[key],value:draft[key],unit:key==='quantity'?'':'mm',integer:key==='quantity',min:key==='quantity'?1:.001,max:key==='quantity'?200:100000,trigger:button,onConfirm(value){draft[key]=value;renderDraft();}});
  });
  pieceSheet.querySelector('form').onsubmit=event=>{
    event.preventDefault();try{draft.name=pieceSheet.querySelector('[data-piece-name]').value.trim();draft.allowRotation=pieceSheet.querySelector('[data-rotation]').checked;
      const next=structuredClone(data);if(editingIndex===null)next.pieces.push(draft);else next.pieces[editingIndex]=draft;validateCutList(next);data=next;render();pieceSheet.close();haptic();
    }catch(error){pieceSheet.querySelector('[role="alert"]').textContent=error.message;}
  };
  root.querySelector('[data-add-piece]').onclick=()=>openPiece();
  root.querySelectorAll('[data-panel-measurement]').forEach(button=>button.onclick=()=>{
    const key=button.dataset.panelMeasurement;
    editMeasurement({label:{lengthMm:'Longueur du panneau',widthMm:'Largeur du panneau',sawKerfMm:'Trait de scie'}[key],value:data.panel[key],min:key==='sawKerfMm'?0:.001,max:key==='sawKerfMm'?20:100000,trigger:button,onConfirm(value){const next={...data,panel:{...data.panel,[key]:value}};validateCutList(next);data=next;render();}});
  });
  root.querySelector('[data-commercial-panels]').onclick=()=>{delete data.sourceOffcut;render();};
  root.querySelector('[data-save-offcuts]').onclick=async()=>{try{const flat=calculateNesting(data).flatMap(group=>group.result.panels.map(panel=>({panel,thickness:group.thickness}))),selected=flat[activePanel];if(!selected)throw new Error('Aucun panneau à récupérer.');const existing=await listOffcuts(),origin=JSON.stringify({panel:data.panel,pieces:data.pieces,source:data.sourceOffcut?.id,index:activePanel});if(existing.some(item=>item.origin===origin))throw new Error('Les chutes de ce plan sont déjà conservées.');const offcuts=recoverableOffcuts(selected.panel,selected.thickness).map(item=>({...item,id:crypto.randomUUID(),origin}));if(existing.length+offcuts.length>1000)throw new Error('Maximum : 1000 chutes conservées, corbeille comprise.');if(!offcuts.length)throw new Error('Aucune chute rectangulaire de 100 × 100 mm minimum.');await importWorkspace([],offcuts);notify(`${offcuts.length} chute(s) conservée(s). Vérifiez leurs dimensions après coupe.`);}catch(error){notify(error.message);}};
  root.querySelector('[data-csv]').onclick=()=>{downloadBlob(new Blob([cutListCsv(data)],{type:'text/csv;charset=utf-8'}),'woodpilot-liste-debit.csv');notify('Liste de débit CSV téléchargée.');};
  root.querySelector('[data-panel-select]').onchange=event=>{activePanel=Number(event.target.value);render();};
  async function panelCanvas(article,paged=false) {
    const text=`WoodPilot — Débit / Calpinage\n${article.querySelector('h4').textContent}\nPanneau ${data.panel.lengthMm} × ${data.panel.widthMm} mm · trait de scie ${data.panel.sawKerfMm} mm\n${data.sourceOffcut?'Chute unique : '+data.sourceOffcut.name:'Panneaux commerciaux'}\n${root.querySelector('[data-overflow-count]').textContent}\n${[...article.querySelectorAll('li')].map(li=>li.textContent).join('\n')}\nPlan indicatif, sans séquence de coupe. Fil bloqué : pièce parallèle à la longueur du panneau.`;
    return paged?reportPages(text,article.querySelector('svg')):reportCanvas(text,article.querySelector('svg'));
  }
  render();
  return {canvas(){const article=root.querySelectorAll('.nesting-panel')[activePanel];return article?panelCanvas(article):reportCanvas(this.text());},async canvases(){const pages=await reportPages(this.text());for(const article of root.querySelectorAll('.nesting-panel'))pages.push(...await panelCanvas(article,true));return pages;},root,open(){root.showModal();},reuseOffcut(item){const next={...data,panel:{lengthMm:item.lengthMm,widthMm:item.widthMm,sawKerfMm:data.panel.sawKerfMm},sourceOffcut:{id:item.id,name:item.name,thicknessMm:item.thicknessMm,lengthMm:item.lengthMm,widthMm:item.widthMm}};validateCutList(next);data=next;render();},snapshot(){return structuredClone(data);},load(next){validateCutList(next);data=structuredClone(next);render();},replacePieces(pieces){const next={...data,pieces};validateCutList(next);data=next;render();},hasPieces(){return data.pieces.length>0;},text(){return `WoodPilot — Débit / Calpinage\n${data.sourceOffcut?'Chute unique : '+data.sourceOffcut.name+' · '+data.sourceOffcut.thicknessMm+' mm':'Panneaux commerciaux'}\nFormat panneau : ${data.panel.lengthMm} × ${data.panel.widthMm} mm · trait de scie ${data.panel.sawKerfMm} mm\nPanneaux séparés par épaisseur. Fil parallèle à la longueur des pièces si rotation interdite.\n${data.pieces.map((p,i)=>`P${i+1} : ${p.quantity} × ${p.name} · ${p.lengthMm} × ${p.widthMm} × ${p.thicknessMm} mm${p.allowRotation?'':' · fil bloqué'}`).join('\n')}\n${calculateNesting(data).map(g=>`${g.thickness} mm : ${g.result.panels.length} panneaux ; taux utilisé ${formatMeasure(g.result.utilizationPct)} % ; ${g.result.overflowPieces.length} pièces non placées`).join('\n')}\nPlacement indicatif par découpes rectangulaires. Aucune garantie d’optimum ni séquence de coupe.`;}};
}
