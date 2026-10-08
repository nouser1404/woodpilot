import { detectSegments } from './edge-detection.js';
self.onmessage=event=>{try{self.postMessage({id:event.data.id,segments:detectSegments(event.data.image)});}catch(error){self.postMessage({id:event.data.id,error:error.message});}};
