import {inclination,slopeFromAngle,stableInclination,validateInclination} from './inclinometer-model.js';
import {createGravitySensor} from './gravity-sensor.js';
import {createLevelSound} from './level-sound.js';
export function createInclinometerTool({haptic}){
  const root=document.createElement('dialog');root.id='inclinometerTool';root.className='tool-dialog';root.setAttribute('aria-label','Inclinomètre');
  root.innerHTML=`<header class="tool-header"><h2>Inclinomètre</h2><button class="icon-btn" data-close aria-label="Fermer l’inclinomètre"><span class="material-symbols-rounded" aria-hidden="true">close</span></button></header><p>Mesure de la pente du plan de l’écran, de 0° (horizontal) à 90° (vertical), écran vers le haut ou vers le bas. Posez l’écran contre la surface à mesurer. Capture auto : activez le switch, vous avez 5 secondes pour placer le téléphone, puis gardez-le immobile pendant 2 secondes. La mesure reste figée quand vous relevez le téléphone. Les boutons de volume ne sont pas disponibles dans la PWA sur iPhone. Aucun zéro relatif : référence à la gravité.</p><div class="inclino-switches"><label class="tool-switch"><span>Capteurs</span><input data-sensors type="checkbox" role="switch" aria-label="Activer les capteurs de l’inclinomètre"><span class="switch-track" aria-hidden="true"></span></label><label class="tool-switch"><span>Son</span><input data-sound type="checkbox" role="switch" checked aria-label="Son de confirmation"><span class="switch-track" aria-hidden="true"></span></label></div><div class="result-card"><span data-result-label>Inclinaison en direct</span><strong data-angle>—</strong><span data-percent>—</span></div><label class="tool-switch"><span>Capture auto</span><input data-auto type="checkbox" role="switch" aria-label="Capture automatique après stabilisation" disabled><span class="switch-track" aria-hidden="true"></span></label><p data-status role="status" aria-live="polite">Activez les capteurs pour mesurer.</p><p data-error role="alert"></p><button data-capture class="primary-btn inclino-capture" disabled>Prendre la mesure</button><button data-new class="secondary-btn" disabled>Nouvelle mesure</button><div class="result-actions"><button data-save class="secondary-btn" disabled>Enregistrer</button><button data-share class="primary-btn" disabled>Partager</button></div>`;
  document.body.append(root);
  const sensors=root.querySelector('[data-sensors]'),auto=root.querySelector('[data-auto]'),soundSwitch=root.querySelector('[data-sound]'),status=root.querySelector('[data-status]'),error=root.querySelector('[data-error]'),capture=root.querySelector('[data-capture]');
  const sound=createLevelSound();let live=null,held=null,lastSample=0,filter=null,filterTime=0,stability=null,armedAt=null,timer;
  const sensor=createGravitySensor({canRun:()=>root.open&&!document.hidden,onStatus:text=>status.textContent=text,onSample:sample});
  const show=value=>value.toLocaleString('fr-FR',{maximumFractionDigits:1});
  const fresh=()=>sensor.active&&live!==null&&Date.now()-lastSample<1000;
  function render(){
    const result=held?slopeFromAngle(held.angle):fresh()?slopeFromAngle(live):null;
    root.querySelector('[data-angle]').textContent=result?`${show(result.angle)}°`:'—';
    root.querySelector('[data-percent]').textContent=result?(result.percent===null?'Pente verticale':`${show(result.percent)} %`):'Aucune mesure récente';
    root.querySelector('[data-result-label]').textContent=held?'Mesure mémorisée':'Inclinaison en direct';
    capture.disabled=!fresh()||!!held;auto.disabled=!sensor.active||!!held;
    root.querySelector('[data-new]').disabled=!held;
    root.querySelectorAll('[data-save],[data-share]').forEach(button=>button.disabled=!held);
  }
  function cancelAuto(){auto.checked=false;armedAt=null;stability=null;}
  function take(angle=live){
    if(!fresh()||held)return;
    held={angle,measuredAt:new Date().toISOString()};cancelAuto();
    status.textContent='Mesure mémorisée. Vous pouvez relever le téléphone.';
    if(soundSwitch.checked){sound.reset();sound.tone(Date.now(),0,true);}haptic();render();
  }
  function sample(gravity){
    if(held)return;
    try{
      const now=Date.now(),raw=inclination(gravity),weight=filterTime?1-Math.exp(-Math.min(1000,now-filterTime)/250):1;
      filter=filter===null?raw:filter*(1-weight)+raw*weight;filterTime=now;live=filter;lastSample=now;
      if(armedAt!==null&&now-armedAt>=5000){stability=stableInclination(stability,gravity,now);status.textContent='Gardez le téléphone immobile…';if(stability.stable){take(stability.angle);return;}}
      else if(armedAt===null)status.textContent='Capteurs actifs';
      render();
    }catch(reason){stability=null;live=null;filter=null;filterTime=0;status.textContent=reason.message;render();}
  }
  function tick(){
    if(held)return;
    if(armedAt!==null&&Date.now()-armedAt<5000)status.textContent=`Placez le téléphone : ${Math.ceil((5000-Date.now()+armedAt)/1000)} s`;
    else if(!fresh()){stability=null;status.textContent='Aucune mesure récente. Vérifiez les capteurs.';}
    render();
  }
  function stop(){sensor.stop();sensors.checked=false;clearInterval(timer);cancelAuto();live=null;filter=null;filterTime=0;sound.silence();render();}
  async function unlockSound(){if(soundSwitch.checked&&!sound.enabled)try{await sound.enable();}catch(reason){soundSwitch.checked=false;error.textContent=reason.message;}}
  sensors.onchange=async()=>{
    if(!sensors.checked){stop();status.textContent=held?'Mesure mémorisée.':'Capteurs désactivés.';return;}
    error.textContent='';sensors.disabled=true;unlockSound();
    try{const started=await sensor.start();sensors.checked=started; if(started){filter=null;filterTime=0;live=null;timer=setInterval(tick,100);}}
    catch(reason){sensors.checked=false;error.textContent=reason.message;}finally{sensors.disabled=false;render();}
  };
  soundSwitch.onchange=()=>{if(soundSwitch.checked)unlockSound();else sound.disable();};
  auto.onchange=()=>{if(auto.checked){armedAt=Date.now();stability=null;unlockSound();tick();}else{cancelAuto();status.textContent='Capture automatique annulée.';}};
  capture.onclick=()=>take();
  root.querySelector('[data-new]').onclick=()=>{held=null;live=null;filter=null;filterTime=0;stability=null;status.textContent=sensor.active?'Replacez le téléphone pour une nouvelle mesure.':'Activez les capteurs pour mesurer.';render();};
  root.addEventListener('close',()=>{stop();sound.disable();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();status.textContent=held?'Mesure mémorisée.':'Mesure suspendue. Réactivez les capteurs.';}});
  window.addEventListener('pagehide',stop);
  return {root,open(){root.showModal();render();},snapshot(){if(!held)throw new Error('Prenez une mesure avant de l’enregistrer.');return {...held};},load(data){validateInclination(data);stop();held={...data};status.textContent='Mesure enregistrée restaurée.';render();},text(){const data=this.snapshot(),result=slopeFromAngle(data.angle);return `WoodPilot — Inclinomètre\nAngle : ${show(result.angle)}°\nPente : ${result.percent===null?'verticale':show(result.percent)+' %'}\nMesuré le ${new Date(data.measuredAt).toLocaleString('fr-FR')}\nPlan de l’écran · référence gravité · vérifier avant fabrication`;}};
}
