import {levelAxes,levelReading} from './level-model.js';
import {stabilizeLevel,roundedLevel} from './level-feedback.js';
import {createLevelSound} from './level-sound.js';
export function createLevelTool(){
 const root=document.querySelector('#levelTool'),status=root.querySelector('[data-level-status]'),start=root.querySelector('[data-level-start]'),calibrate=root.querySelector('[data-level-calibrate]');
 let mode='level',axes=null,zero={x:0,y:0},filter=null,active=false,lastSample=0,timer,simulation=false;
 let feedback=null,filterTime=0;
 const sound=createLevelSound(),soundButton=root.querySelector('[data-level-sound]');
 const show=value=>roundedLevel(value).toLocaleString('fr-FR');
 soundButton.onclick=async()=>{try{if(sound.enabled)sound.disable();else await sound.enable();soundButton.setAttribute('aria-pressed',String(sound.enabled));soundButton.textContent=sound.enabled?'Son activé':'Activer le son';root.querySelector('[data-level-sound-status]').textContent=sound.enabled?'Bips plus rapprochés en approchant du centre ; rapides et plus aigus une fois aligné.':'Son désactivé.';render();}catch(error){root.querySelector('[data-level-sound-status]').textContent=error.message;}};
 function render(){
  const fresh=simulation||(active&&Date.now()-lastSample<2000);
  calibrate.disabled=!axes||!fresh;
  root.querySelector('[data-level-reset]').disabled=!zero.x&&!zero.y;
  root.querySelector('[data-level-reference]').textContent=zero.x||zero.y?'Référence personnalisée : zéro relatif calibré.':'Référence gravité : niveau / aplomb absolu.';
  const bubble=root.querySelector('[data-level-bubble]');bubble.toggleAttribute('hidden',!axes||!fresh);
  if(!axes||!fresh){feedback=null;sound.reset();root.querySelector('[data-level-angle]').textContent='—';root.querySelector('[data-level-offset]').textContent='Aucune mesure disponible';return;}
  const result=levelReading(axes,zero);
  feedback=stabilizeLevel(result,feedback,Date.now());
  root.querySelector('[data-level-angle]').textContent=`${show(result.angle)}°`;
  root.querySelector('[data-level-offset]').textContent=`${feedback.aligned?'Alignement stable':'À ajuster'} · ${result.mmPerMeter===null?'proche de 90°':show(result.mmPerMeter)+' mm/m'}${simulation?' · SIMULATION':''}`;
  bubble.setAttribute('cx',String(150+Math.max(-1,Math.min(1,feedback.x/5))*95));bubble.setAttribute('cy',String(150+Math.max(-1,Math.min(1,feedback.y/5))*95));
  bubble.classList.toggle('aligned',feedback.aligned);
  if(root.open&&!document.hidden)sound.tone(Date.now(),result.angle,feedback.aligned);
 }
 function stop(){sound.silence();active=false;clearInterval(timer);window.removeEventListener('devicemotion',sample);filter=null;filterTime=0;feedback=null;axes=null;render();}
 function sample(event){
  if(document.hidden||!root.open)return;
  try{const g=event.accelerationIncludingGravity;
   if(!g||![g.x,g.y,g.z].every(Number.isFinite))return;
   const n=Math.hypot(g.x,g.y,g.z);if(n<7||n>12){status.textContent='Gardez le téléphone immobile pour mesurer.';return;}
   const now=Date.now(),weight=filterTime?1-Math.exp(-Math.min(1000,now-filterTime)/350):1;filterTime=now;
   filter=filter?{x:filter.x*(1-weight)+g.x*weight,y:filter.y*(1-weight)+g.y*weight,z:filter.z*(1-weight)+g.z*weight}:{x:g.x,y:g.y,z:g.z};
   axes=levelAxes(filter,mode,screen.orientation?.angle??0);lastSample=Date.now();status.textContent='Capteur actif — posez le téléphone et attendez la stabilisation.';render();
  }catch{status.textContent='Mesure du capteur indisponible.';}
 }
 start.onclick=async()=>{
  stop();simulation=false;root.querySelector('[data-level-demo]').open=false;
  if(!window.isSecureContext){status.textContent='Les capteurs nécessitent HTTPS sur téléphone.';return;}
  if(!window.DeviceMotionEvent){status.textContent='Ce navigateur ne propose pas de capteur de mouvement. La simulation reste disponible.';return;}
  try{if(typeof DeviceMotionEvent.requestPermission==='function'&&await DeviceMotionEvent.requestPermission()!=='granted'){status.textContent='Accès aux capteurs refusé. Vous pouvez réessayer.';return;}
   if(!root.open)return;active=true;zero={x:0,y:0};status.textContent='En attente du capteur…';window.addEventListener('devicemotion',sample);
   timer=setInterval(()=>{if(Date.now()-lastSample>2000)status.textContent='Aucune mesure récente. Vérifiez les capteurs et gardez le téléphone immobile.';render();},100);
  }catch{status.textContent='Accès aux capteurs impossible dans ce navigateur.';}
 };
 root.querySelector('[data-level-mode]').onchange=event=>{mode=event.target.value;zero={x:0,y:0};axes=null;filter=null;root.querySelector('[data-level-instructions]').textContent=mode==='level'?'Posez le dos du téléphone à plat sur la surface.':'Placez le téléphone debout, son axe vertical parallèle à l’élément à contrôler.';if(simulation)demo();else render();};
 calibrate.onclick=()=>{if(axes&&!calibrate.disabled){zero={...axes};feedback=null;render();}};
 root.querySelector('[data-level-reset]').onclick=()=>{zero={x:0,y:0};feedback=null;render();};
 function demo(){if(!root.querySelector('[data-level-demo]').open)return;stop();simulation=true;const inputs=[root.querySelector('[data-demo-x]'),root.querySelector('[data-demo-y]')];if(inputs.some(input=>!input.value||!input.checkValidity())){axes=null;status.textContent='Simulation : saisissez deux angles entre −89° et 89°.';render();return;}axes={x:Number(inputs[0].value),y:Number(inputs[1].value)};status.textContent='SIMULATION — valeurs saisies, aucune mesure réelle.';render();timer=setInterval(render,100);}
 root.querySelector('[data-level-demo]').ontoggle=()=>{if(root.querySelector('[data-level-demo]').open)demo();else if(simulation){simulation=false;axes=null;zero={x:0,y:0};status.textContent='Activez les capteurs pour mesurer.';render();}};
 root.querySelectorAll('[data-demo-x],[data-demo-y]').forEach(input=>input.oninput=demo);
 root.addEventListener('close',()=>{stop();sound.disable();soundButton.setAttribute('aria-pressed','false');soundButton.textContent='Activer le son';root.querySelector('[data-level-sound-status]').textContent='Son désactivé.';simulation=false;zero={x:0,y:0};root.querySelector('[data-level-demo]').open=false;});
 screen.orientation?.addEventListener('change',()=>{zero={x:0,y:0};axes=null;filter=null;if(root.open)render();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&active){stop();status.textContent='Mesure arrêtée en arrière-plan. Réactivez les capteurs.';}});
 render();return {root,open(){status.textContent='Activez les capteurs pour mesurer.';root.showModal();}};
}
