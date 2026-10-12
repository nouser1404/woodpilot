import {levelAxes,levelReading} from './level-model.js';
import {stabilizeLevel,roundedLevel} from './level-feedback.js';
import {createLevelSound} from './level-sound.js';
export function createLevelTool(){
 const root=document.querySelector('#levelTool'),status=root.querySelector('[data-level-status]'),start=root.querySelector('[data-level-start]'),calibrate=root.querySelector('[data-level-calibrate]');
 let mode='level',axes=null,zero={x:0,y:0},filter=null,active=false,lastSample=0,timer,simulation=false;
 let feedback=null,filterTime=0,axis='both';
 const sound=createLevelSound(),soundButton=root.querySelector('[data-level-sound]');
 root.querySelector('.tool-header').after(start);
 const content=document.createElement('section');content.className='level-live-controls';
 const header=root.querySelector('.tool-header'),demoPanel=root.querySelector('[data-level-demo]');
 for(const node of [...root.children])if(node!==header&&node!==start&&node!==status&&node!==demoPanel&& !node.matches('.tool-help-popover'))content.append(node);
 const radar=content.querySelector('.technical-diagram'),readingCard=content.querySelector('.result-card');
 const settings=document.createElement('details');settings.innerHTML='<summary>Paramètres du niveau / aplomb</summary>';
 for(const node of [...content.children])if(![radar,readingCard,soundButton].includes(node))settings.append(node);
 content.append(radar,readingCard,soundButton,settings);root.append(content);root.append(demoPanel);
 const step=document.createElement('p');step.className='calculation-note';step.setAttribute('role','status');start.before(step);
 const soundIcon=document.createElement('span');soundIcon.className='level-sound-icon';soundIcon.setAttribute('aria-hidden','true');soundButton.prepend(soundIcon);soundButton.checked=true;

 const show=value=>roundedLevel(value).toLocaleString('fr-FR');
 soundButton.onclick=async()=>{soundButton.checked=!soundButton.checked;soundButton.disabled=true;try{if(!soundButton.checked)sound.disable();else await sound.enable();soundButton.checked=sound.enabled;root.querySelector('[data-level-sound-status]').textContent=sound.enabled?'Bips plus rapprochés en approchant du centre ; rapides et plus aigus une fois aligné.':'Son désactivé.';render();}catch(error){soundButton.checked=sound.enabled;status.textContent=error.message;}finally{soundButton.disabled=false;}};
 function chooseAxis(value){axis=value;feedback=null;sound.reset();root.querySelectorAll('[data-level-axis]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.levelAxis===axis)));root.querySelector('[data-level-axis-status]').textContent=axis==='both'?'Contrôle des deux axes. Touchez un axe du radar pour l’isoler.':axis==='horizontal'?'Axe horizontal uniquement : gauche / droite. Le dévers vertical est ignoré.':'Axe vertical uniquement : haut / bas. Le dévers horizontal est ignoré.';render();}
 root.querySelectorAll('[data-level-axis]').forEach(button=>{button.onclick=()=>chooseAxis(button.dataset.levelAxis);if(button.tagName.toLowerCase()==='g')button.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();chooseAxis(button.dataset.levelAxis);}};});
 function render(){
  content.hidden=!(active||simulation);
  step.textContent=active||simulation?'Étape 2 / 2 · Contrôler l’alignement':'Étape 1 / 2 · Activer le capteur';
  start.hidden=false;start.classList.toggle('is-active',active);start.setAttribute('aria-pressed',String(active));
  start.innerHTML=`<span class="material-symbols-rounded" aria-hidden="true">${active?'check':'close'}</span>${active?'Capteur actif':'Activer le capteur'}`;
  start.setAttribute('aria-label',active?'Arrêter le capteur':'Activer le capteur');
  soundButton.setAttribute('aria-pressed',String(soundButton.checked));soundButton.classList.toggle('is-active',soundButton.checked);soundIcon.innerHTML=`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4Z"/>${soundButton.checked?'<path d="M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/>':'<path d="m15 9 6 6m0-6-6 6"/>'}</svg>`;
  soundButton.setAttribute('aria-label',soundButton.checked?'Désactiver le son':'Activer le son');
  root.querySelector('[data-level-sound-status]').textContent=sound.enabled?'Son actif : les bips se rapprochent du centre. Alignement confirmé après stabilité.':soundButton.checked?'Son activé à la prochaine activation du capteur.':'Son désactivé.';
  const fresh=simulation||(active&&Date.now()-lastSample<2000);
  calibrate.disabled=!axes||!fresh;
  root.querySelector('[data-level-reset]').disabled=!zero.x&&!zero.y;
  root.querySelector('[data-level-reference]').textContent=zero.x||zero.y?'Référence personnalisée : zéro relatif calibré.':'Référence gravité : niveau / aplomb absolu.';
  const bubble=root.querySelector('[data-level-bubble]');bubble.toggleAttribute('hidden',!axes||!fresh);
  if(!axes||!fresh){feedback=null;sound.reset();root.querySelector('[data-level-angle]').textContent='—';root.querySelector('[data-level-offset]').textContent='Aucune mesure disponible';return;}
  const result=levelReading(axes,zero,axis);
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
   axes=levelAxes(filter,mode,screen.orientation?.angle??0);lastSample=Date.now();status.textContent='Capteurs actifs';render();
  }catch{status.textContent='Mesure du capteur indisponible.';}
 }
 start.onclick=async()=>{
  if(active){stop();sound.disable();status.textContent="Capteur arrêté.";return;}
  stop();simulation=false;root.querySelector('[data-level-demo]').open=false;
  if(!window.isSecureContext){status.textContent='Les capteurs nécessitent HTTPS sur téléphone.';return;}
  if(!window.DeviceMotionEvent){status.textContent='Ce navigateur ne propose pas de capteur de mouvement. La simulation reste disponible.';return;}
  try{start.disabled=true;
   const audioReady=soundButton.checked?sound.enable().catch(error=>{soundButton.checked=false;status.textContent=error.message;}):Promise.resolve();
   if(typeof DeviceMotionEvent.requestPermission==='function'&&await DeviceMotionEvent.requestPermission()!=='granted'){sound.disable();status.textContent='Accès aux capteurs refusé. Vous pouvez réessayer.';return;}
   if(!root.open){sound.disable();return;}await audioReady;if(!root.open){sound.disable();return;}active=true;render();zero={x:0,y:0};status.textContent='En attente du capteur…';window.addEventListener('devicemotion',sample);
   timer=setInterval(()=>{if(Date.now()-lastSample>2000)status.textContent='Aucune mesure récente. Vérifiez les capteurs et gardez le téléphone immobile.';render();},100);
  }catch{status.textContent='Accès aux capteurs impossible dans ce navigateur.';}finally{start.disabled=false;if(!active)sound.disable();render();}
 };
 root.querySelectorAll('[data-control-mode]').forEach(button=>button.onclick=()=>{mode=button.dataset.controlMode;root.querySelector('[data-level-mode]').dataset.mode=mode;root.querySelectorAll('[data-control-mode]').forEach(choice=>choice.setAttribute('aria-pressed',String(choice===button)));zero={x:0,y:0};axes=null;filter=null;root.querySelector('[data-level-instructions]').textContent=mode==='level'?'Posez le dos du téléphone à plat sur la surface.':'Placez le téléphone debout, son axe vertical parallèle à l’élément à contrôler.';if(simulation)demo();else render();root.querySelector('[data-level-mode]').dispatchEvent(new Event('change'));});
 calibrate.onclick=()=>{if(axes&&!calibrate.disabled){zero={...axes};feedback=null;render();}};
 root.querySelector('[data-level-reset]').onclick=()=>{zero={x:0,y:0};feedback=null;render();};
 function demo(){if(!root.querySelector('[data-level-demo]').open)return;stop();simulation=true;const inputs=[root.querySelector('[data-demo-x]'),root.querySelector('[data-demo-y]')];if(inputs.some(input=>!input.value||!input.checkValidity())){axes=null;status.textContent='Simulation : saisissez deux angles entre −89° et 89°.';render();return;}axes={x:Number(inputs[0].value),y:Number(inputs[1].value)};status.textContent='SIMULATION — valeurs saisies, aucune mesure réelle.';render();timer=setInterval(render,100);}
 root.querySelector('[data-level-demo]').ontoggle=()=>{if(root.querySelector('[data-level-demo]').open)demo();else if(simulation){simulation=false;stop();zero={x:0,y:0};status.textContent='Activez les capteurs pour mesurer.';render();}};
 root.querySelectorAll('[data-demo-x],[data-demo-y]').forEach(input=>input.oninput=demo);
 root.addEventListener('close',()=>{stop();sound.disable();soundButton.checked=true;root.querySelector('[data-level-sound-status]').textContent='Son activé à la prochaine activation du capteur.';simulation=false;zero={x:0,y:0};root.querySelector('[data-level-demo]').open=false;});
 screen.orientation?.addEventListener('change',()=>{zero={x:0,y:0};axes=null;filter=null;if(root.open)render();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&active){stop();sound.disable();status.textContent='Mesure arrêtée en arrière-plan. Réactivez les capteurs.';}});
 render();return {root,open(){status.textContent='Activez les capteurs pour mesurer.';root.showModal();render();}};
}
