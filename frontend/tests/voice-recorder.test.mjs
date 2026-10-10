import test from 'node:test';
import assert from 'node:assert/strict';
import {createVoiceRecorder} from '../public/woodpilot-mobile/voice-recorder.js';
function fixture(){
  let released=0,clock=1000,instance;const clips=[],errors=[],states=[];
  const stream={getTracks:()=>[{stop(){released++;}}]};
  class Recorder{
    static isTypeSupported(type){return type==='audio/mp4';}
    constructor(source,options){assert.equal(source,stream);this.mimeType=options.mimeType;this.state='inactive';instance=this;}
    start(){this.state='recording';}
    stop(){this.state='inactive';queueMicrotask(()=>{this.ondataavailable({data:new Blob(['audio'],{type:this.mimeType})});this.onstop();});}
  }
  const options={getStream:async()=>stream,Recorder,now:()=>clock,onClip:clip=>clips.push(clip),onError:error=>errors.push(error),onState:state=>states.push(state)};
  return {options,stream,clips,errors,states,get released(){return released;},get instance(){return instance;},setClock(value){clock=value;}};
}
test('Notes vocales : dernier bloc conservé, format MP4 compatible, durée et arrêt du micro',async()=>{
  const f=fixture(),r=createVoiceRecorder(f.options);await r.start();assert.equal(r.state,'recording');f.setClock(4500);r.stop();await Promise.resolve();assert.equal(r.state,'idle');assert.equal(f.released,1);assert.equal(f.clips.length,1);assert.equal(f.clips[0].duration,3.5);assert.equal(f.clips[0].blob.type,'audio/mp4');assert.equal(await f.clips[0].blob.text(),'audio');r.stop();assert.equal(f.clips.length,1);
});
test('Fermer pendant la demande de permission libère le micro accordé tardivement sans enregistrer',async()=>{
  const f=fixture();let resolve;f.options.getStream=()=>new Promise(r=>resolve=r);const r=createVoiceRecorder(f.options),starting=r.start();r.stop();resolve(f.stream);await starting;assert.equal(r.state,'idle');assert.equal(f.released,1);assert.equal(f.instance,undefined);assert.equal(f.clips.length,0);
});
test('Refus du microphone : retour au repos et possibilité de réessayer',async()=>{
  const f=fixture();let denied=true;f.options.getStream=async()=>{if(denied)throw Object.assign(new Error('Refus'),{name:'NotAllowedError'});return f.stream;};const r=createVoiceRecorder(f.options);await r.start();assert.equal(r.state,'idle');assert.equal(f.errors[0].name,'NotAllowedError');denied=false;await r.start();assert.equal(r.state,'recording');r.stop();await Promise.resolve();
});
test('Construction impossible : les pistes sont libérées et aucun fichier trompeur n’est créé',async()=>{
  const f=fixture();f.options.Recorder=class{constructor(){throw new Error('Codec indisponible');}};const r=createVoiceRecorder(f.options);await r.start();assert.equal(r.state,'idle');assert.equal(f.released,1);assert.equal(f.clips.length,0);assert.equal(f.errors.length,1);
});

test('Un ancien refus tardif ne coupe pas une nouvelle prise en cours',async()=>{
  const f=fixture();let reject,count=0;f.options.getStream=()=>++count===1?new Promise((_,r)=>reject=r):Promise.resolve(f.stream);const r=createVoiceRecorder(f.options),old=r.start();r.stop();await r.start();reject(new Error('Ancienne demande'));await old;assert.equal(r.state,'recording');assert.equal(f.released,0);assert.equal(f.errors.length,0);r.stop();await Promise.resolve();
});
