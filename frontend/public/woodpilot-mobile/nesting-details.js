export const ELEMENT_NAMES=['Jour','Plinthe','Montant','Traverse','Tablette','Étagère','Porte','Fond','Plateau','Côté','Pied','Placard','Tiroir','Face tiroir','Fond tiroir','Caisson','Socle','Plan de travail','Crédence','Fronton','Chant'];
export const MATERIALS=['Non renseigné','Mélaminé','Massif','Aggloméré','MDF','Contreplaqué','Stratifié','OSB','Autre'];
export const EDGES=['chantTop','chantRight','chantBottom','chantLeft'];
export function validateNestingDetails(data){
  if(data.projectName!==undefined&&(typeof data.projectName!=='string'||data.projectName.length>80))throw new RangeError('Nom de projet invalide (80 caractères maximum).');
  if(data.material!==undefined&&!MATERIALS.includes(data.material))throw new RangeError('Matériau invalide.');
  for(const piece of data.pieces)for(const edge of EDGES)if(piece?.[edge]!==undefined&&typeof piece[edge]!=='boolean')throw new RangeError('Les chants doivent être cochés ou décochés.');
}
export function displayedEdges(piece){
  const edges=EDGES.map(key=>Boolean(piece[key]));
  // Rotation de 90° dans le sens horaire : haut → droite → bas → gauche.
  return piece.rotated?[edges[3],edges[0],edges[1],edges[2]]:edges;
}
export function edgeDescription(piece){
  const names=['haut','droite','bas','gauche'].filter((_,i)=>piece[EDGES[i]]);
  return names.length?`Chants : ${names.join(', ')} (avant rotation)`:'Sans chant';
}
export function nestingReport(data,groups,date=new Date()){
  const panels=groups.reduce((sum,g)=>sum+g.result.panels.length,0);
  const area=groups.reduce((sum,g)=>sum+g.result.totalPanelAreaMm2,0);
  const used=groups.reduce((sum,g)=>sum+g.result.totalUsedAreaMm2,0);
  const missing=groups.reduce((sum,g)=>sum+g.result.overflowPieces.length,0);
  const pct=v=>v.toLocaleString('fr-FR',{maximumFractionDigits:1});
  return ['WoodPilot — Débit / Calpinage',...(data.projectName?[`Projet : ${data.projectName}`]:[]),`Date : ${date.toLocaleDateString('fr-FR')}`,`Matériau : ${data.material||MATERIALS[0]}`,`Format : ${data.panel.lengthMm} × ${data.panel.widthMm} mm · trait de scie ${data.panel.sawKerfMm} mm`,`Marge de rafraîchissement : ${data.panel.edgeMarginMm??0} mm sur chacun des 4 bords · surface utile ${data.panel.lengthMm-2*(data.panel.edgeMarginMm??0)} × ${data.panel.widthMm-2*(data.panel.edgeMarginMm??0)} mm`,`${data.pieces.reduce((sum,p)=>sum+p.quantity,0)} occurrences · ${data.pieces.length} références · ${panels} panneaux`,area?`Taux utilisé : ${pct(used/area*100)} % · taux de chute : ${pct((area-used)/area*100)} %`:'Taux de chute : sans panneau',`Les pertes comprennent les marges, le trait de scie et les surfaces restantes.`,...(missing?[`PLAN INCOMPLET : ${missing} pièce(s) non placée(s)`]:[]),data.sourceOffcut?`Chute unique : ${data.sourceOffcut.name}`:'Panneaux commerciaux',...groups.map(g=>`${g.thickness} mm : ${g.result.panels.length} panneaux · chutes ${pct(g.result.wastePct)} %`),'Liste de débit — dimensions à débiter',...data.pieces.map((p,i)=>`P${i+1} · ${p.quantity} occurrence(s) · ${p.name} · ${p.lengthMm} × ${p.widthMm} × ${p.thicknessMm} mm · ${edgeDescription(p)}${p.allowRotation?' · rotation libre':' · fil bloqué'}`),'Chants repérés en pointillés. Dimensions brutes, sans déduction de leur épaisseur.','Placement indicatif, sans garantie d’optimum ni séquence de coupe.'].join('\n');
}
