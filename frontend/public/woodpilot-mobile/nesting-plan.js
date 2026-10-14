import { formatMeasure } from './cintrage.js';
import { displayedEdges } from './nesting-details.js';
let hatchSequence=0;
export function drawNestingPanel(format,panel,title){
  const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
  const L=format.lengthMm,W=format.widthMm,margin=Math.max(L,W)*.12;
  function node(tag,attrs,text,parent=svg){const el=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,String(v));if(text!==undefined)el.textContent=text;parent.append(el);return el;}
  svg.setAttribute('viewBox',`${-margin} ${-margin} ${L+margin*2} ${W+margin*2}`);svg.setAttribute('role','img');svg.setAttribute('aria-label',`${title} · ${formatMeasure(L)} × ${formatMeasure(W)} mm · pointillés : chants plaqués · hachures : chutes`);
  node('rect',{width:L,height:W,class:'panel-outline'});
  const edgeMargin=format.edgeMarginMm??0;
  const hatchId=`wp-offcut-hatch-${++hatchSequence}`,pitch=Math.max(L,W)*.024;
  const defs=node('defs',{}),pattern=node('pattern',{id:hatchId,patternUnits:'userSpaceOnUse',width:pitch,height:pitch},undefined,defs);
  node('path',{d:`M${-pitch/4} ${pitch/4}L${pitch/4} ${-pitch/4}M0 ${pitch}L${pitch} 0M${pitch*.75} ${pitch*1.25}L${pitch*1.25} ${pitch*.75}`,class:'panel-offcut-line','stroke-width':Math.max(L,W)*.002,fill:'none',opacity:.65},undefined,pattern);
  node('rect',{x:edgeMargin,y:edgeMargin,width:L-2*edgeMargin,height:W-2*edgeMargin,fill:`url(#${hatchId})`,class:'panel-offcuts','pointer-events':'none'});
  if(edgeMargin>0)node('rect',{x:edgeMargin,y:edgeMargin,width:L-2*edgeMargin,height:W-2*edgeMargin,class:'panel-usable'});
  const dimension=(x1,y1,x2,y2,x,y,text)=>{node('line',{x1,y1,x2,y2,class:'panel-dimension'});for(const [a,b] of [[x1,y1],[x2,y2]])node('line',{x1:a-margin*.06,y1:b-margin*.06,x2:a+margin*.06,y2:b+margin*.06,class:'panel-dimension'});return node('text',{x,y,class:'panel-dimension-label','font-size':margin*.3},text);};
  dimension(0,-margin*.35,L,-margin*.35,L/2,-margin*.62,`${formatMeasure(L)} mm`);
  dimension(-margin*.35,0,-margin*.35,W,-margin*.7,W/2,`${formatMeasure(W)} mm`).setAttribute('transform',`rotate(-90 ${-margin*.7} ${W/2})`);
  for(const p of panel.pieces){
    const {x,y,lengthMm:l,widthMm:w}=p;
    node('rect',{x,y,width:l,height:w,class:'slat'});
    const code=String(p.code),horizontal=`${formatMeasure(l)} mm`,vertical=`${formatMeasure(w)} mm`;
    node('text',{x:x+l/2,y:y+w/2,class:'piece-label','font-size':Math.min(60,w/4,l/(code.length*.65+2))},code);
    node('text',{x:x+l/2,y:y+w*.82,class:'piece-label piece-dimension','font-size':Math.min(46,w/6,l/(horizontal.length*.65+2))},horizontal);
    const vx=x+l*.15,vy=y+w/2;
    node('text',{x:vx,y:vy,class:'piece-label piece-dimension','font-size':Math.min(46,l/6,w/(vertical.length*.65+2)),transform:`rotate(-90 ${vx} ${vy})`},vertical);

    const lines=[[x,y,x+l,y],[x+l,y,x+l,y+w],[x,y+w,x+l,y+w],[x,y,x,y+w]];
    displayedEdges(p).forEach((enabled,i)=>{if(enabled){const [x1,y1,x2,y2]=lines[i];node('line',{x1,y1,x2,y2,class:'panel-edge','stroke-width':Math.max(L,W)*.0025,'stroke-dasharray':`${Math.max(L,W)*.008} ${Math.max(L,W)*.004}`});}});
  }
  return svg;
}
