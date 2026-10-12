export const SUPPLIER_AREAS={'02':'Aisne','08':'Ardennes','10':'Aube','27':'Eure','51':'Marne','59':'Nord','60':'Oise','62':'Pas-de-Calais','76':'Seine-Maritime','77':'Seine-et-Marne','80':'Somme','95':'Val-d’Oise','BE-HAI':'Hainaut','BE-VWV':'Flandre-Occidentale'};
export const SUPPLIER_CATEGORIES=['Panneaux','Bois massif','Scierie','Quincaillerie','Finition','Bricolage','Usinage','Affûtage'];
export const supplierCountry=s=>s.country||'FR';
export const supplierArea=s=>SUPPLIER_AREAS[s.department]||s.department;
const normalize=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function validateSuppliers(data){
 if(!Array.isArray(data)||data.length>5000)throw new Error('Données fournisseurs invalides.');const ids=new Set();
 for(const s of data){if(!s||!Number.isInteger(s.id)||s.id<=0||ids.has(s.id)||!['FR','BE'].includes(supplierCountry(s))||!SUPPLIER_CATEGORIES.includes(s.category)||!['name','address','phone','email','url','description','department','checked'].every(k=>typeof s[k]==='string')||!Array.isArray(s.tags)||s.tags.some(t=>typeof t!=='string'))throw new Error('Fiche fournisseur invalide.');ids.add(s.id);const url=new URL(s.url);if(url.protocol!=='https:'||!/^\d{4}-\d{2}-\d{2}$/.test(s.checked))throw new Error('Source fournisseur invalide.');if((s.lat==null)!==(s.lon==null)||(s.lat!=null&&(!Number.isFinite(s.lat)||!Number.isFinite(s.lon)||Math.abs(s.lat)>90||Math.abs(s.lon)>180)))throw new Error('Position fournisseur invalide.');}
 return data;
}
export function supplierDistance(s,origin){
 if(!origin||s.lat==null||s.lon==null)return null;
 const rad=x=>x*Math.PI/180,a=rad(s.lat-origin[0]),b=rad(s.lon-origin[1]),v=Math.sin(a/2)**2+Math.cos(rad(origin[0]))*Math.cos(rad(s.lat))*Math.sin(b/2)**2;
 return 6371*2*Math.asin(Math.sqrt(Math.max(0,Math.min(1,v))));
}
export function filterSuppliers(data,{search='',country='',area='',category='',service='',onlyFavorites=false,favorites=[],origin=null}={}){
 const q=normalize(search.trim());return data.filter(s=>(!country||supplierCountry(s)===country)&&(!area||s.department===area)&&(!category||s.category===category)&&(!service||s.tags.includes(service))&&(!onlyFavorites||favorites.includes(s.id))&&(!q||normalize([s.name,s.address,s.description,s.category,supplierArea(s),supplierCountry(s)==='BE'?'Belgique':'France',...s.tags].join(' ')).includes(q))).sort((a,b)=>{if(origin){const distance=(supplierDistance(a,origin)??Infinity)-(supplierDistance(b,origin)??Infinity);if(distance)return distance;}return a.name.localeCompare(b.name,'fr')||a.id-b.id;});
}
export function supplierAreas(data,country=''){return [...new Set(data.filter(s=>!country||supplierCountry(s)===country).map(s=>s.department))].sort();}
export function supplierDirections(s){return 'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(s.name+' '+s.address);}
export function supplierGeoText(s){return s.lat==null?'Position non disponible':s.geoType==='official_point'?'Point d’accès publié par l’établissement':s.geoType==='housenumber'&&s.geoScore>=.8?'Repère géocodé à l’adresse':s.geoType==='street'?'Repère approximatif à la rue':'Repère approximatif — position à confirmer';}
export function readSupplierPreferences(storage){
 try{const f=JSON.parse(storage.getItem('wp-supplier-favorites')),n=JSON.parse(storage.getItem('wp-supplier-notes'));return {favorites:Array.isArray(f)?[...new Set(f.filter(id=>Number.isInteger(id)&&id>0))]:[],notes:n&&typeof n==='object'&&!Array.isArray(n)?Object.fromEntries(Object.entries(n).filter(([id,v])=>/^\d+$/.test(id)&&typeof v==='string').map(([id,v])=>[id,v.slice(0,4000)])):{}};}catch{return {favorites:[],notes:{}};}
}
