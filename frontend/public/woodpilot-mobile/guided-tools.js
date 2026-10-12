// Progressive presentation only: calculations and sensor lifecycles stay in their tools.
export function createSteps(root, steps){
  const header=document.createElement('section');header.className='guided-heading';
  header.innerHTML='<small data-step-count></small><h3 tabindex="-1"></h3><p role="status"></p>';
  (root.querySelector('.level-start')||root.querySelector('.tool-header')).after(header);
  const nav=document.createElement('div');nav.className='guided-navigation';
  nav.innerHTML='<button type="button" class="secondary-btn">Retour</button><button type="button" class="primary-btn">Continuer</button>';
  root.append(nav);let current=0;
  function show(index,focus=false){
    current=Math.max(0,Math.min(steps.length-1,index));
    steps.forEach((step,i)=>step.nodes.forEach(node=>node.hidden=i!==current));
    header.querySelector('small').textContent=`Étape ${current+1} / ${steps.length}`;
    const title=header.querySelector('h3');title.textContent=steps[current].title;
    header.querySelector('p').textContent=steps[current].hint;
    nav.children[0].hidden=current===0;nav.children[1].hidden=current===steps.length-1;
    if(focus&&root.open)title.focus();
  }
  nav.children[0].onclick=()=>show(current-1,true);
  nav.children[1].onclick=()=>show(current+1,true);
  show(0);return {show,header,nav};
}
export function installCalculatorSteps(controllers){
  for(const name of ['bending','slope','angles','spacing','aretiers','cabinet','helix','triangle']){
    const tool=controllers[name],root=tool.root;
    const input=[],options=[],result=[];
    for(const node of [...root.children]){
      if(node.matches('.tool-header,.tool-help-popover,[role=alert]'))continue;
      if(node.matches('p')&&!node.hasAttribute('role'))continue;
      const hasInput=node.matches('.measurement-grid,.count-control,.check-row')||node.querySelector('[data-measurement],[data-helix-input],[data-triangle-input],[data-triangle-mode]');
      if(hasInput){(node.matches('details')?options:input).push(node);continue;}
      if(node.matches('details')&&node.querySelector('[data-measurement]')){options.push(node);continue;}
      result.push(node);
    }
    // Additional cabinet construction choices follow the overall dimensions.
    if(name==='cabinet'){
      const grid=input.find(node=>node.matches('.measurement-grid'));
      if(grid){input.splice(input.indexOf(grid),1);options.push(grid);}
    }
    const steps=[{title:'Renseigner les dimensions',hint:'Touchez les cotes à modifier, puis continuez.',nodes:input}];
    if(options.length)steps.push({title:'Préciser la fabrication',hint:'Vérifiez ces réglages avant de consulter le résultat.',nodes:options});
    steps.push({title:'Consulter le résultat',hint:'Revenez aux données pour les corriger, ou enregistrez votre calcul.',nodes:result});
    const flow=createSteps(root,steps),open=tool.open.bind(tool);
    tool.open=()=>{flow.show(0);open();};
  }
}
export function installCutlistSteps(tool){
  const root=tool.root,children=[...root.children];
  const pieces=root.querySelector('[data-pieces]').closest('details');
  const format=root.querySelector('[data-panel-measurement]').closest('details');
  const groups=Array.from({length:4},()=>document.createElement('section'));
  let phase=0;
  for(const node of children){
    if(node.matches('.tool-header,.tool-help-popover'))continue;
    if(node===pieces)phase=1;
    if(node===format)phase=2;
    if(node.matches('.result-card'))phase=3;
    groups[phase].append(node);
  }
  root.append(...groups);pieces.open=true;format.open=true;
  const flow=createSteps(root,[
    {title:'Choisir le matériau',hint:'Renseignez le matériau et, si utile, le nom du projet.',nodes:[groups[0]]},
    {title:'Ajouter les pièces',hint:'Renseignez les pièces à débiter et leurs quantités.',nodes:[groups[1]]},
    {title:'Préparer le panneau',hint:'Vérifiez les dimensions du panneau, le trait de scie et la marge.',nodes:[groups[2]]},
    {title:'Consulter le calpinage',hint:'Contrôlez les panneaux et la liste de débit avant de les exporter.',nodes:[groups[3]]}
  ]);
  const open=tool.open.bind(tool);tool.open=()=>{flow.show(0);open();};
}
export function createSensorSteps(root,{setup,measure,result,kind}){
  const flow=createSteps(root,[
    {title:'Préparer la mesure',hint:kind==='level'?'Choisissez Niveau ou Aplomb, puis activez les capteurs.':'Activez les capteurs pour mesurer la pente.',nodes:setup},
    {title:'Placer le téléphone',hint:kind==='level'?'Placez le téléphone selon le contrôle choisi, puis continuez pour lire le radar.':'Posez le plan de l’écran contre la surface. Capture auto laisse 5 secondes pour le placer, puis attend 2 secondes de stabilité.',nodes:measure},
    {title:kind==='level'?'Contrôler l’alignement':'Lire la mesure mémorisée',hint:kind==='level'?'Touchez un axe pour le contrôler seul. Le son vous guide vers le centre.':'La mesure est figée : vous pouvez relever le téléphone et l’enregistrer.',nodes:result}
  ]);
  if(kind==='level'){
    const mode=root.querySelector('[data-level-mode]');
    const hint=()=>{if(flow.header.querySelector('h3').textContent==='Placer le téléphone')flow.header.querySelector('p').textContent=mode.dataset.mode==='plumb'?'Placez le téléphone debout, son axe vertical parallèle à l’élément. Puis continuez pour lire le radar.':'Posez le dos du téléphone à plat sur la surface. Puis continuez pour lire le radar.';};
    mode.addEventListener('change',hint);
    flow.nav.addEventListener('click',hint);
    flow.updateHint=hint;
  }
  let previous='';
  return {update({active,held=false}){
    const state=held?'held':active?'active':'off';
    if(state===previous)return;previous=state;
    flow.show(held?2:active?1:0);flow.updateHint?.();
    // Sensor measurement advances by activation/capture, never by a navigation shortcut.
    if(kind!=='level')flow.nav.hidden=true;
    else {flow.nav.children[1].hidden=!active;flow.nav.children[0].hidden=true;}
  }};
}
