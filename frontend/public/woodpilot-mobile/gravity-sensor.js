export function createGravitySensor({onSample,onStatus,canRun}){
  let active=false,generation=0;
  function sample(event){if(active&&canRun())onSample(event.accelerationIncludingGravity);}
  function stop(){generation++;active=false;window.removeEventListener('devicemotion',sample);}
  return {stop,get active(){return active;},async start(){
    stop();const ticket=generation;
    if(!window.isSecureContext)throw new Error('Les capteurs nécessitent HTTPS sur téléphone.');
    if(!window.DeviceMotionEvent)throw new Error('Capteur de mouvement indisponible dans ce navigateur.');
    if(typeof DeviceMotionEvent.requestPermission==='function'&&await DeviceMotionEvent.requestPermission()!=='granted')throw new Error('Accès aux capteurs refusé. Autorisez-les puis réessayez.');
    if(ticket!==generation||!canRun())return false;
    active=true;window.addEventListener('devicemotion',sample);onStatus('En attente du capteur…');return true;
  }};
}
