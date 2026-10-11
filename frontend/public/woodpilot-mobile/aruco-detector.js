import { AR } from './vendor/aruco/aruco.js';
import { homography, ARUCO_SIZES } from './photo-calibration.js';
export function detectCalibration(image){
  const markers=new AR.Detector({dictionaryName:'DICT_4X4_50',maxHammingDistance:0}).detect(image);
  if(!markers.length)throw new RangeError('Marqueur absent, flou, coupé ou trop petit. Photographiez le carré entier avec une marge blanche.');
  if(markers.length!==1)throw new RangeError('Plusieurs marqueurs détectés : conservez un seul marqueur dans la photo.');
  const marker=markers[0];if(!Object.hasOwn(ARUCO_SIZES,marker.id))throw new RangeError(`ID ${marker.id} détecté : utilisez un repère WoodPilot ID 0 (50 mm) ou ID 1 (150 mm).`);
  const corners=marker.corners;
  if(corners.some((p,i)=>Math.hypot(p.x-corners[(i+1)%4].x,p.y-corners[(i+1)%4].y)<80))throw new RangeError('Marqueur trop petit : utilisez le grand repère ou rapprochez le téléphone.');
  homography(corners,ARUCO_SIZES[marker.id]);
  return {type:'aruco',id:marker.id,size:ARUCO_SIZES[marker.id],detectionWidth:image.width,detectionHeight:image.height,corners:corners.map(p=>({x:p.x/image.width,y:p.y/image.height}))};
}
