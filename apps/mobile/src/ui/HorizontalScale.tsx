import * as Haptics from 'expo-haptics';
import { useCallback, useMemo, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { ratioFromValue, valueFromRatio } from './slider-math';
import { Text } from './Text';

export interface HorizontalScaleProps {
  /** Null until the person touches the scale: a preset value would anchor
   * the answer. */
  value: number | null;
  onChange: (value: number) => void;
  accessibilityLabel: string;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  colorFor: (value: number) => string;
  /** Large number above the track, or a compact one for forms with several
   * questions on one screen. */
  size?: 'large' | 'compact';
}

export function HorizontalScale({
  value,
  onChange,
  accessibilityLabel,
  min,
  max,
  step,
  format,
  colorFor,
  size = 'large',
}: HorizontalScaleProps) {
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
      const next = valueFromRatio(ratio, min, max, step);
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
  }, [width, onChange, min, max, step]);

  const fillRatio = value === null ? 0 : ratioFromValue(value, min, max);
  const label = value === null ? '—' : format(value);
  const large = size === 'large';

  return (
    <View className="w-full items-center">
      <Text variant={large ? 'number' : 'question'} accessibilityElementsHidden>
        {label}
      </Text>

      <GestureDetector gesture={pan}>
        <View
          accessibilityRole="adjustable"
          accessibilityLabel={accessibilityLabel}
          accessibilityValue={
            value === null
              ? { min, max }
              : { min, max, now: value, text: format(value) }
          }
          onLayout={onLayout}
          className={`${large ? 'mt-8 h-16' : 'mt-3 h-14'} w-full justify-center overflow-hidden rounded-3xl border border-line bg-raised`}
        >
          <View
            className="h-full"
            style={{
              width: `${fillRatio * 100}%`,
              backgroundColor: value === null ? 'transparent' : colorFor(value),
            }}
          />
        </View>
      </GestureDetector>
    </View>
  );
}
