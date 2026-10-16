import {projectReportSections,projectRalSwatch} from './project-report-model.js';
import {projectPhotoReport} from './project-photo-report.js';
import {calculateNesting} from './manufacturing.js';
import {drawNestingPanel} from './nesting-plan.js';
import {calculateStairLayout} from './stairs-layout.js';
import {drawStairPlan} from './stairs-plan.js';
import {reportPages,canvasBlob,jpegPagesPdf,textLines} from './export-result.js';
export async function createProjectPdf(project,{onProgress=()=>{},date=new Date()}={}){
 await document.fonts?.ready;
 const report=projectReportSections(project,date),pages=[],host=document.createElement('div');host.className='nesting-panel';host.style.cssText='position:fixed;left:-100000px;width:1000px;pointer-events:none';document.body.append(host);let bytes=0;
 async function add(canvas){if(pages.length>=300)throw new Error('Limite de 300 pages atteinte. Scindez ce projet pour l’exporter.');const copy=document.createElement('canvas');copy.width=1200;const scale=1200/canvas.width;copy.height=Math.ceil(canvas.height*scale)+60;const ctx=copy.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,copy.width,copy.height);ctx.drawImage(canvas,0,0,1200,canvas.height*scale);ctx.fillStyle='#555';ctx.font='18px sans-serif';ctx.fillText(`${project.name} · page ${pages.length+1}`,40,copy.height-22,1120);const jpeg=new Uint8Array(await (await canvasBlob(copy,'image/jpeg')).arrayBuffer());bytes+=jpeg.length;if(bytes>100000000)throw new Error('PDF supérieur à 100 Mo : scindez le projet.');pages.push({jpeg,width:copy.width,height:copy.height});}
 async function text(value,svg=null){if(svg)host.replaceChildren(svg);try{for(const page of await reportPages(value,svg,true))await add(page);}finally{host.replaceChildren();}}
 async function illustrated(value,image,imageHeight=580){
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');ctx.font='24px Inter, sans-serif';const lines=textLines(ctx,value,1120),title=lines.shift(),chunk=lines.splice(0,20);canvas.width=1200;canvas.height=imageHeight+170+chunk.length*36;ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#171919';ctx.font='bold 32px Inter, sans-serif';ctx.fillText(title,40,55,1120);const scale=Math.min(1000/image.width,imageHeight/image.height);ctx.drawImage(image,(1200-image.width*scale)/2,90,image.width*scale,image.height*scale);ctx.font='24px Inter, sans-serif';chunk.forEach((line,i)=>ctx.fillText(line,40,imageHeight+140+i*36));await add(canvas);if(lines.length)await text(title+' (suite)\n'+lines.join('\n'));
 }
 try{
  await text(report.cover);
  for(const [index,entry] of report.entries.entries()){
   onProgress(`Préparation ${index+1} / ${report.entries.length} · ${entry.title}`);
   if(entry.toolId==='photo'){const photo=await projectPhotoReport(entry.data);await illustrated(entry.heading+'\n'+photo.text,photo.canvas);}
   else{const hex=entry.toolId==='ral'?projectRalSwatch(entry.data):null;if(hex){const c=document.createElement('canvas');c.width=600;c.height=260;const ctx=c.getContext('2d');ctx.fillStyle=hex;ctx.fillRect(0,0,600,260);await illustrated(entry.heading+'\n'+entry.text,c,260);}else await text(entry.heading+'\n'+entry.text);}
   if(entry.toolId==='cutlist')for(const group of calculateNesting(entry.data))for(const [i,panel] of group.result.panels.entries())await text(`${entry.heading}\nPanneau ${i+1} · ${group.thickness} mm\nHachures : chutes · pointillés rouges : chants plaqués`,drawNestingPanel(entry.data.panel,panel,`Panneau ${i+1}`));
   if(entry.toolId==='stairs'){const result=calculateStairLayout(entry.data);for(const [view,title] of [['top','Vue de dessus'],['side','Vue de côté']])await text(entry.heading+'\n'+title,drawStairPlan(result,view));}
  }
  return jpegPagesPdf(pages);
 }finally{host.remove();}
}
