import { listOffcuts,putOffcut,importWorkspace } from './project-store.js';
import { validateOffcut,prepareOffcutImport } from './offcuts.js';
import { editMeasurement } from './measurement-input.js';
import { formatMeasure } from './cintrage.js';
export function validateOffcutsSnapshot(data){if(!data||!Array.isArray(data.offcuts)||data.offcuts.length>1000)throw new RangeError('Catalogue de chutes invalide.');prepareOffcutImport(data.offcuts);return data;}
export function createOffcutsTool({notify,transfer}) {
  const root=document.createElement('dialog');root.className='tool-dialog';root.setAttribute('aria-label','Chutes');
  root.innerHTML='<header class="tool-header"><h2>Chutes</h2><button data-close class="icon-btn" aria-label="Fermer Chutes"><span aria-hidden="true" class="material-symbols-rounded">close</span></button></header><p>Conservez les dimensions réellement mesurées et leur épaisseur. Le fil est parallèle à la longueur saisie.</p><button data-add class="primary-btn">Ajouter une chute</button><div data-items></div><details><summary>Chutes utilisées et corbeille</summary><div data-trash></div></details><div class="result-actions"><button data-save class="secondary-btn">Enregistrer</button><button data-share class="primary-btn">Partager</button></div>';
  document.body.append(root);let values=[];
  const action=(text,callback)=>{const button=document.createElement('button');button.className='secondary-btn';button.textContent=text;button.onclick=async()=>{try{await callback();}catch(error){notify(error.message);}};return button;};
  async function render(){values=await listOffcuts();const list=root.querySelector('[data-items]'),trash=root.querySelector('[data-trash]');list.replaceChildren();trash.replaceChildren();
    if(!values.some(item=>!item.deletedAt&&!item.usedAt))list.textContent='Aucune chute disponible.';
    values.forEach(item=>{const row=document.createElement('article');row.className='saved-entry';const heading=document.createElement('p');heading.textContent=`${item.name} · ${formatMeasure(item.lengthMm)} × ${formatMeasure(item.widthMm)} × ${formatMeasure(item.thicknessMm)} mm`;row.append(heading);
      if(item.deletedAt||item.usedAt){row.append(action('Remettre disponible',async()=>{delete item.deletedAt;delete item.usedAt;await putOffcut(item);await render();}));trash.append(row);return;}
      row.append(action('Utiliser pour le calpinage',()=>transfer(item)),action('Modifier',()=>edit(item)),action('Marquer utilisée',async()=>{item.usedAt=new Date().toISOString();await putOffcut(item);await render();}),action('Retirer',async()=>{item.deletedAt=new Date().toISOString();await putOffcut(item);await render();}));list.append(row);
    });
  }
  function edit(item={id:crypto.randomUUID(),name:'Chute',lengthMm:800,widthMm:400,thicknessMm:19}) {
    if(values.length>=1000&&!values.some(value=>value.id===item.id)){notify('Maximum : 1000 chutes conservées, corbeille comprise.');return;}
    const draft={...item},sheet=document.createElement('dialog');sheet.className='measurement-sheet';const form=document.createElement('form');
    const heading=document.createElement('h2');heading.textContent='Dimensions de la chute';const name=document.createElement('input');name.value=draft.name;name.maxLength=80;name.setAttribute('aria-label','Nom de la chute');form.append(heading,name);
    for(const [key,label] of Object.entries({lengthMm:'Longueur',widthMm:'Largeur',thicknessMm:'Épaisseur'})){const button=action(`${label} : ${draft[key]} mm`,()=>editMeasurement({label,value:draft[key],min:1,max:100000,trigger:button,onConfirm(value){draft[key]=value;button.textContent=`${label} : ${formatMeasure(value)} mm`;}}));button.type='button';form.append(button);}
    const error=document.createElement('p');error.setAttribute('role','alert');const save=document.createElement('button');save.className='primary-btn';save.textContent='Conserver la chute';save.type='submit';const cancel=action('Annuler',()=>sheet.close());cancel.type='button';form.append(error,save,cancel);
    form.onsubmit=async event=>{event.preventDefault();try{draft.name=name.value.trim();validateOffcut(draft);await putOffcut(draft);sheet.close();await render();}catch(reason){error.textContent=reason.message;}};
    sheet.append(form);document.body.append(sheet);sheet.onclose=()=>sheet.remove();sheet.showModal();
  }
  root.querySelector('[data-add]').onclick=()=>edit();
  return {root,async open(){try{await render();root.showModal();}catch(error){notify(error.message);}},snapshot(){return {offcuts:structuredClone(values)};},async load(data){validateOffcutsSnapshot(data);await importWorkspace([],prepareOffcutImport(data.offcuts,await listOffcuts()));await render();},text(){return `WoodPilot — Chutes\n${values.filter(item=>!item.deletedAt&&!item.usedAt).map(item=>`${item.name} : ${item.lengthMm} × ${item.widthMm} × ${item.thicknessMm} mm`).join('\n')}\nFil parallèle à la longueur. Dimensions à contrôler sur les chutes réelles.`;}};
}
