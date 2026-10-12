import {supplierGeoText} from './suppliers-model.js';
let leaflet;
function loadLeaflet(){
 if(window.L)return Promise.resolve(window.L);if(leaflet)return leaflet;
 leaflet=new Promise((resolve,reject)=>{const css=document.createElement('link');css.rel='stylesheet';css.href=new URL('./suppliers/leaflet.css',import.meta.url);document.head.append(css);const script=document.createElement('script');script.src=new URL('./suppliers/leaflet.js',import.meta.url);script.onload=()=>window.L?resolve(window.L):reject(new Error('Carte indisponible.'));script.onerror=()=>{script.remove();css.remove();leaflet=null;reject(new Error('Carte indisponible hors connexion. Les fiches restent accessibles.'));};document.head.append(script);});return leaflet;
}
export function createSupplierMap(container,openDetail,status){
 let map,layer,userMarker,lib,rows=[],origin=null,pending;
 function render(){if(!map)return;layer.clearLayers();const color=getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim();
 for(const s of rows.filter(s=>s.lat!=null)){const icon=lib.divIcon({className:'supplier-map-pin',html:'<span aria-hidden="true"></span>',iconSize:[22,22],iconAnchor:[11,11]});const popup=document.createElement('div'),title=document.createElement('strong'),description=document.createElement('p'),button=document.createElement('button');title.textContent=s.name;description.textContent=supplierGeoText(s);button.textContent='Voir la fiche';button.className='secondary-btn';button.onclick=()=>openDetail(s.id);popup.append(title,description,button);lib.marker([s.lat,s.lon],{icon,title:s.name,alt:s.name}).addTo(layer).bindPopup(popup);}
 if(userMarker){map.removeLayer(userMarker);userMarker=null;}if(origin)userMarker=lib.circleMarker(origin,{radius:8,color,fillColor:color,fillOpacity:1}).addTo(map).bindPopup('Votre position');
 }
 function fit(){if(!map)return;const pts=rows.filter(s=>s.lat!=null).map(s=>[s.lat,s.lon]);if(pts.length)map.fitBounds(pts,{padding:[25,25],maxZoom:13});}
 return {update(next,point){rows=next;origin=point;render();},async show(){
 if(!pending)pending=loadLeaflet().then(L=>{lib=L;map=L.map(container,{scrollWheelZoom:false,zoomControl:false}).setView([50.2,2.9],8);L.control.zoom({zoomInTitle:'Agrandir la carte',zoomOutTitle:'Réduire la carte'}).addTo(map);let errors=0;L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).on('tileerror',()=>{if(++errors===3)status('Fond de carte indisponible. Les fiches restent accessibles dans la liste.');}).addTo(map);layer=L.layerGroup().addTo(map);}).catch(e=>{pending=null;throw e;});
 await pending;requestAnimationFrame(()=>{map.invalidateSize();render();fit();});},fit,focus(s){if(map&&s.lat!=null)map.setView([s.lat,s.lon],14);},clearPosition(){origin=null;render();}};
}
