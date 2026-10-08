import { generateCabinet } from './manufacturing.js';
import { editMeasurement } from './measurement-input.js';
import { formatMeasure } from './cintrage.js';
export function createCabinetTool({haptic,transfer,notify}) {
  let data={width:800,height:720,depth:560,thickness:19,shelves:1,backThickness:6};
  const root=document.querySelector('#cabinetTool'),labels={width:'Largeur',height:'Hauteur',depth:'Profondeur hors tout',thickness:'Épaisseur panneaux',shelves:'Tablettes',backThickness:'Épaisseur fond'};
  function render() {
    const pieces=generateCabinet(data);
    for(const key of Object.keys(data))root.querySelector(`[data-value="${key}"]`).textContent=`${formatMeasure(data[key])}${key==='shelves'?'':' mm'}`;
    root.querySelector('[data-part-count]').textContent=`${pieces.reduce((sum,p)=>sum+p.quantity,0)} pièces`;
    const list=root.querySelector('[data-parts]');list.replaceChildren();
    pieces.forEach(p=>{const row=document.createElement('li');row.textContent=`${p.quantity} × ${p.name} · ${p.lengthMm} × ${p.widthMm} × ${p.thicknessMm} mm`;list.append(row);});
    const scale=Math.min(220/data.width,160/data.height),x=60,y=20,w=data.width*scale,h=data.height*scale,t=data.thickness*scale;
    let shape=`M${x} ${y}h${w}v${h}h${-w}Z M${x+t} ${y+t}h${w-2*t}v${h-2*t}h${2*t-w}Z`;
    for(let i=1;i<=data.shelves;i++){const shelfY=y+t+(h-2*t)*i/(data.shelves+1);shape+=` M${x+t} ${shelfY}H${x+w-t}`;}
    root.querySelector('[data-cabinet-shape]').setAttribute('d',shape);
  }
  root.querySelectorAll('[data-measurement]').forEach(button=>button.onclick=()=>{
    const key=button.dataset.measurement;
    editMeasurement({label:labels[key],value:data[key],unit:key==='shelves'?'':'mm',integer:key==='shelves',min:key==='shelves'?0:.001,max:key==='shelves'?20:100000,trigger:button,onConfirm(value){const next={...data,[key]:value};generateCabinet(next);data=next;render();haptic();}});
  });
  root.querySelector('[data-to-cutlist]').onclick=()=>{try{transfer(generateCabinet(data));}catch(error){notify(error.message);}};
  render();
  return {root,open(){root.showModal();},applyDimensions(dimensions){const next={...data,...dimensions};generateCabinet(next);data=next;render();},snapshot(){return {...data};},load(next){generateCabinet(next);data=next;render();},text(){return `WoodPilot — Caisson\nLargeur ${data.width} mm · hauteur ${data.height} mm · profondeur ${data.depth} mm\nDessus et dessous entre côtés. Fond rapporté inclus dans la profondeur hors tout.\nSans façades, jeux de montage ni compensation de chants.\n${generateCabinet(data).map(p=>`${p.quantity} × ${p.name} : ${p.lengthMm} × ${p.widthMm} × ${p.thicknessMm} mm`).join('\n')}`;}};
}
