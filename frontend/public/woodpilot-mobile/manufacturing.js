import { solvePanelNesting } from '../agencement-configurator/panel-nesting.js';
export function validateCutList(data) {
  if(!data||!data.panel||!Array.isArray(data.pieces)||data.pieces.length>100)throw new RangeError('Liste de débit invalide (maximum 100 lignes).');
  const {lengthMm,widthMm,sawKerfMm}=data.panel;
  if(![lengthMm,widthMm,sawKerfMm].every(Number.isFinite)||lengthMm<=0||widthMm<=0||lengthMm>100000||widthMm>100000||sawKerfMm<0||sawKerfMm>20)throw new RangeError('Format de panneau invalide. Trait de scie : 0 à 20 mm.');
  if(data.sourceOffcut&&(typeof data.sourceOffcut.id!=='string'||!data.sourceOffcut.id||data.sourceOffcut.lengthMm!==lengthMm||data.sourceOffcut.widthMm!==widthMm||typeof data.sourceOffcut.name!=='string'||!Number.isFinite(data.sourceOffcut.thicknessMm)||data.pieces.some(piece=>piece.thicknessMm!==data.sourceOffcut.thicknessMm)))throw new RangeError('Une chute ne peut recevoir que des pièces de sa propre épaisseur.');
  let total=0;
  for(const piece of data.pieces) {
    if(!piece||typeof piece.name!=='string'||!piece.name.trim()||piece.name.length>80||![piece.lengthMm,piece.widthMm,piece.thicknessMm].every(v=>Number.isFinite(v)&&v>=.001&&v<=100000)||!Number.isInteger(piece.quantity)||piece.quantity<1||piece.quantity>200||typeof piece.allowRotation!=='boolean')throw new RangeError('Chaque pièce doit avoir un nom, des dimensions positives et une quantité entière de 1 à 200.');
    total+=piece.quantity;
  }
  if(total>200)throw new RangeError('Maximum : 200 pièces par liste.');
  return data;
}
export function calculateNesting(data) {
  validateCutList(data);
  const groups=new Map();
  data.pieces.forEach((piece,index)=>{const key=piece.thicknessMm;if(!groups.has(key))groups.set(key,[]);groups.get(key).push({...piece,id:`P${index+1}`,code:`P${index+1}`});});
  return [...groups].map(([thickness,pieces])=>{const result=solvePanelNesting(data.panel,pieces);if(data.sourceOffcut&&result.panels.length>1){result.overflowPieces.push(...result.panels.slice(1).flatMap(panel=>panel.pieces));result.panels=result.panels.slice(0,1);result.totalUsedAreaMm2=result.panels[0].usedAreaMm2;result.totalPanelAreaMm2=result.panelLengthMm*result.panelWidthMm;result.totalWasteAreaMm2=Math.max(0,result.totalPanelAreaMm2-result.totalUsedAreaMm2);result.utilizationPct=result.totalUsedAreaMm2/result.totalPanelAreaMm2*100;result.wastePct=100-result.utilizationPct;}return {thickness,result};});
}
export function generateCabinet({width,height,depth,thickness,shelves,backThickness=6}) {
  if(![width,height,depth,thickness,backThickness].every(v=>Number.isFinite(v)&&v>=.001&&v<=100000)||!Number.isInteger(shelves)||shelves<0||shelves>20)throw new RangeError('Dimensions de caisson invalides. Nombre de tablettes : 0 à 20.');
  const innerWidth=width-2*thickness,innerHeight=height-2*thickness,bodyDepth=depth-backThickness;
  if(innerWidth<=0||innerHeight<=0||bodyDepth<=0)throw new RangeError('L’épaisseur ou le fond dépasse les dimensions du caisson.');
  const piece=(name,lengthMm,widthMm,quantity,thicknessMm)=>({name,lengthMm,widthMm,quantity,thicknessMm,allowRotation:false});
  return [piece('Côté',height,bodyDepth,2,thickness),piece('Dessus / dessous',innerWidth,bodyDepth,2,thickness),...(shelves?[piece('Tablette',innerWidth,bodyDepth,shelves,thickness)]:[]),piece('Fond rapporté',height,width,1,backThickness)];
}
export function cutListCsv(data) {
  validateCutList(data);
  const escape=value=>`"${String(value).replaceAll('"','""')}"`;
  const safeName=name=>/^[=+\-@\t\r]/.test(name)?"'"+name:name;
  return '\uFEFF'+[['Pièce','Longueur (mm)','Largeur (mm)','Épaisseur (mm)','Quantité','Rotation autorisée'],...data.pieces.map(p=>[safeName(p.name),p.lengthMm,p.widthMm,p.thicknessMm,p.quantity,p.allowRotation?'Oui':'Non'])].map(row=>row.map(escape).join(';')).join('\r\n');
}
