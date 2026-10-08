/** Arc circulaire mineur : corde et flèche en mm, angle en degrés. */
export function calculateBending(chord, sagitta) {
  if (!Number.isFinite(chord) || !Number.isFinite(sagitta) || chord <= 0 || sagitta <= 0) {
    throw new RangeError('La corde et la flèche doivent être supérieures à zéro.');
  }
  if (chord > 1000000 || sagitta < 0.001) {
    throw new RangeError('Corde maximale : 1 000 000 mm. Flèche minimale : 0,001 mm.');
  }
  if (sagitta > chord / 2) {
    throw new RangeError('Pour cet arc mineur, la flèche ne peut pas dépasser la demi-corde.');
  }
  const radius = chord * chord / (8 * sagitta) + sagitta / 2;
  const radians = 4 * Math.atan2(2 * sagitta, chord);
  return { radius, arcLength: radius * radians, angle: radians * 180 / Math.PI };
}
export const formatMeasure = value => new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 1,
}).format(value);
export function bendingText(chord, sagitta) {
  const result = calculateBending(chord, sagitta);
  return `WoodPilot — Cintrage (arc circulaire mineur)\nCorde : ${formatMeasure(chord)} mm\nFlèche : ${formatMeasure(sagitta)} mm\nRayon : ${formatMeasure(result.radius)} mm\nLongueur d’arc : ${formatMeasure(result.arcLength)} mm\nAngle au centre : ${formatMeasure(result.angle)}°`;
}
