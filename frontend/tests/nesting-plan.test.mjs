import test from 'node:test';
import assert from 'node:assert/strict';
import {drawNestingPanel} from '../public/woodpilot-mobile/nesting-plan.js';
test('Cotes internes : dimensions placées après rotation, millimètres et texte contenu dans la pièce',()=>{
 const original=globalThis.document;
 globalThis.document={createElementNS(_ns,tag){return {tag,attributes:{},children:[],setAttribute(key,value){this.attributes[key]=value;},append(child){this.children.push(child);}};}};
 try{
  const svg=drawNestingPanel({lengthMm:2800,widthMm:2070},{pieces:[{x:20,y:20,lengthMm:400,widthMm:605.4,originalLengthMm:605.4,originalWidthMm:400,rotated:true,code:'P1'}]},'Panneau');
  const labels=svg.children.filter(n=>n.attributes.class==='piece-label piece-dimension');
  assert.deepEqual(labels.map(n=>n.textContent),['400 mm','605 mm']);
  assert.match(labels[1].attributes.transform,/rotate\(-90 /);
  for(const label of labels){assert.ok(+label.attributes.x>20&&+label.attributes.x<420);assert.ok(+label.attributes.y>20&&+label.attributes.y<625.4);assert.ok(+label.attributes['font-size']>0);}
 }finally{globalThis.document=original;}
});
