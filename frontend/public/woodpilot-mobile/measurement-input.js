import { calculateExpression } from './expression.js';
import { createWheelPicker } from './wheel-picker.js';
import { parseNumber, adjustNumber } from './number-model.js';
/** Saisie universelle de cote, angle ou nombre d'éléments. */
export function editMeasurement({ label, value, onConfirm, trigger, min = Number.MIN_VALUE, max = 1000000, unit = 'mm', integer = false }) {
  const sheet = document.querySelector('#measurementSheet');
  const display = sheet.querySelector('input');
  const error = sheet.querySelector('[role="alert"]');
  sheet.querySelector('h2').textContent = `${label}${unit ? ' ('+unit+')' : ''}`;
  display.setAttribute('aria-label', `Valeur${unit ? ' en '+unit : ''}`);
  const presets=sheet.querySelector('[data-thickness-picker]');presets.replaceChildren();
  const standardThickness=unit==='mm'&&/épaisseur/i.test(label);presets.hidden=!standardThickness;
  if(standardThickness){const picker=createWheelPicker(presets,{values:[8,10,12,15,16,18,19,22,25,30,38],value,onChange(number){display.value=String(number);replace=false;},haptic(){navigator.vibrate?.(8);},label:'Épaisseur courante',unit:'mm'});requestAnimationFrame(()=>picker.set(value));}
  display.value = String(value).replace('.', ','); error.textContent = '';
  sheet.querySelector('[data-key=","]').disabled = integer;
  sheet.querySelector('[data-key="sign"]').hidden = min >= 0;
  for (const [key,sign] of [['minus','−'],['plus','+']]) sheet.querySelector(`[data-key="${key}"]`).textContent = `${sign}1${unit ? ' '+unit : ''}`;
  let replace = true;
  const update = key => {
    error.textContent = '';
    if (key === 'sign') display.value = display.value.startsWith('-') ? display.value.slice(1) : '-'+display.value;
    else if (key === 'backspace') display.value = display.value.slice(0, -1);
    else if (['minus','plus','minus5','plus5'].includes(key)) {
      const number = adjustNumber(calculateExpression(display.value),key.startsWith('plus') ? (key.endsWith('5')?5:1) : (key.endsWith('5')?-5:-1));
      if (Number.isFinite(number)) display.value = String(Math.min(max, Math.max(min === Number.MIN_VALUE ? 0 : min, number))).replace('.', ',');
    } else {
      if (replace&&!['+','-','*','/'].includes(key)) display.value = '';
      if (display.value.length < 120) display.value += key;
    }
    replace = false;
  };
  sheet.querySelectorAll('[data-key]').forEach(button => button.onclick = () => {try{update(button.dataset.key);}catch(reason){error.textContent=reason.message;}});
  sheet.querySelector('form').onsubmit = event => {
    event.preventDefault();
    try { onConfirm(parseNumber(calculateExpression(display.value),{min,max,integer})); sheet.close(); }
    catch (reason) { error.textContent = reason.message; }
  };
  sheet.querySelector('[data-close]').onclick = () => sheet.close();
  sheet.onclose = () => trigger?.focus();
  sheet.showModal(); sheet.querySelector('[data-key="7"]').focus();
  display.oninput = () => { replace = false; error.textContent = ''; };
}
