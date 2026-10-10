import {levelAxes,levelReading} from './level-model.js';
export function createLevelTool(){
 const root=document.querySelector('#levelTool'),status=root.querySelector('[data-level-status]'),start=root.querySelector('[data-level-start]'),calibrate=root.querySelector('[data-level-calibrate]');
 let mode='level',axes=null,zero={x:0,y:0},filter=null,active=false,lastSample=0,timer,simulation=false;
 const show=value=>value.toLocaleString('fr-FR',{minimumFractionDigits:1,maximumFractionDigits:1});
 function render(){
  const fresh=simulation||(active&&Date.now()-lastSample<2000);
  calibrate.disabled=!axes||!fresh;
  root.querySelector('[data-level-reset]').disabled=!zero.x&&!zero.y;
  root.querySelector('[data-level-reference]').textContent=zero.x||zero.y?'Référence personnalisée : zéro relatif calibré.':'Référence gravité : niveau / aplomb absolu.';
  const bubble=root.querySelector('[data-level-bubble]');bubble.toggleAttribute('hidden',!axes||!fresh);
  if(!axes||!fresh){root.querySelector('[data-level-angle]').textContent='—';root.querySelector('[data-level-offset]').textContent='Aucune mesure disponible';return;}
  const result=levelReading(axes,zero);
  root.querySelector('[data-level-angle]').textContent=`${show(result.angle)}°`;
  root.querySelector('[data-level-offset]').textContent=`${result.aligned?'Aligné à ±0,2°':'À ajuster'} · ${result.mmPerMeter===null?'proche de 90°':show(result.mmPerMeter)+' mm/m'}${simulation?' · SIMULATION':''}`;
  bubble.setAttribute('cx',String(150+Math.max(-1,Math.min(1,result.x/5))*95));bubble.setAttribute('cy',String(150+Math.max(-1,Math.min(1,result.y/5))*95));
  bubble.classList.toggle('aligned',result.aligned);
 }
 function stop(){active=false;clearInterval(timer);window.removeEventListener('devicemotion',sample);filter=null;axes=null;render();}
 function sample(event){
  if(document.hidden||!root.open)return;
  try{const g=event.accelerationIncludingGravity;
   if(!g||![g.x,g.y,g.z].every(Number.isFinite))return;
   const n=Math.hypot(g.x,g.y,g.z);if(n<7||n>12){status.textContent='Gardez le téléphone immobile pour mesurer.';return;}
   filter=filter?{x:filter.x*.8+g.x*.2,y:filter.y*.8+g.y*.2,z:filter.z*.8+g.z*.2}:{x:g.x,y:g.y,z:g.z};
   axes=levelAxes(filter,mode,screen.orientation?.angle??0);lastSample=Date.now();status.textContent='Capteur actif — posez le téléphone et attendez la stabilisation.';render();
  }catch{status.textContent='Mesure du capteur indisponible.';}
 }
 start.onclick=async()=>{
  stop();simulation=false;root.querySelector('[data-level-demo]').open=false;
  if(!window.isSecureContext){status.textContent='Les capteurs nécessitent HTTPS sur téléphone.';return;}
  if(!window.DeviceMotionEvent){status.textContent='Ce navigateur ne propose pas de capteur de mouvement. La simulation reste disponible.';return;}
  try{if(typeof DeviceMotionEvent.requestPermission==='function'&&await DeviceMotionEvent.requestPermission()!=='granted'){status.textContent='Accès aux capteurs refusé. Vous pouvez réessayer.';return;}
   if(!root.open)return;active=true;zero={x:0,y:0};status.textContent='En attente du capteur…';window.addEventListener('devicemotion',sample);
   timer=setInterval(()=>{if(Date.now()-lastSample>2000){status.textContent='Aucune mesure récente. Vérifiez les capteurs et gardez le téléphone immobile.';render();}},1000);
  }catch{status.textContent='Accès aux capteurs impossible dans ce navigateur.';}
 };
 root.querySelector('[data-level-mode]').onchange=event=>{mode=event.target.value;zero={x:0,y:0};axes=null;filter=null;root.querySelector('[data-level-instructions]').textContent=mode==='level'?'Posez le dos du téléphone à plat sur la surface.':'Placez le téléphone debout, son axe vertical parallèle à l’élément à contrôler.';if(simulation)demo();else render();};
 calibrate.onclick=()=>{if(axes&&!calibrate.disabled){zero={...axes};render();}};
 root.querySelector('[data-level-reset]').onclick=()=>{zero={x:0,y:0};render();};
 function demo(){if(!root.querySelector('[data-level-demo]').open)return;stop();simulation=true;const inputs=[root.querySelector('[data-demo-x]'),root.querySelector('[data-demo-y]')];if(inputs.some(input=>!input.value||!input.checkValidity())){axes=null;status.textContent='Simulation : saisissez deux angles entre −89° et 89°.';render();return;}axes={x:Number(inputs[0].value),y:Number(inputs[1].value)};status.textContent='SIMULATION — valeurs saisies, aucune mesure réelle.';render();}
 root.querySelector('[data-level-demo]').ontoggle=()=>{if(root.querySelector('[data-level-demo]').open)demo();else if(simulation){simulation=false;axes=null;zero={x:0,y:0};status.textContent='Activez les capteurs pour mesurer.';render();}};
 root.querySelectorAll('[data-demo-x],[data-demo-y]').forEach(input=>input.oninput=demo);
 root.addEventListener('close',()=>{stop();simulation=false;zero={x:0,y:0};root.querySelector('[data-level-demo]').open=false;});
 screen.orientation?.addEventListener('change',()=>{zero={x:0,y:0};axes=null;filter=null;if(root.open)render();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&active){stop();status.textContent='Mesure arrêtée en arrière-plan. Réactivez les capteurs.';}});
 render();return {root,open(){status.textContent='Activez les capteurs pour mesurer.';root.showModal();}};
}
