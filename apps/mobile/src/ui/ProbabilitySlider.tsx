import { ACCENT } from './colors';
import { HorizontalScale } from './HorizontalScale';

const formatPercent = (value: number) => `${value}%`;
const accent = () => ACCENT;

export interface ProbabilitySliderProps {
  value: number | null;
  onChange: (value: number) => void;
  accessibilityLabel: string;
}

export function ProbabilitySlider(props: ProbabilitySliderProps) {
  return (
    <HorizontalScale
      {...props}
      min={0}
      max={100}
      step={5}
      format={formatPercent}
      colorFor={accent}
    />
  );
}
