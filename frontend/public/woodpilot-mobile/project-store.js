const DB='woodpilot-tools-v1';
let opening;
function openStore() {
  if(!opening) opening=new Promise((resolve,reject)=>{
    const request=indexedDB.open(DB,2);
    request.onupgradeneeded=()=>{for(const name of ['projects','offcuts'])if(!request.result.objectStoreNames.contains(name))request.result.createObjectStore(name,{keyPath:'id'});};
    request.onsuccess=()=>{request.result.onversionchange=()=>{request.result.close();opening=null;};resolve(request.result);};
    request.onblocked=()=>{opening=null;reject(new Error('Fermez les autres onglets WoodPilot pour mettre à jour le stockage.'));};
    request.onerror=()=>{opening=null;reject(new Error('Le stockage local est indisponible.'));};
  });
  return opening;
}
async function transaction(mode,action,storeName='projects') {
  const db=await openStore();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(storeName,mode),store=tx.objectStore(storeName);let result;
    const request=action(store);if(request)request.onsuccess=()=>result=request.result;
    tx.oncomplete=()=>resolve(result);
    tx.onerror=()=>reject(new Error('Enregistrement impossible. Vérifiez l’espace disponible sur cet appareil.'));
    tx.onabort=tx.onerror;
  });
}
export const listProjects=()=>transaction('readonly',store=>store.getAll());
export const putProjects=projects=>transaction('readwrite',store=>{projects.forEach(project=>store.put(project));});
export const getProject=id=>transaction('readonly',store=>store.get(id));
export const putProject=project=>transaction('readwrite',store=>store.put(project));
export function newProject(name) {
  const trimmed=String(name).trim();if(!trimmed || trimmed.length>80)throw new RangeError('Nom de projet : 1 à 80 caractères.');
  return {id:crypto.randomUUID(),name:trimmed,createdAt:new Date().toISOString(),entries:[]};
}
export async function saveEntry(projectId,entry) {
  // Lecture et écriture dans une même transaction pour conserver les ajouts concurrents.
  const db=await openStore();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('projects','readwrite'),store=tx.objectStore('projects');
    const request=store.get(projectId);
    request.onsuccess=()=>{
      const project=request.result;
      if(!project){tx.abort();return;}
      project.entries.push({...entry,id:crypto.randomUUID(),createdAt:new Date().toISOString()});store.put(project);
    };
    tx.oncomplete=resolve;
    tx.onerror=tx.onabort=()=>reject(new Error('Le résultat n’a pas été enregistré.'));
  });
}
export async function trashProject(id) {
  const project=await getProject(id);if(!project)return;
  project.deletedAt=new Date().toISOString();await putProject(project);
}
export async function restoreProject(id) {
  const project=await getProject(id);if(!project)return;
  delete project.deletedAt;await putProject(project);
}

export const listOffcuts=()=>transaction('readonly',store=>store.getAll(),'offcuts');
export const putOffcut=offcut=>transaction('readwrite',store=>store.put(offcut),'offcuts');
export async function importWorkspace(projects,offcuts){const db=await openStore();return new Promise((resolve,reject)=>{const tx=db.transaction(['projects','offcuts'],'readwrite');projects.forEach(value=>tx.objectStore('projects').put(value));offcuts.forEach(value=>tx.objectStore('offcuts').put(value));tx.oncomplete=resolve;tx.onerror=tx.onabort=()=>reject(new Error('Import annulé : stockage indisponible.'));});}
