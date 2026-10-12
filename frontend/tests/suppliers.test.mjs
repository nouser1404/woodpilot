import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateSuppliers,filterSuppliers,supplierAreas,supplierDistance,supplierDirections,readSupplierPreferences} from '../public/woodpilot-mobile/suppliers-model.js';
const data=JSON.parse(readFileSync(new URL('../public/woodpilot-mobile/suppliers/suppliers.json',import.meta.url),'utf8'));
test('Canonical supplier IDs, coverage and geographic constraints preserved',()=>{
 assert.equal(validateSuppliers(data),data);assert.equal(data.length,51);assert.equal(new Set(data.map(x=>x.id)).size,51);assert.equal(filterSuppliers(data,{country:'FR'}).length,44);assert.equal(filterSuppliers(data,{country:'BE'}).length,7);assert.equal(supplierAreas(data,'FR').length,12);assert.deepEqual(supplierAreas(data,'BE'),['BE-HAI','BE-VWV']);for(const s of data.filter(x=>x.country==='BE'))assert.ok(s.borderDistanceUpperBoundKm<=50);assert.throws(()=>validateSuppliers([...data,data[0]]));assert.throws(()=>validateSuppliers([{...data[0],url:'javascript:alert(1)'}]));
});
test('Search ignores accents and combined country, area, category and service filters intersect',()=>{
 const s=data.find(x=>x.tags.length),term=s.name;assert.ok(filterSuppliers(data,{search:term.normalize('NFD').replace(/[\u0300-\u036f]/g,'')}).some(x=>x.id===s.id));const matches=filterSuppliers(data,{country:s.country||'FR',area:s.department,category:s.category,service:s.tags[0]});assert.ok(matches.some(x=>x.id===s.id));for(const x of matches){assert.equal(x.category,s.category);assert.equal(x.department,s.department);assert.ok(x.tags.includes(s.tags[0]));}assert.deepEqual(filterSuppliers(data,{search:'no-such-supplier-xxxxxxxx'}),[]);
});
test('Favorites filter uses stable IDs and storage safely recovers corrupted input',()=>{
 const ids=[data[0].id,data[3].id];assert.deepEqual(new Set(filterSuppliers(data,{onlyFavorites:true,favorites:ids}).map(x=>x.id)),new Set(ids));const storage={getItem:k=>k.includes('favorites')?JSON.stringify([ids[0],ids[0],-1,'2']):JSON.stringify({[ids[0]]:'Mon contact','bad':'ignore'})};assert.deepEqual(readSupplierPreferences(storage),{favorites:[ids[0]],notes:{[ids[0]]:'Mon contact'}});assert.deepEqual(readSupplierPreferences({getItem:()=>'{broken'}),{favorites:[],notes:{}});
});
test('Distance sorting retains unlocated suppliers and does not confuse road or border distances',()=>{
 const origin=[50,3],items=[{...data[0],id:101,name:'Unknown',lat:null,lon:null},{...data[0],id:102,name:'Far',lat:51,lon:3},{...data[0],id:103,name:'Near',lat:50,lon:3}];assert.equal(supplierDistance(items[2],origin),0);assert.equal(supplierDistance(items[0],origin),null);assert.ok(Math.abs(supplierDistance(items[1],origin)-111.195)<.01);assert.deepEqual(filterSuppliers(items,{origin}).map(x=>x.id),[103,102,101]);assert.ok(supplierDirections(data[0]).startsWith('https://www.google.com/maps/dir/?api=1&destination='));
});
test('CSV retains the canonical number of establishments and IDs are not regenerated',()=>{
 const csv=readFileSync(new URL('../public/woodpilot-mobile/suppliers/fournisseurs.csv',import.meta.url),'utf8');assert.equal(csv.charCodeAt(0),0xFEFF);assert.ok(csv.includes(data[0].name));assert.equal(csv.trim().split(/\r?\n/).length,52);
});
