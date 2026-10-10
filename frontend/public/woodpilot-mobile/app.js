import { keepScreenAwake } from './screen-awake.js';
import { createHelixTool } from './helix-tool.js';
import { calculateHelix } from './helix.js';
import { createTriangleTool } from './triangle-tool.js';
import { calculateTriangle } from './triangle.js';
import { createLevelTool } from './level-tool.js';
import { createOffcutsTool,validateOffcutsSnapshot } from './offcuts-tool.js';
import { createFavouritesEditor } from './favourites.js';
import { createBendingTool } from './bending-tool.js';
import { createSlopeTool } from './slope-tool.js';
import { createAnglesTool } from './angles-tool.js';
import { createSpacingTool } from './spacing-tool.js';
import { createPhotoTool } from './photo-tool.js';
import { createAretiersTool } from './aretiers-tool.js';
import { createCabinetTool } from './cabinet-tool.js';
import { createCutListTool } from './cutlist-tool.js';
import { createProjectsUI } from './projects-ui.js';
import { bindResultActions,downloadBlob } from './export-result.js';
import { calculateBending } from './cintrage.js';
import { calculateSlope } from './slope.js';
import { calculateMiter,calculateSpacing } from './calculators.js';
import { calculateAretiers } from './aretiers.js';
import { validatePhoto } from './photo-model.js';
import { generateCabinet,validateCutList } from './manufacturing.js';
const catalog=[
  {id:'helix',name:'Hélicoïdale',icon:'line_curve',desc:'Longueur développée d’une hélice à pas constant.',cat:'CALCULER'},
  {id:'triangle',name:'Pythagore / Trigonométrie',icon:'square_foot',desc:'Calculer les côtés et angles d’un triangle rectangle.',cat:'CALCULER'},
  {id:'level',name:'Niveau / Aplomb',icon:'straighten',desc:'Contrôler le niveau et l’aplomb avec le téléphone.',cat:'MÉTRER'},
  {id:'photo',name:'Photo Métré',icon:'photo_camera',desc:'Coter une photo sur chantier.',cat:'MÉTRER'},
  {id:'aretiers',name:'Arêtiers',icon:'architecture',desc:'Pyramides, corroyage et gabarits de faces.',cat:'CALCULER'},
  {id:'nesting',name:'Calpinage',icon:'grid_view',desc:'Placer vos pièces sur les panneaux.',cat:'FABRIQUER'},
  {id:'bending',name:'Cintrage',icon:'line_curve',desc:'Rayon, corde, flèche et longueur d’arc.',cat:'CALCULER'},
  {id:'angles',name:'Angles',icon:'square_foot',desc:'Onglets égaux pour un assemblage plan.',cat:'CALCULER'},
  {id:'spacing',name:'Répartition',icon:'splitscreen',desc:'Espaces, entraxes et positions des axes.',cat:'FABRIQUER'},
  {id:'cabinet',name:'Caisson',icon:'inventory_2',desc:'Un caisson simple et sa liste de pièces.',cat:'CONCEVOIR'},
  {id:'slope',name:'Pente / Diagonale',icon:'show_chart',desc:'Pente, diagonale et contrôle d’équerrage.',cat:'CALCULER'},
  {id:'offcuts',name:'Chutes',icon:'grid_view',desc:'Conserver et réutiliser des panneaux restants.',cat:'FABRIQUER'},
  {id:'cutlist',name:'Liste de débit',icon:'straighten',desc:'Pièces, quantités et export CSV.',cat:'FABRIQUER'},
];
let toastTimer;
function notify(message) {const toast=document.querySelector('#toast');const dialogs=[...document.querySelectorAll('dialog[open]')];(dialogs.at(-1)||document.body).append(toast);toast.textContent=message;toast.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.hidden=true,5000);}
const haptic=(ms=8)=>{try{navigator.vibrate?.(ms);}catch{}};
async function share(data) {
  try {if(navigator.share){await navigator.share(data);return;}if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(data.text);notify('Résultat copié.');return;}}
  catch(error){if(error.name==='AbortError')return;}
  downloadBlob(new Blob([data.text],{type:'text/plain;charset=utf-8'}),'woodpilot-resultat.txt');notify('Résultat téléchargé.');
}
const controllers={
  level:createLevelTool(),helix:createHelixTool({haptic}),triangle:createTriangleTool({haptic}),
  bending:createBendingTool({haptic}),slope:createSlopeTool({haptic}),angles:createAnglesTool({haptic}),
  spacing:createSpacingTool({haptic}),photo:createPhotoTool({notify,haptic,transfer(dimensions){controllers.cabinet.applyDimensions(dimensions);controllers.photo.root.close();openTool('cabinet');}}),aretiers:createAretiersTool({haptic,notify}),
  cutlist:createCutListTool({notify,haptic}),
};
controllers.offcuts=createOffcutsTool({notify,transfer(item){controllers.cutlist.reuseOffcut(item);controllers.offcuts.root.close();openTool('cutlist');}});
controllers.cabinet=createCabinetTool({notify,haptic,transfer(pieces){
  if(controllers.cutlist.hasPieces()&&!confirm('Remplacer la liste de débit actuelle ? Enregistrez-la dans un projet pour la conserver.'))return;
  controllers.cutlist.replacePieces(pieces);controllers.cabinet.root.close();openTool('cutlist');
}});
const validators={helix:calculateHelix,triangle:calculateTriangle,offcuts:validateOffcutsSnapshot,bending:d=>calculateBending(d.chord,d.sagitta),slope:d=>calculateSlope(d.run,d.rise),angles:d=>calculateMiter(d.angle),spacing:d=>calculateSpacing(d.length,d.width,d.count,d.endGaps),photo:validatePhoto,aretiers:calculateAretiers,cabinet:generateCabinet,cutlist:validateCutList};
let opener;
function openTool(id){opener=document.activeElement;controllers[id==='nesting'?'cutlist':id]?.open();}
const projects=createProjectsUI({tools:controllers,openTool,notify});
Object.entries(controllers).forEach(([id,tool])=>{
  tool.id=id;tool.title=id==='cutlist'?'Débit / Calpinage':catalog.find(item=>item.id===id).name;tool.validate=data=>{if(!data||typeof data!=='object')throw new Error('Résultat invalide.');return validators[id](data);};
  if(id!=='level')bindResultActions(tool,{save:projects.save,share,notify});
  tool.root.onclose=()=>opener?.focus();
  tool.root.querySelectorAll('[data-close],#closeBending,#closeSlope').forEach(button=>button.onclick=()=>tool.root.close());
});
document.querySelectorAll('#measurementSheet,#pieceSheet,#projectDetail,#saveSheet,#exportSheet,#projectNameSheet').forEach(dialog=>dialog.querySelectorAll('[data-close]').forEach(button=>button.onclick=()=>dialog.close()));
let favourites=catalog.filter(tool=>!['level','triangle','helix'].includes(tool.id)).slice(0,8).map(tool=>tool.id);
try{const saved=JSON.parse(localStorage.getItem('woodpilot-tools-favourites'));if(Array.isArray(saved)&&saved.length>=1&&saved.length<=8&&new Set(saved).size===saved.length&&saved.every(id=>catalog.some(tool=>tool.id===id)))favourites=saved;}catch{}
const favouriteEditor=createFavouritesEditor({catalog,getIds:()=>favourites,onChange(ids){favourites=ids;selected=0;rotation=0;try{localStorage.setItem('woodpilot-tools-favourites',JSON.stringify(ids));}catch{notify('Ordre non conservé sur cet appareil.');}renderWheel();}});
document.querySelector('[data-reorder-wheel]').onclick=()=>favouriteEditor.open();
let selected=Math.max(0,favourites.indexOf('bending')),rotation=-selected*360/favourites.length,startX=0,dragging=false,suppressClick=false;
const wheel=document.querySelector('#wheel'),stage=document.querySelector('#wheelStage');
const wheelTools=()=>favourites.map(id=>catalog.find(tool=>tool.id===id));
function renderWheel() {
  const tools=wheelTools(),step=360/tools.length,radius=Math.min(165,(stage.clientWidth-72)/2);
  selected=Math.min(selected,tools.length-1);wheel.replaceChildren();
  tools.forEach((tool,index)=>{const angle=(index*step-90)*Math.PI/180,button=document.createElement('button');
    button.className='tool-node'+(index===selected?' selected':'');button.setAttribute('aria-label',tool.name);button.setAttribute('aria-pressed',String(index===selected));button.innerHTML=`<span aria-hidden="true" class="material-symbols-rounded">${tool.icon}</span>`;
    button.style.transform=`translate(${Math.cos(angle)*radius}px,${Math.sin(angle)*radius}px) rotate(${-rotation}deg)`;
    let holdTimer;button.onpointerdown=()=>holdTimer=setTimeout(()=>{suppressClick=true;favouriteEditor.open();},650);button.onpointerup=button.onpointercancel=button.onpointerleave=()=>clearTimeout(holdTimer);
    button.onclick=()=>{if(suppressClick)return;select(index);wheel.children[index].focus();};wheel.append(button);
  });
  wheel.style.transform=`rotate(${rotation}deg)`;
  const tool=tools[selected];document.querySelector('#selectedName').textContent=tool.name;document.querySelector('#selectedDesc').textContent=tool.desc;document.querySelector('#centerIcon').textContent=tool.icon;
  document.querySelector('#openTool').setAttribute('aria-label',`Ouvrir ${tool.name}`);
}
function select(index){const next=(index+favourites.length)%favourites.length;let delta=next-selected;if(delta>favourites.length/2)delta-=favourites.length;if(delta<-favourites.length/2)delta+=favourites.length;rotation-=delta*360/favourites.length;selected=next;haptic();renderWheel();}
stage.onpointerdown=event=>{dragging=true;suppressClick=false;startX=event.clientX;};
stage.onpointerup=event=>{if(!dragging)return;dragging=false;const dx=event.clientX-startX;if(Math.abs(dx)>28){suppressClick=true;select(selected+(dx<0?1:-1));}};
stage.onpointercancel=stage.onpointerleave=()=>dragging=false;
wheel.onkeydown=event=>{if(['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();suppressClick=false;select(selected+(event.key==='ArrowRight'?1:-1));wheel.children[selected].focus();}};
document.querySelector('#openTool').onclick=()=>{if(!suppressClick)openTool(wheelTools()[selected].id);};
const titles={projects:'Projets',wheel:'Roue',library:'Outils'};
document.querySelectorAll('.bottom-nav button').forEach(button=>button.onclick=()=>{
  document.querySelectorAll('.bottom-nav button').forEach(item=>{item.classList.toggle('active',item===button);if(item===button)item.setAttribute('aria-current','page');else item.removeAttribute('aria-current');});
  document.querySelectorAll('.view').forEach(view=>view.classList.toggle('active',view.dataset.view===button.dataset.target));
  if(button.dataset.target==='wheel')renderWheel();if(button.dataset.target==='projects')projects.render();haptic();
});
function toggleFavourite(id){
  if(favourites.includes(id)){if(favourites.length===1){notify('Conservez au moins un favori sur la roue.');return;}favourites=favourites.filter(value=>value!==id);}
  else{if(favourites.length===8){notify('La roue accueille 8 favoris. Retirez un outil pour en ajouter un autre.');return;}favourites.push(id);}
  selected=0;rotation=0;try{localStorage.setItem('woodpilot-tools-favourites',JSON.stringify(favourites));}catch{notify('Les favoris ne peuvent pas être conservés sur cet appareil.');}
  renderLibrary(document.querySelector('#searchInput').value);
}
function renderLibrary(filter='') {
  const normalize=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(),root=document.querySelector('#library');root.replaceChildren();
  const filtered=catalog.filter(tool=>normalize(tool.name).includes(normalize(filter)));
  if(!filtered.length){root.textContent='Aucun outil trouvé.';return;}
  [...new Set(filtered.map(tool=>tool.cat))].forEach(category=>{const group=document.createElement('section');group.className='library-group';const heading=document.createElement('h3');heading.textContent=category;group.append(heading);
    filtered.filter(tool=>tool.cat===category).forEach(tool=>{const row=document.createElement('div');row.className='library-item';const open=document.createElement('button');open.className='library-row';open.innerHTML=`<span aria-hidden="true" class="material-symbols-rounded">${tool.icon}</span><span>${tool.name}<small>${tool.desc}</small></span><span aria-hidden="true" class="material-symbols-rounded">chevron_right</span>`;open.onclick=()=>openTool(tool.id);
      const favourite=document.createElement('button');favourite.className='icon-btn favourite';favourite.innerHTML='<span aria-hidden="true" class="material-symbols-rounded">star</span>';favourite.setAttribute('aria-pressed',String(favourites.includes(tool.id)));favourite.setAttribute('aria-label',`${favourites.includes(tool.id)?'Retirer':'Ajouter'} ${tool.name} ${favourites.includes(tool.id)?'de':'à'} la roue`);favourite.onclick=()=>toggleFavourite(tool.id);row.append(open,favourite);group.append(row);
    });root.append(group);
  });
}
document.querySelector('#searchInput').oninput=event=>renderLibrary(event.target.value);
const appearance=window.matchMedia('(prefers-color-scheme: dark)');
function syncAppearance(){
  document.documentElement.dataset.theme=appearance.matches?'dark':'light';
  document.querySelector('meta[name="theme-color"]').content=getComputedStyle(document.documentElement).getPropertyValue('--color-background').trim();
}
syncAppearance();
appearance.addEventListener('change',syncAppearance);
window.addEventListener('resize',()=>{if(document.querySelector('[data-view="wheel"]').classList.contains('active'))renderWheel();});
renderWheel();renderLibrary();
const offlineStatus=document.querySelector('#offlineStatus');
keepScreenAwake({onStatus(state){
  const status=document.querySelector('#screenAwakeStatus');
  status.textContent=state==='active'?'Écran maintenu allumé':state==='unsupported'?'Maintien de l’écran indisponible dans ce navigateur':state==='unavailable'?'Le navigateur ne permet pas le maintien de l’écran actuellement':'Maintien de l’écran suspendu';
}});
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('./sw.js').then(async registration=>{const worker=registration.installing||registration.waiting;if(worker&&worker.state!=='activated')await new Promise((resolve,reject)=>{worker.addEventListener('statechange',()=>{if(worker.state==='activated')resolve();if(worker.state==='redundant')reject(new Error('Cache indisponible'));});});await navigator.serviceWorker.ready;}).then(()=>offlineStatus.textContent='Prêt hors connexion · données sur cet appareil').catch(()=>offlineStatus.textContent='Cache hors connexion indisponible dans ce navigateur');
}else offlineStatus.textContent='Les outils fonctionnent localement ; le cache hors connexion est indisponible.';
