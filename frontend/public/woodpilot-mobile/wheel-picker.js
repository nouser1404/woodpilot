/** Sélecteur discret vertical avec snap et alternatives au geste. */
export function createWheelPicker(root, { values, value, onChange, haptic, label="Nombre d’éléments", unit="éléments" }) {
  const list = document.createElement('div'); list.className = 'picker-list';
  list.setAttribute('role','group'); list.setAttribute('aria-label',label);
  let current = value, programmatic = false;
  values.forEach(number => {
    const button = document.createElement('button'); button.type='button'; button.textContent = String(number);
    button.setAttribute('aria-label', `${number} ${unit}`);
    button.onclick = () => commit(number,true); list.append(button);
  });
  root.append(list);
  function commit(number, scroll) {
    try { onChange(number); current = number; haptic(); }
    catch (error) { root.dispatchEvent(new CustomEvent('pickererror',{detail:error.message})); }
    list.querySelectorAll('button').forEach((button,index) => button.setAttribute('aria-pressed', String(values[index] === current)));
    if (scroll) {
      programmatic = true;
      list.scrollTo({top: values.indexOf(current)*48, behavior:'instant'});
      requestAnimationFrame(() => programmatic = false);
    }
  }
  let timer;
  list.onscroll = () => {
    if (programmatic) return;
    clearTimeout(timer); timer = setTimeout(() => {
      const index = Math.max(0,Math.min(values.length-1,Math.round(list.scrollTop/48)));
      if (values[index] !== current) commit(values[index],true);
    },160);
  };
  return { set(number) { current=number; list.querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-pressed',String(values[i]===number))); programmatic=true;list.scrollTop=Math.max(0,values.indexOf(number))*48;requestAnimationFrame(()=>programmatic=false); } };
}
