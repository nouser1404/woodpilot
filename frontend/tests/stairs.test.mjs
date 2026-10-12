import test from 'node:test';import assert from 'node:assert/strict';
import {calculateStairs,stairsText} from '../public/woodpilot-mobile/stairs.js';
const base={height:2800,run:4200,risers:null,nosing:20};
test('Escalier : proposition 16 hauteurs, 15 marches et Blondel 630',()=>{const r=calculateStairs(base);assert.equal(r.risers,16);assert.equal(r.treads,15);assert.equal(r.rise,175);assert.equal(r.going,280);assert.equal(r.blondel,630);assert.equal(r.depth,300);assert.deepEqual(r.warnings,[]);assert.equal(r.positions.at(-1).z,2625);});
test('Escalier : nombre manuel conservé et tracé cumulé non arrondi',()=>{const r=calculateStairs({...base,height:2801,risers:17});assert.equal(r.risers,17);assert.equal(r.positions.at(-1).z,16*2801/17);assert.equal(r.positions.length,16);assert.match(stairsText(base),/15 marches/);});
test('Escalier : dimensions incohérentes, fractions de hauteur et nez invalides refusés',()=>{for(const change of [{height:0},{run:NaN},{risers:1},{risers:3.5},{nosing:-1},{risers:undefined}])assert.throws(()=>calculateStairs({...base,...change}),RangeError);});
test('Escalier : une géométrie raide reste calculable avec avertissements',()=>{const r=calculateStairs({...base,run:1500,risers:10});assert.ok(r.warnings.length>=2);assert.ok(r.angle>45);});
