import { calculateAretiers,aretiersText,templateSvg } from './aretiers.js';
import { editMeasurement } from './measurement-input.js';
import { formatMeasure } from './cintrage.js';
import { downloadBlob } from './export-result.js';
export function createAretiersTool({haptic,notify}) {
  let data={n:6,R:300,H:400,dx:0,dy:0,zCut:0,zCut2:0},selected=0;
  const root=document.querySelector('#aretiersTool');
  const labels={n:'Nombre de faces',R:'Rayon de base',H:'Hauteur du sommet',dx:'Désaxage X',dy:'Désaxage Y',zCut:'Tronquage 1',zCut2:'Tronquage 2'};
  function render() {
    const model=calculateAretiers(data);selected=Math.min(selected,data.n-1);
    for(const key of Object.keys(labels))root.querySelector(`[data-value="${key}"]`).textContent=`${formatMeasure(data[key])}${key==='n'?'':' mm'}`;
    const select=root.querySelector('[data-edge-select]');select.replaceChildren();
    model.items.forEach(item=>{const option=document.createElement('option');option.value=String(item.index);option.textContent=`Arêtier ${item.index+1}`;select.append(option);});select.value=String(selected);
    const item=model.items[selected];root.querySelector('[data-edge-length]').textContent=`${formatMeasure(item.cutLength)} mm`;
    root.querySelector('[data-tool-angle]').textContent=`${formatMeasure(item.bevelTool)}°`;
    root.querySelector('[data-bevel]').textContent=`${formatMeasure(item.bevelFace)}°`;
    root.querySelector('[data-delta]').textContent=`${formatMeasure(item.delta)}°`;
    root.querySelector('[data-base-edge]').textContent=`${formatMeasure(model.baseEdge)} mm`;
    const project=([x,y,z])=>[x-y,(x+y)*.35-z];
    const top=model.sections.at(-1)?.points;
    const segments=[];
    model.base.forEach((point,i)=>{segments.push({a:point,b:model.base[(i+1)%data.n],active:false});segments.push({a:point,b:top?top[i]:model.apex,active:i===selected});});
    model.sections.forEach(section=>section.points.forEach((point,i)=>segments.push({a:point,b:section.points[(i+1)%data.n],active:false})));
    const coords=segments.flatMap(segment=>[project(segment.a),project(segment.b)]),xs=coords.map(p=>p[0]),ys=coords.map(p=>p[1]);
    const minX=Math.min(...xs),minY=Math.min(...ys),scale=Math.min(270/(Math.max(...xs)-minX||1),165/(Math.max(...ys)-minY||1));
    const group=root.querySelector('[data-pyramid]');group.replaceChildren();
    segments.forEach(segment=>{const a=project(segment.a),b=project(segment.b),line=document.createElementNS('http://www.w3.org/2000/svg','line');
      line.setAttribute('x1',String(35+(a[0]-minX)*scale));line.setAttribute('y1',String(20+(a[1]-minY)*scale));line.setAttribute('x2',String(35+(b[0]-minX)*scale));line.setAttribute('y2',String(20+(b[1]-minY)*scale));line.setAttribute('class',segment.active?'arc':'construction');group.append(line);
    });
  }
  root.querySelectorAll('[data-measurement]').forEach(button=>button.onclick=()=>{
    const key=button.dataset.measurement,isOffset=key==='dx'||key==='dy';
    editMeasurement({label:labels[key],value:data[key],unit:key==='n'?'':'mm',integer:key==='n',min:key==='n'?3:isOffset?-1000000:key.startsWith('zCut')?0:.001,max:key==='n'?24:1000000,trigger:button,onConfirm(value){const next={...data,[key]:value};calculateAretiers(next);data=next;render();haptic();}});
  });
  root.querySelector('[data-edge-select]').onchange=event=>{selected=Number(event.target.value);render();};
  root.querySelector('[data-template]').onclick=()=>{
    try{downloadBlob(new Blob([templateSvg(data,selected)],{type:'image/svg+xml'}),`woodpilot-face-${selected+1}.svg`);notify('Gabarit SVG téléchargé, dimensions en mm.');}catch(error){notify(error.message);}
  };
  render();
  return {root,open(){root.showModal();},snapshot(){return {...data};},load(next){calculateAretiers(next);data=next;render();},text(){return aretiersText(data);}};
}
