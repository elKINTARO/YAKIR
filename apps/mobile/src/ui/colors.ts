export const INTENSITY_SCALE = [
  '#6E9490',
  '#7A9A8E',
  '#879F8B',
  '#96A487',
  '#A6A883',
  '#B5A87E',
  '#BFA278',
  '#C69972',
  '#C98D6B',
  '#C78065',
  '#C4725F',
] as const;

export function intensityColor(value: number): string {
  const index = Math.min(
    INTENSITY_SCALE.length - 1,
    Math.max(0, Math.round(value)),
  );
  return INTENSITY_SCALE[index] ?? INTENSITY_SCALE[0];
}

export const ACCENT = '#3A6A64';
export const ACCENT_DARK = '#7CA8A0';
