import {solvePanelNesting} from '../agencement-configurator/panel-nesting.js';
// Compare guillotine layouts, keeping panel count before recoverable offcut size.
function score(result){
 const areas=result.panels.flatMap(p=>p.freeRects.filter(r=>r.lengthMm>=100&&r.widthMm>=100).map(r=>r.lengthMm*r.widthMm)).sort((a,b)=>b-a);
 return [result.overflowPieces.length,result.panels.length,-(areas[0]??0),-areas.reduce((s,a)=>s+a*a,0)];
}
function better(a,b){const x=score(a),y=score(b);for(let i=0;i<x.length;i++)if(x[i]!==y[i])return x[i]<y[i];return false;}
export function solveReusableNesting(panel,pieces){
 let best=solvePanelNesting(panel,pieces);
 for(const splitAxis of ['horizontal','vertical']){
  const candidate=solvePanelNesting(panel,pieces,{splitAxis});
  if(better(candidate,best))best=candidate;
 }
 return best;
}
