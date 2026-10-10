import {createVoiceRecorder} from './voice-recorder.js';
import {listVoiceNotes,saveVoiceNote,deleteVoiceNote} from './voice-store.js';
import {downloadBlob} from './export-result.js';
const time=seconds=>`${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;
export function createVoiceTool({notify}){
  const root=document.createElement('dialog');root.id='voiceTool';root.className='tool-dialog';root.setAttribute('aria-label','Notes vocales');
  root.innerHTML=`<header class="tool-header"><h2>Notes vocales</h2><button class="icon-btn" data-close aria-label="Fermer les notes vocales"><span class="material-symbols-rounded" aria-hidden="true">close</span></button></header><p>Enregistrez un rappel de chantier. Les notes restent sur cet appareil, sans envoi sur un serveur ni notification programmée. Fermer l’outil ou quitter l’app arrête l’enregistrement. Maximum : 5 minutes par note.</p><label class="field-label">Titre / chantier (facultatif)<input data-title maxlength="80" placeholder="Ex. Acheter les charnières"></label><button data-record class="primary-btn voice-record">Enregistrer un rappel</button><div data-status role="status" aria-live="polite"></div><output data-timer aria-label="Durée de l’enregistrement">0:00</output><p data-error role="alert"></p><section data-draft hidden><strong>Note à conserver</strong><audio controls data-preview></audio><button data-retry class="primary-btn">Réessayer l’enregistrement de la note</button><button data-download class="secondary-btn">Télécharger la note</button></section><section data-notes aria-label="Mes rappels"></section>`;
  document.body.append(root);
  const record=root.querySelector('[data-record]'),status=root.querySelector('[data-status]'),error=root.querySelector('[data-error]'),title=root.querySelector('[data-title]'),timer=root.querySelector('[data-timer]'),draftPanel=root.querySelector('[data-draft]');
  let interval,started=0,draft=null,pendingTitle='',urls=[],previewURL=null,saving=false,revision=0;
  const revoke=()=>{urls.forEach(url=>URL.revokeObjectURL(url));urls=[];};
  const recorder=createVoiceRecorder({
    getStream:()=>navigator.mediaDevices.getUserMedia({audio:true}),Recorder:globalThis.MediaRecorder,
    onState(state){
      clearInterval(interval);record.disabled=state==='requesting'||state==='stopping'||saving||!!draft;
      record.textContent=state==='recording'?'Arrêter et conserver':state==='requesting'?'Autorisation du micro…':state==='stopping'?'Fin de l’enregistrement…':'Enregistrer un rappel';
      record.classList.toggle('recording',state==='recording');
      status.textContent=state==='recording'?'Enregistrement en cours':state==='requesting'?'Autorisez le microphone pour commencer.':'';
      title.disabled=state!=='idle';
      if(state==='recording'){started=Date.now();timer.textContent='0:00';interval=setInterval(()=>{const duration=(Date.now()-started)/1000;timer.textContent=time(duration);if(duration>=300)recorder.stop();},250);}
    },
    onError(reason){error.textContent=reason.name==='NotAllowedError'?'Microphone refusé. Autorisez-le dans les réglages du navigateur puis réessayez.':reason.name==='NotFoundError'?'Aucun microphone disponible.':reason.message||'Impossible d’accéder au microphone.';},
    onClip(clip){draft={id:crypto.randomUUID(),createdAt:new Date().toISOString(),title:pendingTitle||'Rappel de chantier',done:false,...clip};persistDraft();}
  });
  async function persistDraft(){
    if(!draft||saving)return;saving=true;record.disabled=true;root.querySelector('[data-retry]').disabled=true;
    try{await saveVoiceNote(draft);draft=null;title.value='';draftPanel.hidden=true;if(previewURL){URL.revokeObjectURL(previewURL);previewURL=null;}error.textContent='';status.textContent='Rappel conservé sur cet appareil.';await render();}
    catch(reason){error.textContent=reason.message;draftPanel.hidden=false;if(!previewURL){previewURL=URL.createObjectURL(draft.blob);root.querySelector('[data-preview]').src=previewURL;}}
    finally{saving=false;root.querySelector('[data-retry]').disabled=false;record.disabled=!!draft;}
  }
  function download(note){downloadBlob(note.blob,`woodpilot-note-${note.id}.${note.blob.type.includes('mp4')?'m4a':'webm'}`);}
  async function render(){
    const ticket=++revision;
    try{
      const notes=await listVoiceNotes();if(ticket!==revision)return;revoke();const list=root.querySelector('[data-notes]');list.replaceChildren();
      if(!notes.length){list.textContent='Aucun rappel pour le moment.';return;}
      for(const note of notes.sort((a,b)=>b.createdAt.localeCompare(a.createdAt))){
        const card=document.createElement('article');card.className='voice-note';
        const heading=document.createElement('strong');heading.textContent=note.title;
        const date=document.createElement('small');date.textContent=new Date(note.createdAt).toLocaleString('fr-FR')+' · '+time(note.duration);
        const audio=document.createElement('audio');audio.controls=true;audio.preload='none';const url=URL.createObjectURL(note.blob);urls.push(url);audio.src=url;
        audio.onplay=()=>root.querySelectorAll('audio').forEach(other=>{if(other!==audio)other.pause();});
        const done=document.createElement('label');done.className='tool-switch';const text=document.createElement('span');text.textContent='Traité';const input=document.createElement('input');input.type='checkbox';input.setAttribute('role','switch');input.setAttribute('aria-label',`Rappel traité : ${note.title}`);input.checked=note.done;const track=document.createElement('span');track.className='switch-track';track.setAttribute('aria-hidden','true');done.append(text,input,track);
        input.onchange=async()=>{input.disabled=true;try{await saveVoiceNote({...note,done:input.checked});note.done=input.checked;}catch(reason){input.checked=note.done;error.textContent=reason.message;}finally{input.disabled=false;}};
        const actions=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Actions';
        const exportButton=document.createElement('button');exportButton.className='secondary-btn';exportButton.textContent='Télécharger';exportButton.onclick=()=>download(note);
        const remove=document.createElement('button');remove.className='secondary-btn';remove.textContent='Supprimer';remove.onclick=async()=>{if(!confirm('Supprimer ce rappel vocal ?'))return;try{await deleteVoiceNote(note.id);await render();}catch(reason){error.textContent=reason.message;}};
        actions.append(summary,exportButton,remove);card.append(heading,date,audio,done,actions);list.append(card);
      }
    }catch(reason){error.textContent=reason.message;}
  }
  record.onclick=()=>{
    error.textContent='';if(recorder.state==='recording'){recorder.stop();return;}
    root.querySelectorAll('audio').forEach(audio=>audio.pause());pendingTitle=title.value.trim();recorder.start();
  };
  root.querySelector('[data-retry]').onclick=persistDraft;root.querySelector('[data-download]').onclick=()=>draft&&download(draft);
  function suspend(){recorder.stop();root.querySelectorAll('audio').forEach(audio=>audio.pause());}
  root.addEventListener('close',suspend);document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend();});window.addEventListener('pagehide',suspend);
  return {root,open(){root.showModal();if(!globalThis.MediaRecorder||!navigator.mediaDevices?.getUserMedia){record.disabled=true;error.textContent='Microphone indisponible. Ouvrez l’app en HTTPS ou sur localhost dans un navigateur récent.';}render();}};
}
