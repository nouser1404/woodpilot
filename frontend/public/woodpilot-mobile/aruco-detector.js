import { AR } from './vendor/aruco/aruco.js';
import { homography } from './photo-calibration.js';
export function detectCalibration(image){
  const markers=new AR.Detector({dictionaryName:'DICT_4X4_50',maxHammingDistance:0}).detect(image);
  if(!markers.length)throw new RangeError('Marqueur absent, flou, coupé ou trop petit. Photographiez le carré entier avec une marge blanche.');
  if(markers.length!==1)throw new RangeError('Plusieurs marqueurs détectés : conservez un seul marqueur dans la photo.');
  const marker=markers[0];if(marker.id!==0)throw new RangeError(`ID ${marker.id} détecté : utilisez le marqueur WoodPilot ID 0.`);
  const corners=marker.corners;
  if(corners.some((p,i)=>Math.hypot(p.x-corners[(i+1)%4].x,p.y-corners[(i+1)%4].y)<40))throw new RangeError('Marqueur trop petit : rapprochez le téléphone.');
  homography(corners);
  return {type:'aruco',id:0,size:50,corners:corners.map(p=>({x:p.x/image.width,y:p.y/image.height}))};
}
