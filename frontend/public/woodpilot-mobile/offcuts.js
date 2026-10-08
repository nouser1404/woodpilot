export function validateOffcut(value) {
  if(!value||typeof value.name!=='string'||!value.name.trim()||value.name.length>80||![value.lengthMm,value.widthMm,value.thicknessMm].every(n=>Number.isFinite(n)&&n>=1&&n<=100000))throw new RangeError('Chute invalide : nom et dimensions positives requis.');
  return value;
}
export function recoverableOffcuts(panel,thicknessMm,minSize=100) {
  return panel.freeRects.filter(rect=>rect.lengthMm>=minSize&&rect.widthMm>=minSize).map((rect,index)=>({name:`Chute ${index+1}`,lengthMm:Math.floor(rect.lengthMm*1000)/1000,widthMm:Math.floor(rect.widthMm*1000)/1000,thicknessMm}));
}
export function prepareOffcutImport(incoming,existing=[]) {
  if(!Array.isArray(incoming)||incoming.length>1000)throw new RangeError('Liste de chutes invalide.');
  const ids=new Set();
  incoming.forEach(value=>{validateOffcut(value);if(typeof value.id!=='string'||!value.id||value.id.length>100||ids.has(value.id))throw new RangeError('Identifiant de chute invalide ou dupliqué.');ids.add(value.id);});
  const known=new Set(existing.map(value=>value.id));
  // A backup cannot recreate consumed stock or overwrite current measurements.
  return incoming.filter(value=>!known.has(value.id));
}
