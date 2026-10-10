export function createLevelSound(){
  let context=null,enabled=false,lastTone=-Infinity;
  async function enable(){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw new Error('Son indisponible dans ce navigateur.');context??=new Audio();await context.resume();if(context.state!=='running')throw new Error('Le navigateur n’a pas activé le son.');enabled=true;lastTone=-Infinity;}
  function tone(now){if(!enabled||context?.state!=='running'||now-lastTone<2000)return;lastTone=now;const oscillator=context.createOscillator(),gain=context.createGain(),t=context.currentTime;oscillator.frequency.value=880;gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(.08,t+.015);gain.gain.linearRampToValueAtTime(0,t+.16);oscillator.connect(gain);gain.connect(context.destination);oscillator.start(t);oscillator.stop(t+.17);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};}
  return {enable,tone,disable(){enabled=false;},reset(){lastTone=-Infinity;},get enabled(){return enabled;}};
}
