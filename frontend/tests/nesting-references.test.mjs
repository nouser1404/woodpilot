import test from 'node:test';
import assert from 'node:assert/strict';
import {pieceReferences,groupedPanelPieces} from '../public/woodpilot-mobile/nesting-references.js';
import {calculateNesting,validateCutList} from '../public/woodpilot-mobile/manufacturing.js';
import {nestingReport} from '../public/woodpilot-mobile/nesting-details.js';
const piece={name:'Tablette',lengthMm:600,widthMm:200,thicknessMm:19,quantity:3,allowRotation:false};
const data={panel:{lengthMm:1200,widthMm:800,sawKerfMm:3,edgeMarginMm:20},pieces:[piece]};
test('Repères métier, accents et noms personnalisés sans collision',()=>{
 const codes=pieceReferences(['Montant','Plinthe','Tablette','Traverse','Étagère','Tablette','Côté','123','ABC1','ABC'].map(name=>({name})));
 assert.deepEqual(codes.slice(0,7),['MT1','PLI1','TAB1','TR1','ETA1','TAB2','CT1']);assert.equal(new Set(codes).size,codes.length);
});
test('Le tableau regroupe les occurrences et garde dimensions et chants distincts',()=>{
 const groups=calculateNesting({...data,pieces:[piece,{...piece,widthMm:210,quantity:2,chantTop:true}]});
 const rows=groups.flatMap(g=>g.result.panels.flatMap(groupedPanelPieces));
 assert.equal(rows.reduce((s,p)=>s+p.count,0),5);assert.equal(rows.filter(p=>p.code==='TAB1').reduce((s,p)=>s+p.count,0),3);assert.ok(rows.some(p=>p.code==='TAB2'&&p.chantTop));
 assert.ok(nestingReport(data,calculateNesting(data)).includes('TAB1 · 3 occurrence(s)'));
});
test('Le choix longueur / largeur change la chute conservée sans modifier le débit',()=>{
 const d={...data,pieces:[{...piece,quantity:1}]};
 const length=calculateNesting({...d,optimization:'length'})[0].result;
 const width=calculateNesting({...d,optimization:'width'})[0].result;
 assert.equal(length.panels.length,1);assert.equal(width.panels.length,1);
 assert.ok(Math.max(...length.panels[0].freeRects.map(r=>r.lengthMm))>Math.max(...width.panels[0].freeRects.map(r=>r.lengthMm)));
 assert.ok(Math.max(...width.panels[0].freeRects.map(r=>r.widthMm))>Math.max(...length.panels[0].freeRects.map(r=>r.widthMm)));
 for(const result of [length,width])assert.equal(result.panels[0].pieces[0].rotated,false);
 assert.deepEqual(calculateNesting(data),calculateNesting({...data,optimization:'auto'}));assert.throws(()=>validateCutList({...data,optimization:'oops'}));
});
