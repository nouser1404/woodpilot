export function parseNumber(value, { min = Number.MIN_VALUE, max = 1000000, integer = false } = {}) {
  const normalized = String(value).trim().replace(',', '.');
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) throw new RangeError('Saisissez un nombre valide.');
  const number = Number(normalized);
  if (!Number.isFinite(number) || number < min || number > max || (integer && !Number.isInteger(number))) {
    throw new RangeError(`Valeur attendue : ${min === Number.MIN_VALUE ? 'supérieure à 0' : 'au moins '+min} et au plus ${max}${integer ? ', nombre entier' : ''}.`);
  }
  return number;
}
export function adjustNumber(value, delta) {
  const number = Number(String(value).replace(',', '.'));
  return Math.round((number + delta) * 1000000) / 1000000;
}
