import {formatMeasure} from './cintrage.js';
/** Presentation of a piece before nesting rotation; existing checkbox fields remain the source of truth. */
export function createPieceForm(sheet){
  const form=sheet.querySelector('form'),header=form.querySelector('.tool-header');
  const preset=form.querySelector('[data-piece-preset]').closest('label');
  const custom=form.querySelector('[data-custom-name]');
  const dimensions=form.querySelector('.measurement-grid');
  const edges=form.querySelector('.edge-fields');
  const rotation=form.querySelector('[data-rotation]').closest('label');
  const submit=form.querySelector('[type=submit]');
  const error=form.querySelector('[role=alert]');
  const groups=Array.from({length:3},()=>document.createElement('section'));
  groups[0].append(preset,custom);groups[1].append(dimensions);groups[2].append(rotation);
  edges.hidden=true;
  const preview=document.createElement('div');preview.className='edge-preview';
  preview.innerHTML='<div class="piece-face"><strong data-preview-length></strong><span data-preview-width></span></div>';
  const sides=[['chantTop','Haut','top'],['chantRight','Droite','right'],['chantBottom','Bas','bottom'],['chantLeft','Gauche','left']];
  for(const [key,label,position] of sides){
    const input=edges.querySelector(`[data-edge="${key}"]`),button=document.createElement('button');
    button.type='button';button.className=`edge-side edge-${position}`;button.textContent=label;
    button.setAttribute('aria-label',`Chant ${label.toLowerCase()}`);
    button.onclick=()=>{input.checked=!input.checked;refreshEdges();};
    input.addEventListener('change',refreshEdges);button.dataset.edgeSide=key;preview.append(button);
  }
  groups[2].prepend(preview);
  const heading=document.createElement('section');heading.className='guided-heading';
  heading.innerHTML='<small></small><h3 tabindex="-1"></h3><p></p>';
  header.after(heading);error.before(...groups);
  const nav=document.createElement('div');nav.className='guided-navigation';
  nav.innerHTML='<button type="button" class="secondary-btn">Retour</button><button type="button" class="primary-btn">Continuer</button>';
  submit.before(nav);let step=0;
  function refreshEdges(){
    for(const button of preview.querySelectorAll('[data-edge-side]')){
      const checked=edges.querySelector(`[data-edge="${button.dataset.edgeSide}"]`).checked;
      button.setAttribute('aria-pressed',String(checked));
    }
  }
  function show(next,focus=true){
    step=next;groups.forEach((group,i)=>group.hidden=i!==step);
    heading.querySelector('small').textContent=`Étape ${step+1} / 3`;
    heading.querySelector('h3').textContent=['Nom de la pièce','Dimensions et quantité','Chants et sens du fil'][step];
    heading.querySelector('p').textContent=['Choisissez l’élément à débiter.','Touchez une cote pour la modifier.','Touchez les côtés à plaquer. Les côtés sélectionnés apparaissent en orange.'][step];
    nav.children[0].hidden=step===0;nav.children[1].hidden=step===2;submit.hidden=step!==2;
    if(focus&&sheet.open)heading.querySelector('h3').focus();
  }
  function advance(){
    if(step===0&&form.querySelector('[data-piece-preset]').value==='Autre'&&!form.querySelector('[data-piece-name]').value.trim()){
      error.textContent='Renseignez le nom de la pièce.';form.querySelector('[data-piece-name]').focus();return;
    }
    error.textContent='';show(Math.min(2,step+1));
  }
  nav.children[0].onclick=()=>{error.textContent='';show(step-1);};nav.children[1].onclick=advance;
  // Enter in an early field advances the guide instead of saving an incomplete form.
  form.addEventListener('submit',event=>{if(step!==2){event.preventDefault();event.stopImmediatePropagation();advance();}},true);
  return {reset(){show(0,false);refreshEdges();},update(piece){
    preview.querySelector('[data-preview-length]').textContent=`${formatMeasure(piece.lengthMm)} mm`;
    preview.querySelector('[data-preview-width]').textContent=`${formatMeasure(piece.widthMm)} mm`;
    preview.style.setProperty('--piece-ratio',String(Math.max(.5,Math.min(3,piece.lengthMm/piece.widthMm))));
    refreshEdges();
  }};
}
