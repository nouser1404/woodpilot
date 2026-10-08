import { calculateBending, formatMeasure, bendingText } from './cintrage.js';
import { editMeasurement } from './measurement-input.js';

export function createBendingTool({ share, haptic }) {
  let chord = 800, sagitta = 120;
  const root = document.querySelector('#bendingTool');
  function render() {
    const result = calculateBending(chord, sagitta);
    root.querySelector('#chordValue').textContent = `${formatMeasure(chord)} mm`;
    root.querySelector('#sagittaValue').textContent = `${formatMeasure(sagitta)} mm`;
    root.querySelector('#radiusValue').textContent = `${formatMeasure(result.radius)} mm`;
    root.querySelector('#arcValue').textContent = `${formatMeasure(result.arcLength)} mm`;
    root.querySelector('#angleValue').textContent = `${formatMeasure(result.angle)}°`;
    // Échelle uniforme : la flèche conserve ses proportions avec la corde.
    const height = 260 * sagitta / chord;
    const radius = 260 * result.radius / chord;
    root.querySelector('#bendingArc').setAttribute('d', `M 40 175 A ${radius} ${radius} 0 0 1 300 175`);
    root.querySelector('#sagittaLine').setAttribute('y1', String(175 - height));
  }
  root.querySelectorAll('[data-measurement]').forEach(button => {
    button.onclick = () => {
      const isChord = button.dataset.measurement === 'chord';
      editMeasurement({
        label: isChord ? 'Corde' : 'Flèche', value: isChord ? chord : sagitta, trigger: button,
        onConfirm: value => {
          calculateBending(isChord ? value : chord, isChord ? sagitta : value);
          if (isChord) chord = value; else sagitta = value;
          render(); haptic();
        },
      });
    };
  });
  render();
  return { root, snapshot() { return {chord,sagitta}; }, load(data) { calculateBending(data.chord,data.sagitta);chord=data.chord;sagitta=data.sagitta;render(); }, text() { return bendingText(chord,sagitta); }, open() { root.showModal(); }, close() { root.close(); } };
}
