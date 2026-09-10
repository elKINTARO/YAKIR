import * as Haptics from 'expo-haptics';
import { useCallback, useMemo, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { ACCENT } from './colors';
import { ratioFromValue, valueFromRatio } from './slider-math';
import { Text } from './Text';

const MIN = 0;
const MAX = 100;
const STEP = 5;

export interface ProbabilitySliderProps {
  value: number;
  onChange: (value: number) => void;
  accessibilityLabel: string;
}

export function ProbabilitySlider({
  value,
  onChange,
  accessibilityLabel,
}: ProbabilitySliderProps) {
  const [width, setWidth] = useState(0);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  }, []);

  const setFromPosition = useCallback(
    (x: number) => {
      const ratio = width === 0 ? 0 : x / width;
      const next = valueFromRatio(ratio, MIN, MAX, STEP);
      if (next === value) {
        return;
      }
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChange(next);
    },
    [width, onChange, value],
  );

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .minDistance(0)
        .onBegin((event) => {
          setFromPosition(event.x);
        })
        .onUpdate((event) => {
          setFromPosition(event.x);
        }),
    [setFromPosition],
  );

  const fillRatio = ratioFromValue(value, MIN, MAX);
  const label = `${value}%`;

  return (
    <View className="w-full items-center">
      <Text variant="number" accessibilityElementsHidden>
        {label}
      </Text>

      <GestureDetector gesture={pan}>
        <View
          accessibilityRole="adjustable"
          accessibilityLabel={accessibilityLabel}
          accessibilityValue={{ min: MIN, max: MAX, now: value }}
          onLayout={onLayout}
          className="mt-8 h-16 w-full justify-center overflow-hidden rounded-3xl border border-line bg-raised"
        >
          <View
            className="h-full"
            style={{ width: `${fillRatio * 100}%`, backgroundColor: ACCENT }}
          />
        </View>
      </GestureDetector>
    </View>
  );
}
