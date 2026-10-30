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
  /** Null until the person touches the scale: a preset value would anchor
   * the answer. */
  value: number | null;
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

  // The gesture must not depend on `value`. Rebuilding it on every notch made
  // the detector reattach mid-drag and drop the tail of the movement, so the
  // last emitted value lives in the gesture's own closure instead.
  const pan = useMemo(() => {
    const drag: { last: number | null } = { last: null };

    const setFromPosition = (y: number) => {
      const ratio = height === 0 ? 0 : 1 - y / height;
      const next = valueFromRatio(ratio, MIN, MAX, STEP);
      if (next === drag.last) {
        return;
      }
      drag.last = next;
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChange(next);
    };

    return (
      Gesture.Pan()
        .runOnJS(true)
        .minDistance(0)
        .onBegin((event) => {
          drag.last = null;
          setFromPosition(event.y);
        })
        .onUpdate((event) => {
          setFromPosition(event.y);
        })
        // Where the finger lifts is the answer, even if no move was reported
        // after the last update.
        .onEnd((event) => {
          setFromPosition(event.y);
        })
    );
  }, [height, onChange]);

  const fillRatio = value === null ? 0 : ratioFromValue(value, MIN, MAX);

  return (
    <View className="flex-1 items-center justify-center">
      <Text variant="number" accessibilityElementsHidden>
        {value === null ? '—' : String(value)}
      </Text>

      <GestureDetector gesture={pan}>
        <View
          accessibilityRole="adjustable"
          accessibilityLabel={accessibilityLabel}
          accessibilityValue={
            value === null
              ? { min: MIN, max: MAX }
              : { min: MIN, max: MAX, now: value }
          }
          onLayout={onLayout}
          className="mt-6 w-24 flex-1 justify-end overflow-hidden rounded-3xl border border-line bg-raised"
        >
          <View
            style={{
              height: `${fillRatio * 100}%`,
              backgroundColor: intensityColor(value ?? 0),
            }}
          />
        </View>
      </GestureDetector>
    </View>
  );
}
