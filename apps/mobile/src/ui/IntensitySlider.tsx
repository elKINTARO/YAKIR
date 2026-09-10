import * as Haptics from 'expo-haptics';
import { useCallback, useMemo, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { intensityColor } from './colors';
import { ratioFromValue, valueFromRatio } from './slider-math';
import { Text } from './Text';

const MIN = 0;
const MAX = 10;
const STEP = 1;

export interface IntensitySliderProps {
  value: number;
  onChange: (value: number) => void;
  accessibilityLabel: string;
}

export function IntensitySlider({
  value,
  onChange,
  accessibilityLabel,
}: IntensitySliderProps) {
  const [height, setHeight] = useState(0);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setHeight(event.nativeEvent.layout.height);
  }, []);

  const setFromPosition = useCallback(
    (y: number) => {
      const ratio = height === 0 ? 0 : 1 - y / height;
      const next = valueFromRatio(ratio, MIN, MAX, STEP);
      if (next === value) {
        return;
      }
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChange(next);
    },
    [height, onChange, value],
  );

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .minDistance(0)
        .onBegin((event) => {
          setFromPosition(event.y);
        })
        .onUpdate((event) => {
          setFromPosition(event.y);
        }),
    [setFromPosition],
  );

  const fillRatio = ratioFromValue(value, MIN, MAX);

  return (
    <View className="flex-1 items-center justify-center">
      <Text variant="number" accessibilityElementsHidden>
        {String(value)}
      </Text>

      <GestureDetector gesture={pan}>
        <View
          accessibilityRole="adjustable"
          accessibilityLabel={accessibilityLabel}
          accessibilityValue={{ min: MIN, max: MAX, now: value }}
          onLayout={onLayout}
          className="mt-6 w-24 flex-1 justify-end overflow-hidden rounded-3xl border border-line bg-raised"
        >
          <View
            style={{
              height: `${fillRatio * 100}%`,
              backgroundColor: intensityColor(value),
            }}
          />
        </View>
      </GestureDetector>
    </View>
  );
}
