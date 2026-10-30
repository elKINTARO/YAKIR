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
  /** Null until the person touches the scale: a preset value would anchor
   * the answer. */
  value: number | null;
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

  // The gesture must not depend on `value`. Rebuilding it on every notch made
  // the detector reattach mid-drag and drop the tail of the movement, so the
  // last emitted value lives in the gesture's own closure instead.
  const pan = useMemo(() => {
    const drag: { last: number | null } = { last: null };

    const setFromPosition = (x: number) => {
      const ratio = width === 0 ? 0 : x / width;
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
          setFromPosition(event.x);
        })
        .onUpdate((event) => {
          setFromPosition(event.x);
        })
        // Where the finger lifts is the answer, even if no move was reported
        // after the last update.
        .onEnd((event) => {
          setFromPosition(event.x);
        })
    );
  }, [width, onChange]);

  const fillRatio = value === null ? 0 : ratioFromValue(value, MIN, MAX);
  const label = value === null ? '—' : `${value}%`;

  return (
    <View className="w-full items-center">
      <Text variant="number" accessibilityElementsHidden>
        {label}
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
