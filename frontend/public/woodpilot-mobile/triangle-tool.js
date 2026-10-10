import {calculateTriangle,triangleText,TRIANGLE_MODES,TRIANGLE_LABELS} from './triangle.js';
import {editMeasurement} from './measurement-input.js';
import {formatMeasure} from './cintrage.js';
export function createTriangleTool({haptic}){
 let data={mode:'legs',adjacent:800,opposite:600};
 const root=document.querySelector('#triangleTool'),mode=root.querySelector('[data-triangle-mode]');
 function render(){
  const r=calculateTriangle(data);mode.value=data.mode;
  root.querySelectorAll('[data-triangle-input]').forEach((button,i)=>{const key=TRIANGLE_MODES[data.mode][i];button.dataset.key=key;button.setAttribute('aria-label',`Modifier ${TRIANGLE_LABELS[key]}`);button.querySelector('small').textContent=TRIANGLE_LABELS[key];button.querySelector('strong').textContent=`${formatMeasure(data[key])}${key==='angle'?'°':' mm'}`;});
  for(const key of ['adjacent','opposite','hypotenuse','angle','complement','percent'])root.querySelector(`[data-triangle-result="${key}"]`).textContent=`${formatMeasure(r[key])}${['angle','complement'].includes(key)?'°':key==='percent'?' %':' mm'}`;
  const scale=Math.min(240/r.adjacent,145/r.opposite),x=60+r.adjacent*scale,y=205-r.opposite*scale;
  root.querySelector('[data-triangle-path]').setAttribute('d',`M60 205H${x}V${y}Z`);
  const label=(key,x,y,text)=>{const el=root.querySelector(`[data-triangle-label="${key}"]`);el.setAttribute('x',x);el.setAttribute('y',y);el.textContent=text;};
  label('adjacent',(60+x)/2,233,`${formatMeasure(r.adjacent)} mm`);label('opposite',x+8,(205+y)/2,`${formatMeasure(r.opposite)} mm`);label('hypotenuse',(60+x)/2-10,(205+y)/2-12,`${formatMeasure(r.hypotenuse)} mm`);label('angle',75,190,`α ${formatMeasure(r.angle)}°`);
 }
 mode.onchange=()=>{const r=calculateTriangle(data);data={mode:mode.value,...Object.fromEntries(TRIANGLE_MODES[mode.value].map(key=>[key,r[key]]))};render();};
 root.querySelectorAll('[data-triangle-input]').forEach(button=>button.onclick=()=>{const key=button.dataset.key;editMeasurement({label:TRIANGLE_LABELS[key],value:data[key],unit:key==='angle'?'°':'mm',min:.001,max:key==='angle'?89.999:1000000,trigger:button,onConfirm(value){const next={...data,[key]:value};calculateTriangle(next);data=next;render();haptic();}});});
 render();return {root,open(){root.showModal();},snapshot(){return {...data};},load(next){calculateTriangle(next);data={...next};render();},text(){return triangleText(data);}};
}
