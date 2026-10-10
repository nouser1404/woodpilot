// A visible app owns at most one screen lock; background pages release it.
export function keepScreenAwake({doc=document,nav=navigator,win=window,onStatus=()=>{}}={}) {
  let lock=null,pending=false,stopped=false,suspended=false;
  const supported=typeof nav.wakeLock?.request==='function';
  async function acquire(){
    if(stopped||suspended||doc.visibilityState!=='visible'||pending||lock&&!lock.released)return;
    if(!supported){onStatus('unsupported');return;}
    pending=true;
    try{
      const next=await nav.wakeLock.request('screen');
      if(stopped||suspended||doc.visibilityState!=='visible'){await next.release();return;}
      lock=next;
      next.addEventListener('release',()=>{if(lock===next){lock=null;onStatus('released');}});
      onStatus('active');
    }catch{onStatus('unavailable');}finally{pending=false;}
  }
  function release(){const previous=lock;lock=null;if(previous)Promise.resolve(previous.release()).catch(()=>{});}
  function visibility(){if(doc.visibilityState==='visible')void acquire();else release();}
  function hide(){suspended=true;release();}
  function show(){suspended=false;void acquire();}
  doc.addEventListener('visibilitychange',visibility);
  doc.addEventListener('pointerdown',acquire,{passive:true});
  doc.addEventListener('keydown',acquire);
  win.addEventListener('pagehide',hide);
  win.addEventListener('pageshow',show);
  void acquire();
  return {dispose(){stopped=true;release();doc.removeEventListener('visibilitychange',visibility);doc.removeEventListener('pointerdown',acquire);doc.removeEventListener('keydown',acquire);win.removeEventListener('pagehide',hide);win.removeEventListener('pageshow',show);}};
}
