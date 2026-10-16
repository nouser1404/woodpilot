// Références métier partagées par les plans, débits et étiquettes.
const ACRONYMS={jour:'JR',plinthe:'PLI',montant:'MT',traverse:'TR',tablette:'TAB',etagere:'ETA',porte:'POR',fond:'FD',plateau:'PLT',cote:'CT',pied:'PD',placard:'PLC',tiroir:'TIR','face tiroir':'FT','fond tiroir':'FDT',caisson:'CAI',socle:'SOC','plan de travail':'PDT',credence:'CRE',fronton:'FRO',chant:'CH'};
export function pieceReferences(pieces){
 const counts=new Map();
 return pieces.map(piece=>{
  const name=piece.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
  const base=ACRONYMS[name]||('X'+name.replace(/[^a-z]/g,'').slice(0,5).toUpperCase());
  const n=(counts.get(base)||0)+1;counts.set(base,n);return `${base}${n}`;
 });
}
export function groupedPanelPieces(panel){
 const rows=new Map();
 for(const piece of panel.pieces){
  const key=JSON.stringify([piece.code,piece.originalLengthMm,piece.originalWidthMm,piece.thicknessMm,Boolean(piece.rotated),...['chantTop','chantRight','chantBottom','chantLeft'].map(k=>Boolean(piece[k]))]);
  if(rows.has(key))rows.get(key).count++;else rows.set(key,{...piece,count:1});
 }
 return [...rows.values()];
}
