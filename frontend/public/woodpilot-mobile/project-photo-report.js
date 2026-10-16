import {validatePhoto} from './photo-model.js';
import {recalculatePhotoLines,PHOTO_WARNING} from './photo-calibration.js';
import {loadImage} from './export-result.js';
export async function projectPhotoReport(data){
 validatePhoto(data);const image=await loadImage(data.image);
 if(image.width*image.height>32000000)throw new Error('Photo supérieure à 32 mégapixels.');
 const ratio=Math.min(1,1800/Math.max(image.width,image.height)),canvas=document.createElement('canvas');canvas.width=Math.round(image.width*ratio);canvas.height=Math.round(image.height*ratio);
 const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0,canvas.width,canvas.height);const scale=Math.max(canvas.width,canvas.height)/700;
 const lines=recalculatePhotoLines(structuredClone(data.lines),image.width,image.height);
 function label(text,x,y){ctx.font=`bold ${20*scale}px sans-serif`;const width=Math.min(canvas.width-12*scale,ctx.measureText(text).width);x=Math.max(6*scale,Math.min(canvas.width-width-6*scale,x));y=Math.max(25*scale,Math.min(canvas.height-8*scale,y));ctx.save();ctx.globalAlpha=.72;ctx.fillStyle='#fff';ctx.beginPath();ctx.roundRect(x-3*scale,y-22*scale,width+6*scale,29*scale,7*scale);ctx.fill();ctx.restore();ctx.fillStyle='#171919';ctx.fillText(text,x,y,width);}
 for(const [index,line] of lines.entries()){const x=line.a.x*canvas.width,y=line.a.y*canvas.height,x2=line.b.x*canvas.width,y2=line.b.y*canvas.height;ctx.strokeStyle='#DC2E2E';ctx.lineWidth=3*scale;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.stroke();label(`${index+1} · ${line.unreliable?'À recalibrer':Math.round(line.value)+' mm'}`,(x+x2)/2,(y+y2)/2-8*scale);for(const [px,py] of [[x,y],[x2,y2]]){ctx.beginPath();ctx.arc(px,py,5*scale,0,2*Math.PI);ctx.fillStyle='#DC2E2E';ctx.fill();}}
 for(const note of data.annotations||[])label(note.text,note.point.x*canvas.width,note.point.y*canvas.height);
 const c=data.calibration,source=c?.type==='aruco'?`ArUco ID ${c.id} · repère ${c.size} mm · plan du repère uniquement`:c?'Distance connue · sans correction de perspective':'Saisie manuelle';
 return {canvas,text:`Photo Métré\n${source}\n${PHOTO_WARNING}\n${lines.map((l,i)=>`Cote ${i+1} : ${l.unreliable?'À recalibrer':Math.round(l.value)+' mm'} (${l.source==='aruco'?'ArUco':l.source?'distance connue':'manuelle'})`).join('\n')}\nAnnotations\n${(data.annotations||[]).map(a=>a.text).join('\n')||'Aucune'}\nNotes de la photo\n${data.notes||'Aucune'}`};
}
