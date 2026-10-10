import { displayedEdges } from './nesting-details.js';
export function drawNestingPanel(format,panel,title){
  const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
  const L=format.lengthMm,W=format.widthMm,margin=Math.max(L,W)*.12;
  function node(tag,attrs,text){const el=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,String(v));if(text!==undefined)el.textContent=text;svg.append(el);return el;}
  svg.setAttribute('viewBox',`${-margin} ${-margin} ${L+margin*2} ${W+margin*2}`);svg.setAttribute('role','img');svg.setAttribute('aria-label',`${title} · ${L} × ${W} mm · pointillés : chants plaqués`);
  node('rect',{width:L,height:W,class:'panel-outline'});
  const edgeMargin=format.edgeMarginMm??0;
  if(edgeMargin>0)node('rect',{x:edgeMargin,y:edgeMargin,width:L-2*edgeMargin,height:W-2*edgeMargin,class:'panel-usable'});
  const dimension=(x1,y1,x2,y2,x,y,text)=>{node('line',{x1,y1,x2,y2,class:'panel-dimension'});for(const [a,b] of [[x1,y1],[x2,y2]])node('line',{x1:a-margin*.06,y1:b-margin*.06,x2:a+margin*.06,y2:b+margin*.06,class:'panel-dimension'});return node('text',{x,y,class:'panel-dimension-label','font-size':margin*.3},text);};
  dimension(0,-margin*.35,L,-margin*.35,L/2,-margin*.62,`${L} mm`);
  dimension(-margin*.35,0,-margin*.35,W,-margin*.7,W/2,`${W} mm`).setAttribute('transform',`rotate(-90 ${-margin*.7} ${W/2})`);
  for(const p of panel.pieces){
    const {x,y,lengthMm:l,widthMm:w}=p;
    node('rect',{x,y,width:l,height:w,class:'slat'});
    node('text',{x:x+l/2,y:y+w/2,class:'piece-label','font-size':Math.min(60,w/2,l/3)},p.code);
    const lines=[[x,y,x+l,y],[x+l,y,x+l,y+w],[x,y+w,x+l,y+w],[x,y,x,y+w]];
    displayedEdges(p).forEach((enabled,i)=>{if(enabled){const [x1,y1,x2,y2]=lines[i];node('line',{x1,y1,x2,y2,class:'panel-edge','stroke-width':Math.max(L,W)*.0025,'stroke-dasharray':`${Math.max(L,W)*.008} ${Math.max(L,W)*.004}`});}});
  }
  return svg;
}
