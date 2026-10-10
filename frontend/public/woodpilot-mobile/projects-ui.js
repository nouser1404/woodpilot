import { prepareOffcutImport } from './offcuts.js';
import { editText } from './text-input.js';
import { listProjects,newProject,putProject,getProject,saveEntry,trashProject,restoreProject,listOffcuts,importWorkspace } from './project-store.js';
import { downloadBlob } from './export-result.js';
export function createProjectsUI({tools,openTool,notify}) {
  const root=document.querySelector('[data-view="projects"]'),list=root.querySelector('[data-project-list]');
  const detail=document.querySelector('#projectDetail'),saveSheet=document.querySelector('#saveSheet'),nameSheet=document.querySelector('#projectNameSheet');
  let currentId=null,savingTool=null,entrySnapshot=null;
  const button=(text,action,className='secondary-btn')=>{const item=document.createElement('button');item.type='button';item.className=className;item.textContent=text;item.onclick=async()=>{try{await action();}catch(error){notify(error.message);}};return item;};
  async function render() {
    try {
      const projects=await listProjects();list.replaceChildren();
      const active=projects.filter(p=>!p.deletedAt).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
      if(!active.length){const p=document.createElement('p');p.className='empty-state';p.textContent='Créez un dossier pour conserver vos calculs et photos métrées. Les outils fonctionnent aussi sans dossier.';list.append(p);}
      active.forEach(project=>{
        const row=button('',()=>showProject(project.id),'project-card');
        const title=document.createElement('strong');title.textContent=project.name;
        const subtitle=document.createElement('span');subtitle.textContent=`${project.entries.filter(e=>!e.deletedAt).length} résultat(s)`;row.append(title,subtitle);list.append(row);
      });
      const trash=root.querySelector('[data-trash-list]');trash.replaceChildren();
      projects.filter(p=>p.deletedAt).forEach(project=>trash.append(button(`Restaurer ${project.name}`,async()=>{await restoreProject(project.id);await render();})));
      root.querySelector('[data-project-storage]').textContent='Enregistré sur cet appareil. Exportez une sauvegarde pour conserver une copie.';
    }catch(error){root.querySelector('[data-project-storage]').textContent=error.message;}
  }
  async function askName(onSubmit,initial='') {
    const input=nameSheet.querySelector('input');input.value=initial;nameSheet.querySelector('[role="alert"]').textContent='';
    nameSheet.querySelector('form').onsubmit=async event=>{
      event.preventDefault();const submit=nameSheet.querySelector('[type="submit"]');submit.disabled=true;
      try {const valid=newProject(input.value);await onSubmit(valid.name);nameSheet.close();await render();}
      catch(error){nameSheet.querySelector('[role="alert"]').textContent=error.message;}finally{submit.disabled=false;}
    };
    nameSheet.showModal();input.focus();
  }
  root.querySelector('[data-new-project]').onclick=()=>askName(async name=>putProject(newProject(name)));
  async function showProject(id) {
    currentId=id;const project=await getProject(id);if(!project||project.deletedAt)throw new Error('Projet indisponible.');
    detail.querySelector('h2').textContent=project.name;detail.querySelector('[data-project-notes]').textContent=project.notes||'Aucune note technique.';
    const entries=detail.querySelector('[data-entries]');entries.replaceChildren();
    if(!project.entries.some(e=>!e.deletedAt))entries.textContent='Aucun résultat enregistré. Ouvrez un outil et choisissez « Enregistrer ». ';
    project.entries.filter(e=>!e.deletedAt).forEach(entry=>{
      const row=document.createElement('article');row.className='saved-entry';
      const date=new Date(entry.createdAt).toLocaleString('fr-FR');
      row.append(button(`${entry.title} · ${date}`,async()=>{const tool=tools[entry.toolId];if(!tool)throw new Error('Outil indisponible.');await tool.load(entry.data);tool.setProjectName?.(project.name);detail.close();openTool(entry.toolId);}),
        button('Dupliquer',async()=>{await saveEntry(id,{toolId:entry.toolId,title:entry.title,data:entry.data});await showProject(id);}),
        button('Retirer',async()=>{const latest=await getProject(id);const target=latest.entries.find(e=>e.id===entry.id);target.deletedAt=new Date().toISOString();await putProject(latest);await showProject(id);await render();}));
      entries.append(row);
    });
    const restore=detail.querySelector('[data-restore-entries]');restore.replaceChildren();
    project.entries.filter(e=>e.deletedAt).forEach(entry=>restore.append(button(`Restaurer ${entry.title}`,async()=>{const latest=await getProject(id);delete latest.entries.find(e=>e.id===entry.id).deletedAt;await putProject(latest);await showProject(id);await render();})));
    if(!detail.open)detail.showModal();
  }
  detail.querySelector('[data-edit-notes]').onclick=async()=>{try{const project=await getProject(currentId);editText({title:'Notes techniques du projet',value:project.notes||'',maxLength:10000,onConfirm:async notes=>{const latest=await getProject(currentId);latest.notes=notes;await putProject(latest);await showProject(currentId);}});}catch(reason){notify(reason.message);}};
  detail.querySelector('[data-rename-project]').onclick=()=>askName(async name=>{const project=await getProject(currentId);project.name=name;await putProject(project);await showProject(currentId);},detail.querySelector('h2').textContent);
  detail.querySelector('[data-delete-project]').onclick=async()=>{try{await trashProject(currentId);detail.close();await render();notify('Projet déplacé dans la corbeille.');}catch(error){notify(error.message);}};
  root.querySelector('[data-backup]').onclick=async()=>{
    try{downloadBlob(new Blob([JSON.stringify({format:'woodpilot-tools',version:1,projects:await listProjects(),offcuts:await listOffcuts()},null,2)],{type:'application/json'}),'woodpilot-sauvegarde.json');notify('Sauvegarde téléchargée.');}catch(error){notify(error.message);}
  };
  root.querySelector('[data-import-backup]').onchange=async event=>{
    try {
      const file=event.target.files[0];if(!file)return;if(file.size>50000000)throw new Error('Sauvegarde trop volumineuse (maximum 50 Mo).');
      const backup=JSON.parse(await file.text());
      if(backup.format!=='woodpilot-tools'||backup.version!==1||!Array.isArray(backup.projects)||backup.projects.length>1000)throw new Error('Format de sauvegarde invalide.');
      // Tout valider avant l'écriture ; les imports créent de nouvelles copies.
      const prepared=[];
      for(const project of backup.projects) {
        const next=newProject(project.name);if(project.notes!==undefined&&(typeof project.notes!=='string'||project.notes.length>10000))throw new Error('Notes de projet invalides.');next.notes=project.notes||'';if(!Array.isArray(project.entries)||project.entries.length>1000)throw new Error('Liste de résultats invalide.');
        for(const entry of project.entries){const tool=tools[entry.toolId];if(!tool)throw new Error('Outil inconnu dans la sauvegarde.');tool.validate(entry.data);next.entries.push({id:crypto.randomUUID(),toolId:entry.toolId,title:tool.title,data:entry.data,createdAt:new Date().toISOString()});}
        if(project.deletedAt)next.deletedAt=new Date().toISOString();
        project.entries.forEach((entry,index)=>{if(entry.deletedAt)next.entries[index].deletedAt=new Date().toISOString();});
        prepared.push(next);
      }
      if(backup.offcuts!==undefined&&(!Array.isArray(backup.offcuts)||backup.offcuts.length>1000))throw new Error('Liste de chutes invalide.');
      const incoming=backup.offcuts||[],offcuts=prepareOffcutImport(incoming,await listOffcuts());
      await importWorkspace(prepared,offcuts);
      await render();notify('Sauvegarde importée dans de nouveaux dossiers.');
    }catch(error){notify(error.message);}finally{event.target.value='';}
  };
  async function save(tool) {
    try {
      entrySnapshot=structuredClone(tool.snapshot());savingTool=tool;
      const projects=(await listProjects()).filter(p=>!p.deletedAt),choices=saveSheet.querySelector('[data-project-choices]');choices.replaceChildren();
      projects.forEach(project=>choices.append(button(project.name,()=>finishSave(project.id))));
      saveSheet.showModal();
    }catch(error){notify(error.message);}
  }
  async function finishSave(id) {
    if(savingTool.id==='cutlist'&&!entrySnapshot.projectName){const project=await getProject(id);entrySnapshot.projectName=project.name;savingTool.setProjectName?.(project.name);}
    await saveEntry(id,{toolId:savingTool.id,title:savingTool.title,data:entrySnapshot});saveSheet.close();await render();notify('Résultat enregistré sur cet appareil.');
  }
  saveSheet.querySelector('[data-create-and-save]').onclick=()=>askName(async name=>{const project=newProject(name);await putProject(project);await finishSave(project.id);});
  render();
  return {save,render};
}
