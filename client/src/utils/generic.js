export function roundToTwo(value) {
  const num = Number(value);
  if (isNaN(num)) return NaN;
  return Math.round((num + Number.EPSILON) * 100) / 100;
}