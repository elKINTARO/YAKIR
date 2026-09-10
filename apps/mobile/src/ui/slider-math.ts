export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function valueFromRatio(
  ratio: number,
  min: number,
  max: number,
  step: number,
): number {
  const raw = min + clamp(ratio, 0, 1) * (max - min);
  const stepped = Math.round((raw - min) / step) * step + min;
  return clamp(stepped, min, max);
}

export function ratioFromValue(
  value: number,
  min: number,
  max: number,
): number {
  if (max === min) {
    return 0;
  }
  return clamp((value - min) / (max - min), 0, 1);
}
