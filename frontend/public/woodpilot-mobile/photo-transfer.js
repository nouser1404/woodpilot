import { formatMeasure } from './cintrage.js';
export function choosePhotoDimensions(lines,onConfirm) {
  if(!lines.length)throw new Error('Ajoutez au moins une cote à la photo.');
  const dialog=document.createElement('dialog');dialog.className='measurement-sheet';
  const form=document.createElement('form'),title=document.createElement('h2');title.textContent='Cotes vers Caisson';
  const help=document.createElement('p');help.textContent='Associez chaque dimension à une cote réelle. Les autres dimensions du caisson sont conservées.';
  const selects={};form.append(title,help);
  for(const [key,name] of Object.entries({width:'Largeur',height:'Hauteur',depth:'Profondeur hors tout'})){
    const label=document.createElement('label');label.textContent=name;const select=document.createElement('select');select.setAttribute('aria-label',name);
    const blank=document.createElement('option');blank.value='';blank.textContent='Conserver la dimension actuelle';select.append(blank);
    lines.forEach((line,index)=>{const option=document.createElement('option');option.value=String(index);option.textContent=`Cote ${index+1} · ${formatMeasure(line.value)} mm`;select.append(option);});label.append(select);form.append(label);selects[key]=select;
  }
  const error=document.createElement('p');error.setAttribute('role','alert');form.append(error);
  const send=document.createElement('button');send.type='submit';send.className='primary-btn';send.textContent='Appliquer au caisson';
  const cancel=document.createElement('button');cancel.type='button';cancel.className='secondary-btn';cancel.textContent='Annuler';cancel.onclick=()=>dialog.close();form.append(send,cancel);
  form.onsubmit=event=>{event.preventDefault();try{const dimensions={};for(const [key,select] of Object.entries(selects))if(select.value!=='')dimensions[key]=lines[Number(select.value)].value;if(!Object.keys(dimensions).length)throw new Error('Associez au moins une dimension.');onConfirm(dimensions);dialog.close();}catch(reason){error.textContent=reason.message;}};
  dialog.append(form);document.body.append(dialog);dialog.onclose=()=>dialog.remove();dialog.showModal();
}
