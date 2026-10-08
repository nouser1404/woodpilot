import { calculateSpacing, spacingText } from './calculators.js';
import { formatMeasure } from './cintrage.js';
import { editMeasurement } from './measurement-input.js';
import { createWheelPicker } from './wheel-picker.js';
export function createSpacingTool({haptic}) {
  let data={length:1000,width:40,count:5,endGaps:true};
  const root=document.querySelector('#spacingTool');
  const error=root.querySelector('[role="alert"]');
  function update(next) {calculateSpacing(next.length,next.width,next.count,next.endGaps);data=next;render();}
  function render() {
    const result=calculateSpacing(data.length,data.width,data.count,data.endGaps);
    for (const key of ['length','width','count']) root.querySelector(`[data-value="${key}"]`).textContent=`${formatMeasure(data[key])}${key==='count'?'':' mm'}`;
    root.querySelector('[data-gap]').textContent=`${formatMeasure(result.gap)} mm`;
    root.querySelector('[data-pitch]').textContent=`${formatMeasure(result.pitch)} mm`;
    root.querySelector('[data-end-gaps]').checked=data.endGaps;
    const group=root.querySelector('[data-slats]');group.replaceChildren();
    for (const center of result.positions) {
      const rect=document.createElementNS('http://www.w3.org/2000/svg','rect');
      rect.setAttribute('x',String(30+(center-data.width/2)/data.length*280));rect.setAttribute('y','65');
      rect.setAttribute('width',String(data.width/data.length*280));rect.setAttribute('height','85');rect.setAttribute('class','slat');group.append(rect);
    }
    const axes=root.querySelector('[data-axes]');axes.replaceChildren();
    result.positions.forEach((position,i)=>{const li=document.createElement('li');li.textContent=`Axe ${i+1} : ${formatMeasure(position)} mm`;axes.append(li);});
    error.textContent='';
  }
  root.querySelectorAll('[data-measurement]').forEach(button=>button.onclick=()=>{
    const key=button.dataset.measurement;
    editMeasurement({label:{length:'Longueur disponible',width:'Largeur d’un élément',count:'Nombre d’éléments'}[key],value:data[key],unit:key==='count'?'':'mm',integer:key==='count',min:key==='count'?2:Number.MIN_VALUE,max:key==='count'?100:1000000,trigger:button,onConfirm(value){update({...data,[key]:value});picker.set(data.count);haptic();}});
  });
  root.querySelector('[data-end-gaps]').onchange=event=>{try{update({...data,endGaps:event.target.checked});}catch(reason){event.target.checked=data.endGaps;error.textContent=reason.message;}};
  const picker=createWheelPicker(root.querySelector('[data-count-picker]'),{values:Array.from({length:99},(_,i)=>i+2),value:data.count,haptic,onChange(value){update({...data,count:value});}});
  root.querySelector('[data-count-picker]').addEventListener('pickererror',event=>error.textContent=event.detail);
  render();
  return {root,open(){root.showModal();picker.set(data.count);},snapshot(){return {...data};},load(next){update(next);picker.set(data.count);},text(){return spacingText(data.length,data.width,data.count,data.endGaps);}};
}
