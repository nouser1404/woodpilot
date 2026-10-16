/** Progressive disclosure for Photo Métré, without replacing or clearing its data. */
export function photoStage({chosen,hasImage,mode,calibration,replacing=false}){
  if(!chosen)return 'mode';
  if(!hasImage||replacing)return 'photo';
  if(mode==='calibrated'&&!calibration)return 'calibration';
  return 'measure';
}
const STEPS={
  mode:[1,'Choisir le mode','Comment souhaitez-vous coter votre photo ?'],
  photo:[2,'Ajouter une photo','Prenez une photo ou choisissez-en une sur votre appareil.'],
  calibration:[3,'Calibrer la photo','Détectez le repère, vérifiez ses quatre coins puis confirmez-le.'],
  measure:[3,'Coter la photo',''],
};
export function createPhotoFlow(root,{getImage,calibrated,render}){
  const header=document.createElement('section');header.className='photo-step';
  header.innerHTML='<div class="photo-step-heading"><span data-step-number></span><h3 data-step-title></h3></div><p data-step-instruction role="status" aria-live="polite"></p><div class="photo-step-actions"><button data-change-photo class="secondary-btn">Ajouter une prise de côte</button><button data-recalibrate class="secondary-btn" hidden>Recalibrer</button><button data-keep-photo class="secondary-btn" hidden>Annuler la nouvelle photo</button></div>';
  root.querySelector('.tool-header').after(header);
  const preparation=document.createElement('div');preparation.className='photo-preparation';
  preparation.innerHTML='<p>Posez le repère bien à plat sur la surface à mesurer avant la prise de vue.</p><a class="secondary-btn" href="./markers/woodpilot-aruco-150mm-A4.pdf" target="_blank" rel="noopener"><span class="material-symbols-rounded" aria-hidden="true">print</span>Imprimer le repère 150 mm</a>';
  root.querySelector('.photo-import').before(preparation);
  const importPanel=root.querySelector('.photo-import'),modes=root.querySelector('.photo-mode-picker'),controls=root.querySelector('[data-calibration-controls]'),warning=root.querySelector('.photo-warning');
  const secondary=root.querySelector('details'),detection=root.querySelector('[data-detection-status]'),viewport=root.querySelector('.photo-viewport'),zoom=viewport.previousElementSibling;
  viewport.after(header.querySelector('.photo-step-actions'));
  const lines=root.querySelector('[data-photo-lines]'),actions=root.querySelector('.result-actions');
  let replacing=false,lastStage;
  root.querySelector('[data-change-photo]').onclick=()=>{replacing=true;render();};
  root.querySelector('[data-recalibrate]').onclick=()=>calibrated.reset();
  root.querySelector('[data-keep-photo]').onclick=()=>{replacing=false;render();};
  return {
    imported(){replacing=false;},
    update(){
      const hasImage=!!getImage(),stage=photoStage({chosen:calibrated.chosen,hasImage,mode:calibrated.mode,calibration:calibrated.calibration,replacing});
      const [number,title,instruction]=STEPS[stage];
      header.querySelector('[data-step-number]').textContent=String(stage==='measure'&&calibrated.mode==='calibrated'?4:number);
      header.querySelector('[data-step-title]').textContent=title;
      header.querySelector('[data-step-instruction]').textContent=stage==='calibration'&&calibrated.referenceActive?'Touchez les deux extrémités de la distance connue, puis saisissez sa valeur réelle.':stage==='measure'?(calibrated.mode==='manual'?'Touchez les deux extrémités ou tracez une ligne, puis saisissez la cote relevée au mètre.':calibrated.calibration.type==='known'?'Touchez les deux extrémités à mesurer. Photo de face seulement, sans correction de perspective.':'Touchez les deux extrémités à mesurer, dans le même plan que le repère.'):instruction;
      root.querySelector('[data-change-photo]').hidden=!hasImage||stage==='mode'||stage==='photo';
      root.querySelector('[data-recalibrate]').hidden=calibrated.mode!=='calibrated'||!hasImage||!['calibration','measure'].includes(stage)||!(calibrated.outline||calibrated.referenceActive);
      root.querySelector('[data-keep-photo]').hidden=stage!=='photo'||!hasImage;
      modes.hidden=stage!=='mode';importPanel.hidden=stage!=='photo';preparation.hidden=stage!=='photo'||calibrated.mode!=='calibrated';
      controls.hidden=stage!=='calibration';warning.hidden=!['calibration','measure'].includes(stage);
      const showingPhoto=['calibration','measure'].includes(stage);
      viewport.hidden=!showingPhoto;zoom.hidden=!hasImage||stage==='mode';zoom.querySelectorAll('[data-zoom-out],[data-zoom-in],[data-zoom-reset],[data-pan],[data-undo]').forEach(button=>button.hidden=!showingPhoto);secondary.hidden=lines.hidden=actions.hidden=stage!=='measure';detection.hidden=stage!=='measure'||calibrated.mode!=='manual';
      root.dataset.photoStage=stage;
      if(lastStage!==stage&&root.open){const title=header.querySelector('[data-step-title]');title.tabIndex=-1;title.focus({preventScroll:true});}
      lastStage=stage;
      root.querySelectorAll('[data-aruco],[data-known]').forEach(button=>button.hidden=!!calibrated.outline||calibrated.referenceActive);
      root.querySelector('[data-new]').hidden=true;
    }
  };
}
