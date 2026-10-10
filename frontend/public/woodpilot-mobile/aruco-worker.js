import { detectCalibration } from './aruco-detector.js';
self.onmessage=({data})=>{try{self.postMessage({id:data.id,calibration:detectCalibration(data.image)});}catch(error){self.postMessage({id:data.id,error:error.message});}};
