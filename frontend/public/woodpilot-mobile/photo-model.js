import { validateCalibration } from './photo-calibration.js';
export function normalizedPoint(x,y,width,height) {
  return {x:Math.max(0,Math.min(1,x/width)),y:Math.max(0,Math.min(1,y/height))};
}
export function validatePhoto(data) {
  if(!data || typeof data.image!=='string' || data.image.length>36000000 || !/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(data.image) || !Array.isArray(data.lines) || data.lines.length>100)throw new RangeError('Photo métrée invalide.');
  for(const line of data.lines) {
    if(!line || !Number.isFinite(line.value) || line.value<=0 || line.value>1000000)throw new RangeError('Cote de photo invalide.');
    for(const point of [line.a,line.b])if(!point || ![point.x,point.y].every(v=>Number.isFinite(v)&&v>=0&&v<=1))throw new RangeError('Position de cote invalide.');
  }
  if(data.notes!==undefined&&(typeof data.notes!=='string'||data.notes.length>2000))throw new RangeError('Notes de photo invalides.');
  if(data.annotations!==undefined){if(!Array.isArray(data.annotations)||data.annotations.length>30)throw new RangeError('Annotations invalides.');for(const note of data.annotations)if(!note||typeof note.text!=='string'||!note.text.trim()||note.text.length>120||!note.point||![note.point.x,note.point.y].every(v=>Number.isFinite(v)&&v>=0&&v<=1))throw new RangeError('Annotation invalide.');}
  if(data.calibration!=null)validateCalibration(data.calibration);
  for(const line of data.lines)if(line.source){if(!['aruco','known'].includes(line.source)||line.source!==line.calibration?.type)throw new RangeError('Origine de cote invalide.');validateCalibration(line.calibration);}
  return data;
}
