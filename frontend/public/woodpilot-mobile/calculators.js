import { formatMeasure } from './cintrage.js';
export function calculateMiter(interiorAngle) {
  if (!Number.isFinite(interiorAngle) || interiorAngle <= 0 || interiorAngle >= 180) {
    throw new RangeError('L’angle intérieur doit être compris strictement entre 0° et 180°.');
  }
  return { miter: 90 - interiorAngle / 2, halfAngle: interiorAngle / 2 };
}
/** Espaces égaux entre les éléments, et éventuellement aux deux extrémités. */
export function calculateSpacing(length, width, count, endGaps = true) {
  if (![length,width].every(Number.isFinite) || length <= 0 || length > 1000000 || width <= 0 || !Number.isInteger(count) || count < 2 || count > 100) {
    throw new RangeError('Indiquez une longueur positive (max. 1 000 000 mm), une largeur positive et 2 à 100 éléments.');
  }
  if (typeof endGaps !== 'boolean') throw new RangeError('Choisissez le mode d’espacement.');
  const free = length - width * count;
  if (free < 0) throw new RangeError('Les éléments dépassent la longueur disponible.');
  const gap = free / (endGaps ? count + 1 : count - 1);
  const pitch = width + gap;
  const positions = Array.from({length:count}, (_, index) => (endGaps ? gap : 0) + width / 2 + index * pitch);
  return { gap, pitch, positions };
}
export function miterText(angle) {
  const result = calculateMiter(angle);
  return `WoodPilot — Angles de coupe\nAssemblage à deux coupes égales, dans un même plan\nAngle intérieur : ${formatMeasure(angle)}°\nRéglage d’onglet de chaque coupe : ${formatMeasure(result.miter)}°\nRéférence : scie à 0° = coupe d’équerre. Sans inclinaison de lame.\nAngle de chaque coupe par rapport au bord : ${formatMeasure(result.halfAngle)}°`;
}
export function spacingText(length,width,count,endGaps) {
  const result = calculateSpacing(length,width,count,endGaps);
  return `WoodPilot — Répartition\nLongueur disponible : ${formatMeasure(length)} mm\n${count} éléments de ${formatMeasure(width)} mm\n${endGaps ? 'Espaces identiques aux extrémités et entre éléments' : 'Premier et dernier éléments au bord'}\nEspace libre : ${formatMeasure(result.gap)} mm\nEntraxe : ${formatMeasure(result.pitch)} mm\nAxes depuis le bord gauche :\n${result.positions.map((position,i) => `${i+1} : ${formatMeasure(position)} mm`).join('\n')}`;
}
