import test from 'node:test';
import assert from 'node:assert/strict';
import {installInvitation,isStandalone} from '../public/woodpilot-mobile/pwa-install.js';
function fixture({standalone=false,visited=false,installed=false,busy=false}={}){
 const store=new Map();if(visited)store.set('woodpilot-install-invitation-v1','1');if(installed)store.set('woodpilot-installed-v1','1');
 const events={},nodes=new Map(),media={matches:standalone,addEventListener(){}};
 const win={navigator:{standalone,userAgent:'iPhone'},matchMedia:()=>media,isSecureContext:true,localStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)},addEventListener:(k,fn)=>events[k]=fn,setTimeout:fn=>events.timer=fn};
 let appended=0;const dialog={open:false,setAttribute(){},querySelector:k=>{if(!nodes.has(k))nodes.set(k,{});return nodes.get(k);},showModal(){this.open=true;},close(){this.open=false;}};
 const doc={hidden:false,querySelector:()=>busy?{}:null,createElement:()=>dialog,body:{append(){appended++;}},addEventListener(){}};
 return {win,doc,events,nodes,store,dialog,count:()=>appended};
}
test('Pas d’invitation en standalone, déjà vue, ou installation mémorisée',()=>{
 for(const options of [{standalone:true},{visited:true},{installed:true}]){const f=fixture(options);installInvitation(f.win,f.doc);f.events.timer?.();assert.equal(f.count(),0);}
 assert.equal(isStandalone(fixture({standalone:true}).win),true);
});
test('Première visite : aide iPhone, refus sans répétition, aucun outil interrompu',()=>{
 const f=fixture();installInvitation(f.win,f.doc);f.events.timer();assert.equal(f.count(),1);assert.equal(f.dialog.open,true);assert.match(f.nodes.get('[data-install-help]').textContent,/Safari/);assert.equal(f.nodes.get('[data-install-native]').hidden,true);
 f.nodes.get('[data-install-later]').onclick();f.events.timer();assert.equal(f.count(),1);assert.equal(f.dialog.open,false);
 const busy=fixture({busy:true});installInvitation(busy.win,busy.doc);busy.events.timer();assert.equal(busy.count(),0);assert.equal(busy.store.size,0);
});
test('Le bouton natif dépend de l’événement et appelle le prompt sur action explicite',async()=>{
 const f=fixture();installInvitation(f.win,f.doc);let prompted=0,prevented=0;
 f.events.beforeinstallprompt({preventDefault(){prevented++;},async prompt(){prompted++;},userChoice:Promise.resolve({outcome:'accepted'})});
 assert.equal(prevented,1);assert.equal(prompted,0);assert.equal(f.nodes.get('[data-install-native]').hidden,false);
 await f.nodes.get('[data-install-native]').onclick();assert.equal(prompted,1);assert.equal(f.store.get('woodpilot-installed-v1'),'1');assert.equal(f.dialog.open,false);
});
