import { intensityColor } from './colors';
import { HorizontalScale } from './HorizontalScale';

const formatOutOfTen = (value: number) => `${value}/10`;

export interface ImpactSliderProps {
  value: number | null;
  onChange: (value: number) => void;
  accessibilityLabel: string;
}

/** 0-10 on the same colour ramp as intensity, so that "how bad it actually
 * was" reads on the same scale as "how strong it felt". */
export function ImpactSlider(props: ImpactSliderProps) {
  return (
    <HorizontalScale
      {...props}
      min={0}
      max={10}
      step={1}
      format={formatOutOfTen}
      colorFor={intensityColor}
      size="compact"
    />
  );
}
