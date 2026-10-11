import test from 'node:test';
import assert from 'node:assert/strict';
import {inclination,slopeFromAngle,stableInclination,validateInclination} from '../public/woodpilot-mobile/inclinometer-model.js';
const gravity=(angle,flip=1)=>({x:9.81*Math.sin(angle*Math.PI/180),y:0,z:flip*9.81*Math.cos(angle*Math.PI/180)});
test('Pente du plan de l’écran identique face vers le haut ou le bas et indépendante de la rotation',()=>{
 for(const angle of [0,15,30,45,60,90])for(const flip of [-1,1]){const g=gravity(angle,flip);assert.ok(Math.abs(inclination(g)-angle)<1e-10);assert.ok(Math.abs(inclination({x:0,y:g.x,z:g.z})-angle)<1e-10);}
 assert.ok(Math.abs(slopeFromAngle(45).percent-100)<1e-10);assert.equal(slopeFromAngle(90).percent,null);
});
test('Capture stable seulement après deux secondes de mesures fraîches',()=>{
 let state=null;for(let t=0;t<=1900;t+=100){state=stableInclination(state,gravity(30),t);assert.equal(state.stable,false);}state=stableInclination(state,gravity(30),2000);assert.equal(state.stable,true);assert.ok(Math.abs(state.angle-30)<1e-10);
});
test('Mouvement, données interrompues et accélération annulent la fenêtre stable',()=>{
 let state=null;for(let t=0;t<=2000;t+=100)state=stableInclination(state,gravity(20),t);
 assert.equal(stableInclination(state,gravity(21),2100).stable,false);
 assert.equal(stableInclination(state,gravity(20),2700).stable,false);
 assert.equal(stableInclination(state,{x:0,y:0,z:11},2100).stable,false);
 const g=gravity(20);assert.equal(stableInclination(state,{x:0,y:g.x,z:g.z},2100).stable,false);
 assert.throws(()=>inclination({x:NaN,y:0,z:9.81}));assert.throws(()=>inclination({x:0,y:0,z:0}));
});
test('Mesure enregistrée : angle et date validés sans accepter une pente impossible',()=>{
 assert.equal(validateInclination({angle:30,measuredAt:'2026-10-11T12:00:00Z'}).angle,30);
 assert.throws(()=>validateInclination({angle:100,measuredAt:'2026-10-11T12:00:00Z'}));assert.throws(()=>validateInclination({angle:30,measuredAt:'incorrect'}));
});
