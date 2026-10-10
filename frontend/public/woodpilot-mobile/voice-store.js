let opening;
function database(){
  if(!opening)opening=new Promise((resolve,reject)=>{
    const request=indexedDB.open('woodpilot-voice-notes',1);
    request.onupgradeneeded=()=>request.result.createObjectStore('notes',{keyPath:'id'});
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>{opening=null;reject(new Error('Le stockage des notes est indisponible.'));};
  });
  return opening;
}
async function transact(mode,action){
  const db=await database();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('notes',mode),request=action(tx.objectStore('notes'));let result;
    request.onsuccess=()=>result=request.result;
    tx.oncomplete=()=>resolve(result);
    tx.onabort=tx.onerror=()=>reject(new Error('Note non enregistrée : vérifiez l’espace disponible sur le téléphone.'));
  });
}
export const listVoiceNotes=()=>transact('readonly',store=>store.getAll());
export const saveVoiceNote=note=>transact('readwrite',store=>store.put(note));
export const deleteVoiceNote=id=>transact('readwrite',store=>store.delete(id));
