// Cadence is based on the unrounded angular distance from the centre.
export function levelBeepInterval(angle,aligned=false){
  if(!Number.isFinite(angle)||angle<0)return null;
  if(aligned)return 250;
  return 350+Math.min(angle,10)/10*1650;
}
export function createLevelSound({getAudio=()=>window.AudioContext||window.webkitAudioContext,getSession=()=>globalThis.navigator?.audioSession}={}){
  let context=null,enabled=false,lastTone=-Infinity,generation=0;
  const playing=new Set();let session=null,previousType=null;
  function restoreSession(){if(session&&previousType!==null){try{session.type=previousType;}catch{}}session=null;previousType=null;}
  function beep(aligned=false){
    if(!enabled||context?.state!=='running')return false;
    const oscillator=context.createOscillator(),gain=context.createGain(),t=context.currentTime;
    oscillator.frequency.value=aligned?1200:900;
    gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(.22,t+.01);gain.gain.setValueAtTime(.22,t+.065);gain.gain.linearRampToValueAtTime(0,t+.09);
    oscillator.connect(gain);gain.connect(context.destination);playing.add(oscillator);
    oscillator.onended=()=>{playing.delete(oscillator);oscillator.disconnect();gain.disconnect();};
    oscillator.start(t);oscillator.stop(t+.1);return true;
  }
  async function enable(){
    const id=++generation,Audio=getAudio();
    if(!Audio)throw new Error('Son indisponible dans ce navigateur.');
    try{const candidate=getSession();if(candidate&&!session){session=candidate;previousType=session.type;session.type='playback';}}catch{restoreSession();}
    if(!context||context.state==='closed')context=new Audio();
    // Resume must begin directly inside the button's user gesture (mobile browsers).
    try{await context.resume();}catch(error){restoreSession();throw error;}
    if(id!==generation)return;
    if(context.state!=='running'){restoreSession();throw new Error('Le navigateur n’a pas activé le son.');}
    enabled=true;lastTone=-Infinity;
    beep(); // Audible confirmation even when no sensor measurement is available.
  }
  function tone(now,angle,aligned=false){
    const interval=levelBeepInterval(angle,aligned);
    if(interval===null||!enabled||now-lastTone<interval)return;
    if(beep(aligned))lastTone=now;
  }
  function silence(){for(const oscillator of playing){try{oscillator.stop();}catch{}}playing.clear();}
  return {enable,tone,disable(){generation++;enabled=false;silence();restoreSession();},silence,reset(){lastTone=-Infinity;},get enabled(){return enabled;}};
}
