import { formatMeasure } from './cintrage.js';

/** Triangle rectangle : base horizontale et hauteur en mm. */
export function calculateSlope(run, rise) {
  if (!Number.isFinite(run) || !Number.isFinite(rise) || run <= 0 || rise < 0 || run > 1000000 || rise > 1000000) {
    throw new RangeError('La base doit être positive et la hauteur positive ou nulle, avec un maximum de 1 000 000 mm.');
  }
  const angle = Math.atan2(rise, run) * 180 / Math.PI;
  return { diagonal: Math.hypot(run, rise), percent: rise / run * 100, angle, complementaryAngle: 90 - angle };
}
export function slopeText(run, rise) {
  const result = calculateSlope(run, rise);
  return `WoodPilot — Pente / Diagonale\nTriangle rectangle\nBase horizontale : ${formatMeasure(run)} mm\nHauteur : ${formatMeasure(rise)} mm\nDiagonale théorique : ${formatMeasure(result.diagonal)} mm\nPente : ${formatMeasure(result.percent)} %\nAngle par rapport à l’horizontale : ${formatMeasure(result.angle)}°\nAngle par rapport à la verticale : ${formatMeasure(result.complementaryAngle)}°\nPour l’équerrage, comparer la diagonale mesurée à cette valeur théorique et contrôler les deux diagonales.`;
}
