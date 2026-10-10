import { calibrationUI } from './photo-calibrated-ui.js';
import { photoViewport } from './photo-viewport.js';
import { PHOTO_WARNING, calibratedDistance } from './photo-calibration.js';
import { closestSegment } from './edge-detection.js';
import { editText } from './text-input.js';
import { choosePhotoDimensions } from './photo-transfer.js';
import { editMeasurement } from './measurement-input.js';
import { loadImage } from './export-result.js';
import { normalizedPoint,validatePhoto } from './photo-model.js';
import { formatMeasure } from './cintrage.js';
export function createPhotoTool({notify,haptic,transfer}) {
  const root=document.querySelector('#photoTool'),canvas=root.querySelector('canvas');
  let image=null,imageData='',lines=[],pending=null,dragStart=null,selectedSegment=null,annotations=[],notes='',segments=[],annotationMode=false,generation=0;
  let moving=null;
  const viewport=photoViewport(canvas,()=>{dragStart=null;moving=null;});
  const calibrated=calibrationUI(root,{getImage:()=>image,render,notify,clearPending(){pending=null;moving=null;selectedSegment=null;}});
  let worker;try{worker=new Worker(new URL('./edge-worker.js',import.meta.url),{type:'module'});}catch{}
  if(worker)worker.onerror=()=>{worker.terminate();worker=null;segments=[];detection.textContent='Détection indisponible ; tracé manuel disponible.';render();};
  const detection=root.querySelector('[data-detection-status]');
  function detect(){if(!image)return;const id=++generation;segments=[];const small=document.createElement('canvas'),ratio=Math.min(1,360/Math.max(image.width,image.height));small.width=Math.max(3,Math.round(image.width*ratio));small.height=Math.max(3,Math.round(image.height*ratio));const ctx=small.getContext('2d');ctx.drawImage(image,0,0,small.width,small.height);detection.textContent='Recherche des arêtes…';if(!worker){detection.textContent='Détection indisponible ; tracez les cotes manuellement.';return;}const pixels=ctx.getImageData(0,0,small.width,small.height);worker.postMessage({id,image:{width:small.width,height:small.height,data:pixels.data}},[pixels.data.buffer]);}
  if(worker)worker.onmessage=event=>{if(event.data.id!==generation)return;segments=event.data.segments||[];detection.textContent=event.data.error?'Détection indisponible ; tracé manuel disponible.':`${segments.length} arête(s) proposées. Touchez une arête pour la coter.`;render();};
  const error=root.querySelector('[role="alert"]');
  function render() {
    if(!image)return;
    canvas.width=image.width;canvas.height=image.height;
    const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);
    const styles=getComputedStyle(document.documentElement),color=styles.getPropertyValue('--color-measurement').trim();
    const scale=Math.max(canvas.width,canvas.height)/700;
    ctx.strokeStyle=color;ctx.lineWidth=3*scale;ctx.font=`bold ${24*scale}px Inter, sans-serif`;
    function segment(a,b,value) {
      const x1=a.x*canvas.width,y1=a.y*canvas.height,x2=b.x*canvas.width,y2=b.y*canvas.height;
      ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
      for(const [x,y] of [[x1,y1],[x2,y2]]){ctx.beginPath();ctx.arc(x,y,5*scale,0,2*Math.PI);ctx.fillStyle=color;ctx.fill();}
      if(value!==undefined){const text=`${formatMeasure(value)} mm`,w=ctx.measureText(text).width;
        const x=Math.max(w/2+8*scale,Math.min(canvas.width-w/2-8*scale,(x1+x2)/2));
        const y=Math.max(30*scale,Math.min(canvas.height-8*scale,(y1+y2)/2-10*scale));
        ctx.fillStyle=styles.getPropertyValue('--color-background').trim();ctx.fillRect(x-w/2-6*scale,y-24*scale,w+12*scale,32*scale);
        ctx.fillStyle=styles.getPropertyValue('--color-text').trim();ctx.textAlign='center';ctx.fillText(text,x,y);
      }
    }
    if(root.querySelector('[data-show-edges]').checked){ctx.save();ctx.strokeStyle=styles.getPropertyValue('--color-construction-line').trim();ctx.lineWidth=2*scale;ctx.setLineDash([5*scale,4*scale]);segments.forEach(line=>{ctx.beginPath();ctx.moveTo(line.a.x*canvas.width,line.a.y*canvas.height);ctx.lineTo(line.b.x*canvas.width,line.b.y*canvas.height);ctx.stroke();});ctx.restore();}
    if(selectedSegment)segment(selectedSegment.a,selectedSegment.b);
    lines.forEach(line=>segment(line.a,line.b,line.value));
    const outline=calibrated.outline;
    if(outline?.type==='aruco'){ctx.save();ctx.strokeStyle=color;ctx.lineWidth=4*scale;ctx.beginPath();outline.corners.forEach((p,i)=>{const x=p.x*canvas.width,y=p.y*canvas.height;if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);ctx.fillStyle=color;ctx.fillRect(x-5*scale,y-5*scale,10*scale,10*scale);});ctx.closePath();ctx.stroke();ctx.restore();}
    if(selectedSegment){for(const [label,p] of [['A',selectedSegment.a],['B',selectedSegment.b]]){ctx.fillStyle=color;ctx.textAlign='left';ctx.fillText(label,p.x*canvas.width+8*scale,p.y*canvas.height-8*scale);}}
    annotations.forEach(note=>{ctx.textAlign='left';ctx.font=`bold ${20*scale}px Inter, sans-serif`;const text=note.text,w=Math.min(canvas.width-16*scale,ctx.measureText(text).width),x=Math.max(8*scale,Math.min(canvas.width-w-8*scale,note.point.x*canvas.width)),y=Math.max(24*scale,Math.min(canvas.height-8*scale,note.point.y*canvas.height));ctx.fillStyle=styles.getPropertyValue('--color-background').trim();ctx.fillRect(x-4*scale,y-21*scale,w+8*scale,28*scale);ctx.fillStyle=styles.getPropertyValue('--color-text').trim();ctx.fillText(text,x,y,w);});
    const annotationList=root.querySelector('[data-annotations]');annotationList.replaceChildren();annotations.forEach((note,index)=>{const button=document.createElement('button');button.className='secondary-btn';button.textContent=`Annotation ${index+1} : ${note.text}`;button.onclick=()=>editText({title:'Modifier l’annotation (vide pour retirer)',value:note.text,maxLength:120,onConfirm(text){if(text)note.text=text;else annotations.splice(index,1);render();}});annotationList.append(button);});
    if(pending){ctx.setLineDash([6*scale,4*scale]);segment(pending,pending);ctx.setLineDash([]);}
    const list=root.querySelector('[data-photo-lines]');list.replaceChildren();
    lines.forEach((line,index)=>{
      const row=document.createElement('div');row.className='photo-line-row';
      const edit=document.createElement('button');edit.className='secondary-btn';edit.textContent=`Cote ${index+1} · ${formatMeasure(line.value)} mm`;
      edit.onclick=()=>{if(line.source){selectedSegment=line;render();notify('Déplacez A ou B sur la photo pour ajuster cette cote.');return;}editMeasurement({label:`Cote ${index+1}`,value:line.value,trigger:edit,onConfirm(value){line.value=value;render();}});};
      const remove=document.createElement('button');remove.className='icon-btn';remove.setAttribute('aria-label',`Supprimer la cote ${index+1}`);remove.innerHTML='<span class="material-symbols-rounded" aria-hidden="true">delete</span>';
      remove.onclick=()=>{if(selectedSegment===line)selectedSegment=null;lines.splice(index,1);render();};row.append(edit,remove);list.append(row);
    });
    root.querySelectorAll('[data-save],[data-share],[data-undo]').forEach(button=>button.disabled=false);
    root.querySelector('[data-undo]').disabled=!lines.length&&!pending;
  }
  async function importFile(file) {
    if(!file)return;
    if(!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size>25000000){error.textContent='Choisissez une image de moins de 25 Mo.';return;}
    const url=URL.createObjectURL(file);
    try {
      const next=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});
      const nextImage=await loadImage(next);
      if(nextImage.width*nextImage.height>32000000)throw new Error('Image trop grande');
      imageData=next;image=nextImage;lines=[];annotations=[];notes='';root.querySelector('[data-photo-notes]').value='';pending=null;error.textContent='';canvas.hidden=false;viewport.reset();calibrated.reset();render();detect();haptic();
    }catch(reason){error.textContent='Image non lisible ou supérieure à 32 mégapixels. Essayez une photo JPEG, PNG ou WebP de résolution inférieure.';}finally{URL.revokeObjectURL(url);}
  }
  root.querySelectorAll('input[type="file"]').forEach(input=>input.onchange=async()=>{
    if(image && !confirm('Remplacer cette photo et ses cotes ? Enregistrez-la dans un projet pour la conserver.')){input.value='';return;}
    await importFile(input.files[0]);input.value='';
  });
  function point(event){const rect=canvas.getBoundingClientRect();return normalizedPoint(event.clientX-rect.left,event.clientY-rect.top,rect.width,rect.height);}
  function finish(a,b) {
    if(Math.hypot((a.x-b.x)*image.width,(a.y-b.y)*image.height)<1){pending=b;render();return;}
    if(lines.length>=100){notify('Maximum : 100 cotes par photo.');return;}
    pending=null;selectedSegment={a,b};
    if(calibrated.mode==='calibrated'){try{const value=calibrated.distance(a,b);const line={a,b,value,source:calibrated.calibration.type,calibration:structuredClone(calibrated.calibration)};lines.push(line);selectedSegment=line;render();haptic();}catch(reason){notify(reason.message);selectedSegment=null;render();}return;}
    editMeasurement({label:'Dimension mesurée',value:1000,trigger:canvas,onConfirm(value){lines.push({a,b,value});render();haptic();}});
    document.querySelector('#measurementSheet').addEventListener('close',()=>{selectedSegment=null;render();},{once:true});
    render();
  }
  root.querySelector('[data-detect]').onclick=detect;root.querySelector('[data-show-edges]').onchange=render;
  root.querySelector('[data-photo-notes]').oninput=event=>notes=event.target.value;
  root.querySelector('[data-annotate]').onclick=()=>{if(!image){notify('Importez une photo.');return;}annotationMode=true;notify('Touchez la position de l’annotation.');};
  root.querySelector('[data-to-cabinet]').onclick=()=>{try{choosePhotoDimensions(lines,transfer);}catch(reason){notify(reason.message);}};
  canvas.onpointerdown=event=>{if(!image)return;dragStart=point(event);moving=null;
    if(selectedSegment?.source){const rect=canvas.getBoundingClientRect();for(const key of ['a','b'])if(Math.hypot((selectedSegment[key].x-dragStart.x)*rect.width,(selectedSegment[key].y-dragStart.y)*rect.height)<24)moving={line:selectedSegment,key,previous:{...selectedSegment[key]}};}
    canvas.setPointerCapture(event.pointerId);};
  canvas.onpointermove=event=>{if(!moving)return;const p=point(event);try{const value=calibratedDistanceForLine(moving.line,moving.key,p);moving.line[moving.key]=p;moving.line.value=value;render();}catch{}};
  function calibratedDistanceForLine(line,key,p){return calibratedDistance(line.calibration,key==='a'?p:line.a,key==='b'?p:line.b,image.width,image.height);}
  canvas.onpointerup=event=>{
    if(moving){moving=null;dragStart=null;return;}
    if(!dragStart)return;const end=point(event),start=dragStart;dragStart=null;const rect=canvas.getBoundingClientRect(),dragDistance=Math.hypot((start.x-end.x)*rect.width,(start.y-end.y)*rect.height);
    if(calibrated.mode==='calibrated'&&calibrated.referencePoint(end))return;
    if(annotationMode){annotationMode=false;if(annotations.length>=30){notify('Maximum : 30 annotations.');return;}editText({title:'Annotation',maxLength:120,onConfirm(text){if(text){annotations.push({point:end,text});render();}}});return;}
    if(calibrated.mode==='manual'&&!pending&&dragDistance<=4&&root.querySelector('[data-show-edges]').checked){const rect=canvas.getBoundingClientRect(),edge=closestSegment(end,segments,rect.width,rect.height);if(edge){finish(edge.a,edge.b);return;}}
    if(dragDistance>4){finish(start,end);return;}
    if(pending)finish(pending,end);else{pending=end;render();notify('Touchez le second point de la cote.');}
  };
  canvas.onpointercancel=()=>{dragStart=null;moving=null;};
  canvas.onkeydown=event=>{if(event.key==='Escape'){pending=null;selectedSegment=null;render();}};
  root.querySelector('[data-undo]').onclick=()=>{if(pending)pending=null;else{const line=lines.pop();if(selectedSegment===line)selectedSegment=null;}render();};
  return {root,open(){root.showModal();},snapshot(){if(!imageData)throw new Error('Importez une photo avant de l’enregistrer.');return {image:imageData,lines:structuredClone(lines),annotations:structuredClone(annotations),notes,calibration:calibrated.calibration,mode:calibrated.mode};},
    async load(data){validatePhoto(data);const next=await loadImage(data.image);imageData=data.image;image=next;lines=structuredClone(data.lines);annotations=structuredClone(data.annotations||[]);notes=data.notes||'';root.querySelector('[data-photo-notes]').value=notes;pending=null;canvas.hidden=false;viewport.reset();calibrated.load(data.calibration,data.mode);for(const line of lines)if(line.source)line.value=calibratedDistance(line.calibration,line.a,line.b,image.width,image.height);render();detect();},
    text(){return `WoodPilot — Photo Métré\n${calibrated.provenance()}\n${PHOTO_WARNING}\n${lines.map((line,i)=>`Cote ${i+1} : ${formatMeasure(line.value)} mm (${line.source==='aruco'?'ArUco, coplanaire':line.source?'distance connue, approximative':'saisie manuelle'})`).join('\n')}\n${annotations.map(note=>note.text).join('\n')}\n${notes}`;},
    async canvases(){const pages=[await this.canvas()];{const {reportPages}=await import('./export-result.js');pages.push(...await reportPages(this.text()));}return pages;},
    async canvas(){if(!image)throw new Error('Importez une photo.');const checkbox=root.querySelector('[data-show-edges]'),show=checkbox.checked,previousPending=pending,previousSelection=selectedSegment;checkbox.checked=false;pending=null;selectedSegment=null;render();const out=document.createElement('canvas');out.width=canvas.width;out.height=canvas.height+Math.max(150,canvas.width*.12);
      const ctx=out.getContext('2d');ctx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--color-background');ctx.fillRect(0,0,out.width,out.height);ctx.drawImage(canvas,0,0);checkbox.checked=show;pending=previousPending;selectedSegment=previousSelection;render();
      ctx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--color-text');ctx.font=`${Math.max(16,canvas.width/65)}px Inter, sans-serif`;ctx.fillText('WoodPilot — Photo Métré · '+calibrated.provenance(),16,canvas.height+40,out.width-32);ctx.fillText(PHOTO_WARNING,16,canvas.height+80,out.width-32);return out;}
  };
}
