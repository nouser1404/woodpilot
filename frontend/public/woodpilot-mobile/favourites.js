export function moveFavourite(ids,id,delta) {
  const next=[...ids],index=next.indexOf(id),target=index+delta;
  if(index<0||!Number.isInteger(delta)||target<0||target>=next.length)return next;
  [next[index],next[target]]=[next[target],next[index]];return next;
}
export function createFavouritesEditor({catalog,getIds,onChange}) {
  const dialog=document.createElement('dialog');dialog.className='measurement-sheet';dialog.setAttribute('aria-label','Réorganiser la roue');
  const title=document.createElement('h2');title.textContent='Ordre des favoris';const list=document.createElement('div');
  const close=document.createElement('button');close.className='primary-btn';close.textContent='Terminé';close.onclick=()=>dialog.close();dialog.append(title,list,close);document.body.append(dialog);
  function render(){list.replaceChildren();const ids=getIds();ids.forEach((id,index)=>{
    const row=document.createElement('div');row.className='saved-entry';const name=catalog.find(tool=>tool.id===id).name,label=document.createElement('span');label.textContent=`${index+1}. ${name}`;row.append(label);
    for(const [delta,text] of [[-1,'Monter'],[1,'Descendre']]){const button=document.createElement('button');button.className='secondary-btn';button.textContent=text;button.setAttribute('aria-label',`${text} ${name}`);button.disabled=index+delta<0||index+delta>=ids.length;button.onclick=()=>{onChange(moveFavourite(ids,id,delta));render();};row.append(button);}list.append(row);
  });}
  return {open(){render();dialog.showModal();}};
}
