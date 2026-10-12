import test from 'node:test';import assert from 'node:assert/strict';
import {STAIR_TYPES,calculateStairLayout} from '../public/woodpilot-mobile/stairs-layout.js';
const base={height:2800,run:4200,risers:null,nosing:20};
const area=points=>Math.abs(points.reduce((s,p,i)=>{const q=points[(i+1)%points.length];return s+p.x*q.y-q.x*p.y;},0)/2);
test('Escaliers : conservation des hauteurs et des surfaces pour les six formes',()=>{
 for(const type of Object.keys(STAIR_TYPES)){const r=calculateStairLayout({...base,type});assert.equal(r.treads+r.landingCount,r.risers-1);assert.equal(r.surfaces.length,r.risers);assert.ok(Math.abs(r.surfaces.at(-1).z-base.height)<1e-8);assert.equal(r.positions.length,r.treads);for(const s of r.surfaces)assert.ok(s.polygon.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));}
});
test('Paliers : hauteur cumulée, girons par volée et volées personnalisées',()=>{
 const r=calculateStairLayout({...base,type:'doubleLanding',flightRuns:[1500,1200,1800],flightRisers:[6,5,7]});assert.equal(r.risers,18);assert.equal(r.treads,15);assert.deepEqual(r.goings,[300,300,300]);r.surfaces.filter(s=>s.kind==='landing').forEach((s,i)=>assert.ok(Math.abs(s.z-[6*2800/18,11*2800/18][i])<1e-8));
});
test('Hélicoïdal : arc sur foulée, angle unitaire et limites radiales',()=>{
 const r=calculateStairLayout({...base,type:'helix',risers:17});assert.ok(Math.abs(r.going-700*Math.PI*2/16)<1e-8);assert.equal(r.stepAngle,22.5);assert.equal(r.usableWidth,925);assert.throws(()=>calculateStairLayout({...base,type:'helix',walkingRadius:1200}),RangeError);
});
test('Balancement : collets constants et couverture du corridor sans perte de surface',()=>{
 for(const type of ['quarter','half']){
  const r=calculateStairLayout({...base,type,turning:'balanced',width:900,gap:100,risers:18});
  assert.equal(r.landingCount,0);assert.equal(r.treads,17);assert.ok(r.collet>0);
  const total=r.surfaces.filter(s=>s.kind==='tread').reduce((sum,s)=>sum+area(s.polygon),0);
  const expected=4200*900+(type==='half'?900*(2*900+100):900*900);
  assert.ok(Math.abs(total-expected)<1e-6,`${type} couverture ${total} / ${expected}`);
 }
});
test('Sens de montée : symétrie du plan et invariance des hauteurs',()=>{
 const left=calculateStairLayout({...base,type:'quarter',turning:'balanced',direction:'left'}),right=calculateStairLayout({...base,type:'quarter',turning:'balanced',direction:'right'});
 left.surfaces.forEach((s,i)=>s.polygon.forEach((p,j)=>{assert.equal(right.surfaces[i].polygon[j].x,p.x);assert.equal(right.surfaces[i].polygon[j].y,-p.y);}));assert.equal(left.rise,right.rise);
});
test('Paramètres invalides : paliers étroits, répartition impossible, vols manquants',()=>{
 for(const change of [{type:'tripleLanding',risers:6},{type:'quarter',landingDepth:500},{type:'half',flightRuns:[1000]},{type:'doubleLanding',flightRisers:[3,4]},{type:'unknown'}])assert.throws(()=>calculateStairLayout({...base,...change}),RangeError);
});
