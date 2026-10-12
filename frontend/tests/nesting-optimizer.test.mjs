import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateNesting} from '../public/woodpilot-mobile/manufacturing.js';
import {solvePanelNesting} from '../public/agencement-configurator/panel-nesting.js';
const panel={lengthMm:2800,widthMm:2070,sawKerfMm:3,edgeMarginMm:20};
const pieces=[2700,2500,2100,1600,1200,1200,950,950,900,900,600,600,600].map((lengthMm,i)=>({name:'Plinthe',id:`P${i}`,lengthMm,widthMm:150,thicknessMm:19,quantity:1,allowRotation:false}));
const largest=r=>Math.max(0,...r.panels.flatMap(p=>p.freeRects.map(x=>x.lengthMm*x.widthMm)));
test('Plinthes regroupées : une grande chute pleine longueur plutôt qu’un escalier de petites chutes',()=>{
 const r=calculateNesting({panel,pieces})[0].result,old=solvePanelNesting({...panel,lengthMm:2760,widthMm:2030},pieces);
 assert.equal(r.panels.length,1);assert.equal(r.panels[0].pieces.length,13);assert.ok(largest(r)>largest(old));
 assert.ok(r.panels[0].freeRects.some(x=>x.lengthMm===2760&&x.widthMm>=900));
});
test('Bounds, saw kerf, grain and determinism remain valid',()=>{
 const r=calculateNesting({panel,pieces})[0].result;
 assert.deepEqual(calculateNesting({panel,pieces})[0].result,r);
 for(const p of r.panels){for(const a of [...p.pieces,...p.freeRects]){assert.ok(a.x>=20&&a.y>=20);assert.ok(a.x+a.lengthMm<=2780.001&&a.y+a.widthMm<=2050.001);}
 for(const a of p.pieces){assert.equal(a.rotated,false);for(const b of p.pieces){if(a===b)continue;assert.ok(a.x+a.lengthMm+3<=b.x+.001||b.x+b.lengthMm+3<=a.x+.001||a.y+a.widthMm+3<=b.y+.001||b.y+b.widthMm+3<=a.y+.001);}}
 }
});
test('No extra panels or lost pieces compared to the original strategy',()=>{
 for(let n=1;n<=25;n++){const list=Array.from({length:n},(_,i)=>({...pieces[0],id:`P${i}`,lengthMm:300+(i*173)%2000,widthMm:100+(i*83)%700,allowRotation:i%2===0}));const old=solvePanelNesting({...panel,lengthMm:2760,widthMm:2030},list),r=calculateNesting({panel,pieces:list})[0].result;assert.ok(r.panels.length<=old.panels.length);assert.equal(r.overflowPieces.length,old.overflowPieces.length);}
});
