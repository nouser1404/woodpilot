/** PDF avec une image JPEG par page, sans dépendance ou serveur. */
export function jpegPagesPdf(pages) {
  if (!Array.isArray(pages) || !pages.length) throw new Error('Aucune page à exporter.');
  const encoder=new TextEncoder(),parts=[],offsets=[0];let length=0;
  const append=value=>{const bytes=typeof value==='string'?encoder.encode(value):value;parts.push(bytes);length+=bytes.length;};
  const object=(id,content)=>{offsets[id]=length;append(`${id} 0 obj\n${content}\nendobj\n`);};
  append('%PDF-1.4\n');object(1,'<< /Type /Catalog /Pages 2 0 R >>');
  object(2,`<< /Type /Pages /Kids [${pages.map((_,i)=>`${3+i*3} 0 R`).join(' ')}] /Count ${pages.length} >>`);
  pages.forEach(({jpeg,width,height},i)=>{
    const id=3+i*3,scale=Math.min(555/width,802/height),w=width*scale,h=height*scale;
    object(id,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im0 ${id+1} 0 R >> >> /Contents ${id+2} 0 R >>`);
    offsets[id+1]=length;append(`${id+1} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);append(jpeg);append('\nendstream\nendobj\n');
    const stream=`q ${w} 0 0 ${h} 20 ${842-h-20} cm /Im0 Do Q`;
    object(id+2,`<< /Length ${encoder.encode(stream).length} >>\nstream\n${stream}\nendstream`);
  });
  const xref=length,count=3+pages.length*3;append(`xref\n0 ${count}\n0000000000 65535 f \n`);
  for(let i=1;i<count;i++)append(`${String(offsets[i]).padStart(10,'0')} 00000 n \n`);
  append(`trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);return new Blob(parts,{type:'application/pdf'});
}
export function jpegPdf(jpeg,width,height) {return jpegPagesPdf([{jpeg,width,height}]);}
let lastDownload;
export function downloadBlob(blob,name) {
  lastDownload?.remove();
  const link=document.createElement('a');link.download=name;link.hidden=true;
  link.textContent='Télécharger le fichier';link.className='secondary-btn';link.setAttribute('data-export-download','');
  const dialogs=[...document.querySelectorAll('dialog[open]')];(dialogs.at(-1)||document.querySelector('.app')).append(link);
  lastDownload=link;
  // Un lien explicite reste disponible lorsque le navigateur bloque le téléchargement automatique.
  const reader=new FileReader();reader.onload=()=>{link.href=reader.result;link.hidden=false;link.click();};reader.readAsDataURL(blob);
}
export async function shareFile(blob,name,title,notify) {
  const file=new File([blob],name,{type:blob.type});
  if(navigator.canShare?.({files:[file]})) {
    try { await navigator.share({files:[file],title});return; }
    catch(error){if(error.name==='AbortError')return;}
  }
  downloadBlob(blob,name);notify('Fichier téléchargé.');
}
export function loadImage(src) {
  return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('Impossible de lire cette image.'));image.src=src;});
}
export function canvasBlob(canvas,type='image/png') {
  return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Export impossible.')),type,.92));
}
export async function canvasPdf(canvas) {
  const jpeg=new Uint8Array(await (await canvasBlob(canvas,'image/jpeg')).arrayBuffer());
  return jpegPdf(jpeg,canvas.width,canvas.height);
}
export async function svgImage(svg) {
  const clone=svg.cloneNode(true),originals=[svg,...svg.querySelectorAll('*')],clones=[clone,...clone.querySelectorAll('*')];
  originals.forEach((node,i)=>{const style=getComputedStyle(node);for(const key of ['fill','stroke','stroke-width','stroke-dasharray','font-family','font-size','text-anchor','dominant-baseline'])clones[i].style.setProperty(key,style.getPropertyValue(key));});
  clone.setAttribute('xmlns','http://www.w3.org/2000/svg');clone.setAttribute('width','1000');clone.setAttribute('height','600');
  const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)],{type:'image/svg+xml'}));
  try {return await loadImage(url);}finally{URL.revokeObjectURL(url);}
}
export function textLines(ctx,text,width) {
  return text.split('\n').flatMap(line=>{
    const out=[];let current='';
    for(const word of line.split(' ')){const next=current?current+' '+word:word;if(current&&ctx.measureText(next).width>width){out.push(current);current=word;}else current=next;}
    out.push(current);return out;
  });
}
export async function reportCanvas(text,svg=null) {
  const canvas=document.createElement('canvas');canvas.width=1200;
  const ctx=canvas.getContext('2d');ctx.font='24px Inter, sans-serif';const lines=textLines(ctx,text,1120);
  const image=svg?await svgImage(svg):null;
  canvas.height=(image?700:120)+lines.length*36;
  const styles=getComputedStyle(document.documentElement);ctx.fillStyle=styles.getPropertyValue('--color-surface').trim();ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle=styles.getPropertyValue('--color-text').trim();ctx.font='bold 32px Inter, sans-serif';ctx.fillText(lines[0],40,55);
  if(image)ctx.drawImage(image,100,80,1000,600);
  ctx.font='24px Inter, sans-serif';lines.slice(1).forEach((line,i)=>ctx.fillText(line,40,(image?730:100)+i*36));
  return canvas;
}
export const calculatorCanvas=tool=>reportCanvas(tool.text(),tool.root.querySelector('.technical-diagram svg'));
export async function reportPages(text,svg=null) {
  const ctx=document.createElement('canvas').getContext('2d');ctx.font='24px Inter, sans-serif';
  const lines=textLines(ctx,text,1120),title=lines.shift(),pages=[];let first=true;
  while(lines.length){const chunk=lines.splice(0,first&&svg?20:28);pages.push(await reportCanvas([title,...chunk].join('\n'),first?svg:null));first=false;}
  return pages.length?pages:[await reportCanvas(title,svg)];
}
export async function canvasesPdf(canvases) {
  const pages=[];
  for(const canvas of canvases){const jpeg=new Uint8Array(await (await canvasBlob(canvas,'image/jpeg')).arrayBuffer());pages.push({jpeg,width:canvas.width,height:canvas.height});}
  return jpegPagesPdf(pages);
}
export function bindResultActions(tool,{save,share,notify}) {
  tool.root.querySelector('[data-save]').onclick=()=>save(tool);
  tool.root.querySelector('[data-share]').onclick=()=>{
    const sheet=document.querySelector('#exportSheet');
    sheet.querySelector('[data-format="text"]').hidden=tool.id==='photo';
    sheet.querySelectorAll('[data-format]').forEach(button=>button.onclick=async()=>{
      try {
        const format=button.dataset.format,download=button.dataset.download==='true';
        if(format==='text'){sheet.close();await share({title:tool.title,text:tool.text()});return;}
        button.disabled=true;
        const canvas=tool.canvas?await tool.canvas():await calculatorCanvas(tool);
        const blob=format==='pdf'?(tool.canvases?await canvasesPdf(await tool.canvases()):tool.canvas?await canvasPdf(canvas):await canvasesPdf(await reportPages(tool.text(),tool.root.querySelector('.technical-diagram svg')))):await canvasBlob(canvas);
        sheet.close();
        if(download){downloadBlob(blob,`woodpilot-${tool.id}.${format==='pdf'?'pdf':'png'}`);notify('Fichier téléchargé.');return;}
        await shareFile(blob,`woodpilot-${tool.id}.${format==='pdf'?'pdf':'png'}`,tool.title,notify);
      }catch(error){notify(error.message);}finally{button.disabled=false;}
    });
    sheet.showModal();
  };
}
