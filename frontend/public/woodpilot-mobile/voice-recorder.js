export function createVoiceRecorder({getStream,Recorder,onState=()=>{},onClip=()=>{},onError=()=>{},now=()=>Date.now()}) {
  let recorder=null,stream=null,generation=0,state='idle',started=0;
  const change=value=>{state=value;onState(value);};
  const release=()=>{stream?.getTracks().forEach(track=>track.stop());stream=null;};
  return {
    get state(){return state;},
    async start(){
      if(state!=='idle')return;
      const ticket=++generation;change('requesting');
      try {
        const next=await getStream();
        if(ticket!==generation){next.getTracks().forEach(track=>track.stop());return;}
        stream=next;
        const mime=['audio/mp4','audio/webm;codecs=opus','audio/webm'].find(type=>Recorder.isTypeSupported?.(type));
        const active=new Recorder(stream,mime?{mimeType:mime}:{}),chunks=[];let failure=false;
        recorder=active;
        active.ondataavailable=event=>{if(event.data?.size)chunks.push(event.data);};
        active.onerror=()=>{failure=true;onError(new Error('Enregistrement interrompu par le navigateur.'));};
        active.onstop=()=>{
          const duration=Math.max(0,(now()-started)/1000);release();recorder=null;change('idle');
          const blob=new Blob(chunks,{type:active.mimeType||chunks[0]?.type||'audio/mp4'});
          if(blob.size)onClip({blob,duration});else if(!failure)onError(new Error('Aucun son enregistré. Réessayez.'));
        };
        active.start(1000);started=now();change('recording');
      } catch(error){if(ticket!==generation)return;release();recorder=null;change('idle');onError(error);}
    },
    stop(){
      if(state==='requesting'){generation++;change('idle');return;}
      if(recorder?.state==='recording'){change('stopping');recorder.stop();release();}
    }
  };
}
