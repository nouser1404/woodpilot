import {formatMeasure} from './cintrage.js';
const ns='http://www.w3.org/2000/svg';
export function drawStairPlan(result,view='top'){
 const svg=document.createElementNS(ns,'svg');
 function node(tag,attrs,text){const e=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));if(attrs['font-size'])e.style.fontSize=attrs['font-size']+'px';if(text!==undefined)e.textContent=text;svg.append(e);return e;}
 const top=view==='top',side=view==='side';
 const title=top?'Vue de dessus':side?'Vue de côté · projection de toutes les volées':'Vue de côté développée · ligne de foulée';
 const points=top?result.surfaces.flatMap(s=>s.polygon):side?result.surfaces.flatMap(s=>s.polygon.map(p=>({x:p.x,y:result.data.height-s.z}))):[{x:0,y:0},{x:result.developed,y:result.data.height}];
 const minX=Math.min(...points.map(p=>p.x)),maxX=Math.max(...points.map(p=>p.x)),minY=Math.min(0,...points.map(p=>p.y)),maxY=Math.max(result.data.height*(top?0:1),...points.map(p=>p.y));
 const width=Math.max(1,maxX-minX),height=Math.max(1,maxY-minY),margin=Math.max(width,height)*.15,font=margin*.22;
 svg.setAttribute('viewBox',`${minX-margin} ${minY-margin} ${width+2*margin} ${height+2*margin}`);svg.setAttribute('role','img');svg.setAttribute('aria-label',title);
 node('text',{x:minX,y:minY-margin*.65,class:'triangle-label','font-size':font},title);
 for(const s of result.surfaces){
  if(top){
   node('polygon',{points:s.polygon.map(p=>`${p.x},${p.y}`).join(' '),class:s.kind==='landing'?'stair-landing':'stair-tread','stroke-width':Math.max(width,height)*.0015});
   if(s.polygon.length>2){const x=s.polygon.reduce((n,p)=>n+p.x,0)/s.polygon.length,y=s.polygon.reduce((n,p)=>n+p.y,0)/s.polygon.length;node('text',{x,y,class:'piece-label','font-size':Math.min(font,result.rise*.45)},s.label);}
  }else if(side){
   const xs=s.polygon.map(p=>p.x),x1=Math.min(...xs),x2=Math.max(...xs),y=result.data.height-s.z;
   node('line',{x1,y1:y,x2,y2:y,class:s.kind==='landing'?'stair-landing-line':'construction','stroke-width':Math.max(width,height)*.002});
   if(s.kind==='tread')node('line',{x1,y1:y,x2:x1,y2:y+result.rise,class:'construction','stroke-width':Math.max(width,height)*.001});
  }else{
   const y=result.data.height-s.z;
   node('path',{d:`M${s.from} ${y+(s.kind==='tread'?result.rise:0)} V${y} H${s.to}`,class:'arc','stroke-width':Math.max(width,height)*.002});
   if(s.kind==='landing')node('text',{x:(s.from+s.to)/2,y:y-font*.4,class:'piece-label','font-size':font*.8},`${s.label} · ${formatMeasure(s.z)} mm`);
  }
 }
 if(top&&result.walkingPath)node('polyline',{points:result.walkingPath.map(p=>`${p.x},${p.y}`).join(' '),class:'stair-walking-line','stroke-width':Math.max(width,height)*.0015});
 node('text',{x:minX+width/2,y:maxY+margin*.7,class:'piece-label','font-size':font},`${top?'Emprise X':side?'Projection X':'Développé'} : ${formatMeasure(width)} mm`);
 const lx=minX-margin*.55,ly=minY+height/2;
 node('text',{x:lx,y:ly,transform:`rotate(-90 ${lx} ${ly})`,class:'piece-label','font-size':font},`${top?'Emprise Y':'Hauteur'} : ${formatMeasure(height)} mm`);
 return svg;
}
