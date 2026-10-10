import {calculateHelix,helixText} from './helix.js';
import {editMeasurement} from './measurement-input.js';
import {formatMeasure} from './cintrage.js';
export function createHelixTool({haptic}){
 let data={radius:300,height:1000,turns:1};const root=document.querySelector('#helixTool');
 const labels={radius:'Rayon de la ligne mesurée',height:'Hauteur totale',turns:'Nombre de tours'};
 function render(){const r=calculateHelix(data);for(const key of Object.keys(labels))root.querySelector(`[data-helix-value="${key}"]`).textContent=`${formatMeasure(data[key])}${key==='turns'?'':' mm'}`;
 for(const key of ['length','run','pitch','angle','percent','rotation'])root.querySelector(`[data-helix-result="${key}"]`).textContent=`${formatMeasure(r[key])}${['angle','rotation'].includes(key)?'°':key==='percent'?' %':' mm'}`;
 const scale=Math.min(250/r.run,135/Math.max(data.height,1)),x=45+r.run*scale,y=185-data.height*scale;
 root.querySelector('[data-helix-path]').setAttribute('d',`M45 185H${x}V${y}Z`);root.querySelector('[data-helix-run]').setAttribute('x',(45+x)/2);root.querySelector('[data-helix-run]').textContent=`${formatMeasure(r.run)} mm`;root.querySelector('[data-helix-rise]').setAttribute('x',x+8);root.querySelector('[data-helix-rise]').setAttribute('y',(185+y)/2);root.querySelector('[data-helix-rise]').textContent=`${formatMeasure(data.height)} mm`;
 }
 root.querySelectorAll('[data-helix-input]').forEach(button=>button.onclick=()=>{const key=button.dataset.helixInput;editMeasurement({label:labels[key],value:data[key],unit:key==='turns'?'tour(s)':'mm',min:key==='height'?0:.001,max:key==='turns'?100:1000000,trigger:button,onConfirm(value){const next={...data,[key]:value};calculateHelix(next);data=next;render();haptic();}});});
 render();return {root,open(){root.showModal();},snapshot(){return {...data};},load(next){calculateHelix(next);data={...next};render();},text(){return helixText(data);}};
}
