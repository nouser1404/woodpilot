const CACHE='woodpilot-tools-v3-20261010-level-proximity-sound-4';
const ROOT=new URL('./',self.location.href);
const ENGINE=new URL('../agencement-configurator/panel-nesting.js',ROOT).href;
const SHELL=['index.html','styles.css','app.js','screen-awake.js','helix.js','helix-tool.js','triangle.js','triangle-tool.js','level-model.js','level-tool.js','level-feedback.js','level-sound.js','cintrage.js','bending-tool.js','slope.js','slope-tool.js','measurement-input.js','number-model.js','expression.js','edge-detection.js','edge-worker.js','text-input.js','photo-transfer.js','favourites.js','offcuts.js','offcuts-tool.js','calculators.js','angles-tool.js','spacing-tool.js','wheel-picker.js','photo-model.js','photo-tool.js','photo-calibration.js','photo-calibrated-ui.js','photo-viewport.js','aruco-detector.js','aruco-worker.js','vendor/aruco/cv.js','vendor/aruco/aruco.js','markers/woodpilot-aruco-50mm-A4.pdf','markers/woodpilot-aruco-4x4-50-id0-50mm.png','aretiers.js','aretiers-tool.js','manufacturing.js','nesting-details.js','nesting-plan.js','cabinet-tool.js','cutlist-tool.js','project-store.js','projects-ui.js','export-result.js','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png','fonts/fonts.css','fonts/font-0.ttf','fonts/font-1.ttf','fonts/font-2.ttf','fonts/font-3.ttf','fonts/font-4.ttf'].map(path=>new URL(path,ROOT).href).concat(ENGINE);
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('woodpilot-tools-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin||(!url.pathname.startsWith(ROOT.pathname)&&url.href!==ENGINE))return;
  event.respondWith(fetch(event.request).then(response=>{
    if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)));}return response;
  }).catch(async()=>{const cache=await caches.open(CACHE);return (await cache.match(event.request))||(event.request.mode==='navigate'?cache.match(new URL('index.html',ROOT).href):Response.error());}));
});
