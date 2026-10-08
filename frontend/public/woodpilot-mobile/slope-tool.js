import { calculateSlope, slopeText } from './slope.js';
import { formatMeasure } from './cintrage.js';
import { editMeasurement } from './measurement-input.js';

export function createSlopeTool({ share, haptic }) {
  let run = 800, rise = 600;
  const root = document.querySelector('#slopeTool');
  function render() {
    const result = calculateSlope(run, rise);
    root.querySelector('#runValue').textContent = `${formatMeasure(run)} mm`;
    root.querySelector('#riseValue').textContent = `${formatMeasure(rise)} mm`;
    root.querySelector('#diagonalValue').textContent = `${formatMeasure(result.diagonal)} mm`;
    root.querySelector('#slopePercent').textContent = `${formatMeasure(result.percent)} %`;
    root.querySelector('#slopeAngle').textContent = `${formatMeasure(result.angle)}°`;
    root.querySelector('#complementaryAngle').textContent = `${formatMeasure(result.complementaryAngle)}°`;
    const scale = Math.min(240 / run, 140 / Math.max(rise, 1));
    const x = 40 + run * scale, y = 175 - rise * scale;
    root.querySelector('#slopeTriangle').setAttribute('d', `M40 175H${x}V${y}`);
    root.querySelector('#slopeDiagonal').setAttribute('d', `M40 175L${x} ${y}`);
  }
  root.querySelectorAll('[data-measurement]').forEach(button => button.onclick = () => {
    const isRun = button.dataset.measurement === 'run';
    editMeasurement({ label: isRun ? 'Base horizontale' : 'Hauteur', value: isRun ? run : rise,
      min: isRun ? 0.001 : 0, trigger: button,
      onConfirm(value) {
        calculateSlope(isRun ? value : run, isRun ? rise : value);
        if (isRun) run = value; else rise = value;
        render(); haptic();
      },
    });
  });
  render();
  return { root, snapshot() { return {run,rise}; }, load(data) { calculateSlope(data.run,data.rise);run=data.run;rise=data.rise;render(); }, text() { return slopeText(run,rise); }, open() { root.showModal(); }, close() { root.close(); } };
}
