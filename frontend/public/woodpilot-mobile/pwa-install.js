const VISITED='woodpilot-install-invitation-v1';
const INSTALLED='woodpilot-installed-v1';
export function isStandalone(win=window){return win.navigator.standalone===true||win.matchMedia('(display-mode: standalone)').matches;}
export function installInvitation(win=window,doc=document){
 const read=key=>{try{return win.localStorage.getItem(key);}catch{return null;}};
 const remember=(key,value='1')=>{try{win.localStorage.setItem(key,value);}catch{/* Navigation privée : la session reste utilisable. */}};
 let promptEvent=null,dialog=null,shown=false;
 const standalone=win.matchMedia('(display-mode: standalone)');
 const installed=()=>{remember(INSTALLED);promptEvent=null;if(dialog?.open)dialog.close();};
 if(isStandalone(win)){installed();return;}
 function update(){
  if(!dialog)return;
  const ios=/iPhone|iPad|iPod/.test(win.navigator.userAgent)||(win.navigator.platform==='MacIntel'&&win.navigator.maxTouchPoints>1);
  dialog.querySelector('[data-install-native]').hidden=!promptEvent;
  dialog.querySelector('[data-install-help]').textContent=promptEvent?'Installez WoodPilot pour retrouver vos outils depuis l’écran d’accueil.':ios?'Dans Safari, touchez Partager, puis « Sur l’écran d’accueil ». Activez « Ouvrir comme app web » si proposé, puis touchez Ajouter.':'Ouvrez le menu de votre navigateur et cherchez « Installer WoodPilot » ou « Ajouter à l’écran d’accueil ». Si cette option n’apparaît pas, utilisez un navigateur compatible ; vous pouvez continuer ici.';
 }
 function show(){
  if(shown||read(VISITED)||read(INSTALLED)||isStandalone(win)||!win.isSecureContext)return;
  if(doc.hidden||doc.querySelector('dialog[open]'))return;
  shown=true;
  dialog=doc.createElement('dialog');dialog.className='measurement-sheet pwa-install-sheet';dialog.setAttribute('aria-labelledby','pwa-install-title');dialog.setAttribute('aria-describedby','pwa-install-help');
  dialog.innerHTML='<div class="tool-header"><h2 id="pwa-install-title">WoodPilot à portée de main</h2><button type="button" class="icon-btn" data-install-close aria-label="Fermer l’invitation"><span aria-hidden="true" class="material-symbols-rounded">close</span></button></div><img src="./icon-192.png" width="72" height="72" alt="" class="pwa-install-icon"><p>Ajoutez la Toolbox à votre écran d’accueil pour y accéder comme à une app.</p><p id="pwa-install-help" data-install-help></p><button type="button" class="primary-btn" data-install-native hidden>Installer WoodPilot</button><button type="button" class="secondary-btn" data-install-later>Continuer sans installer</button>';
  doc.body.append(dialog);update();dialog.showModal();remember(VISITED);
  dialog.querySelector('[data-install-close]').onclick=dialog.querySelector('[data-install-later]').onclick=()=>dialog.close();
  dialog.querySelector('[data-install-native]').onclick=async()=>{
   const event=promptEvent;if(!event)return;promptEvent=null;update();
   try{dialog.close();await event.prompt();const choice=await event.userChoice;if(choice.outcome==='accepted')installed();}catch{/* L’invitation native peut être refusée par le navigateur. */}
  };
 }
 win.addEventListener('beforeinstallprompt',event=>{if(read(INSTALLED)||isStandalone(win))return;event.preventDefault();promptEvent=event;update();show();});
 win.addEventListener('appinstalled',installed);
 standalone.addEventListener('change',event=>{if(event.matches)installed();});
 doc.addEventListener('visibilitychange',show);
 // Ne pas interrompre un outil déjà ouvert pendant le chargement.
 doc.addEventListener('close',show,true);
 win.setTimeout(show,1200);
}
