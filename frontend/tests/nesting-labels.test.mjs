import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateNesting} from '../public/woodpilot-mobile/manufacturing.js';
import {nestingLabels,labelsDocument} from '../public/woodpilot-mobile/nesting-labels.js';
const data={projectName:'Cuisine Dupont',material:'Mélaminé',panel:{lengthMm:1200,widthMm:800,sawKerfMm:3,edgeMarginMm:20},pieces:[{name:'Plinthe',lengthMm:900,widthMm:100,thicknessMm:19,quantity:3,allowRotation:true},{name:'Fond',lengthMm:500,widthMm:350,thicknessMm:6,quantity:1,allowRotation:false}]};
test('One label per placed occurrence, with original dimensions and matching plan codes',()=>{
 const groups=calculateNesting(data),labels=nestingLabels(data,groups,new Date(2026,9,12));assert.equal(labels.length,4);assert.deepEqual(new Set(labels.map(l=>l.reference)),new Set(['PLI1-1','PLI1-2','PLI1-3','FD1-1']));
 for(const l of labels){assert.equal(l.project,'Cuisine Dupont');assert.equal(l.material,'Mélaminé');assert.equal(l.date,'12/10/2026');assert.ok(l.panel>=1);}
 assert.equal(labels.find(l=>l.code==='PLI1').length,900);assert.equal(labels.find(l=>l.code==='PLI1').width,100);assert.equal(labels.find(l=>l.code==='FD1').thickness,6);
});
test('No labels for non-placed pieces; optional project omitted',()=>{
 const d={...data,projectName:'',pieces:[{...data.pieces[0],lengthMm:2000,widthMm:2000}]};assert.deepEqual(nestingLabels(d,calculateNesting(d)),[]);assert.throws(()=>labelsDocument([]));
 const labels=nestingLabels({...data,projectName:''},calculateNesting(data));assert.ok(!labelsDocument(labels).includes('class="label-project"'));
});
test('User strings are escaped, printed text contains all required fields',()=>{
 const d={...data,projectName:'<script>alert(1)</script>',pieces:[{...data.pieces[0],name:'<img src=x onerror=alert(1)>'}]},labels=nestingLabels(d,calculateNesting(d),new Date(2026,9,12)),html=labelsDocument(labels);
 assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<img'));assert.ok(html.includes('900 × 100 mm'));assert.ok(html.includes('Ép. 19 mm'));assert.ok(html.includes('Mélaminé'));assert.ok(html.includes('12/10/2026'));assert.ok(html.includes(labels[0].reference));
});
test('A4 paginates every 24 occurrences and roll printing uses one label per page',()=>{
 const labels=nestingLabels(data,calculateNesting(data)),many=Array.from({length:25},(_,i)=>({...labels[0],number:i+1}));assert.equal((labelsDocument(many).match(/<section class="label-page">/g)||[]).length,2);
 const thermal=labelsDocument(labels,'thermal');assert.equal((thermal.match(/<section class="label-page">/g)||[]).length,4);assert.ok(thermal.includes('size:100mm 50mm'));assert.throws(()=>labelsDocument(labels,'bad'));
});
