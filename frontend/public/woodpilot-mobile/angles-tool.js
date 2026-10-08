import { calculateMiter, miterText } from './calculators.js';
import { formatMeasure } from './cintrage.js';
import { editMeasurement } from './measurement-input.js';
export function createAnglesTool({haptic}) {
  let angle=90;
  const root=document.querySelector('#anglesTool');
  function render() {
    const result=calculateMiter(angle);
    root.querySelector('[data-angle-value]').textContent=`${formatMeasure(angle)}°`;
    root.querySelector('[data-miter]').textContent=`${formatMeasure(result.miter)}°`;
    root.querySelector('[data-half]').textContent=`${formatMeasure(result.halfAngle)}°`;
    const radians=angle*Math.PI/180;
    root.querySelector('[data-angle-line]').setAttribute('d',`M70 185H290 M70 185L${70+160*Math.cos(radians)} ${185-160*Math.sin(radians)}`);
  }
  root.querySelector('[data-measurement]').onclick=event=>editMeasurement({label:'Angle intérieur',unit:'°',value:angle,max:179.999,min:.001,trigger:event.currentTarget,onConfirm(value){calculateMiter(value);angle=value;render();haptic();}});
  render();
  return {root,open(){root.showModal();},snapshot(){return {angle};},load(data){calculateMiter(data.angle);angle=data.angle;render();},text(){return miterText(angle);}};
}
