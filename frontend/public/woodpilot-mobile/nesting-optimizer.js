import {solvePanelNesting} from '../agencement-configurator/panel-nesting.js';
// Compare guillotine layouts, keeping panel count before recoverable offcut size.
function score(result,preference){
 const areas=result.panels.flatMap(p=>p.freeRects.filter(r=>r.lengthMm>=100&&r.widthMm>=100).map(r=>r.lengthMm*r.widthMm)).sort((a,b)=>b-a);
 const spans=result.panels.flatMap(p=>p.freeRects.filter(r=>r.lengthMm>=100&&r.widthMm>=100).map(r=>preference==='length'?r.lengthMm:r.widthMm));
 return [result.overflowPieces.length,result.panels.length,...(preference&&preference!=='auto'?[-Math.max(0,...spans)]:[]),-(areas[0]??0),-areas.reduce((s,a)=>s+a*a,0)];
}
function better(a,b,preference){const x=score(a,preference),y=score(b,preference);for(let i=0;i<x.length;i++)if(x[i]!==y[i])return x[i]<y[i];return false;}
export function solveReusableNesting(panel,pieces,preference='auto'){
 let best=solvePanelNesting(panel,pieces);
 for(const splitAxis of ['horizontal','vertical']){
  const candidate=solvePanelNesting(panel,pieces,{splitAxis});
  if(better(candidate,best,preference))best=candidate;
 }
 return best;
}
