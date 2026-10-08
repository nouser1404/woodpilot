export function editText({title,value='',maxLength=200,onConfirm,multiline=true}) {
  const dialog=document.createElement('dialog');dialog.className='measurement-sheet';
  const form=document.createElement('form'),heading=document.createElement('h2');heading.textContent=title;
  const input=document.createElement(multiline?'textarea':'input');input.value=value;input.maxLength=maxLength;input.setAttribute('aria-label',title);
  const error=document.createElement('p');error.setAttribute('role','alert');
  const save=document.createElement('button');save.className='primary-btn';save.textContent='Enregistrer';save.type='submit';
  const cancel=document.createElement('button');cancel.className='secondary-btn';cancel.textContent='Annuler';cancel.type='button';cancel.onclick=()=>dialog.close();
  form.onsubmit=async event=>{event.preventDefault();try{await onConfirm(input.value.trim());dialog.close();}catch(reason){error.textContent=reason.message;}};
  form.append(heading,input,error,save,cancel);dialog.append(form);document.body.append(dialog);dialog.onclose=()=>dialog.remove();dialog.showModal();input.focus();
}
