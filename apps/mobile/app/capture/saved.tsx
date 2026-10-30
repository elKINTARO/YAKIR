import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { useDraft } from '@/capture/use-draft';
import { followupDay } from '@/domain/capture';
import { t } from '@/i18n';
import { formatClock } from '@/i18n/format';
import { Button, Screen, Text } from '@/ui';

const CONFIRMATION_MS = 2000;

export default function SavedConfirmation() {
  const saved = useDraft((state) => state.saved);
  // Any touch keeps the screen open: two seconds is enough to read the line,
  // not enough to reach for the exercise button with a shaking hand. The hint
  // about disabled reminders is longer, so it holds the screen from the start.
  const [held, setHeld] = useState(saved?.remindersOff ?? false);

  useEffect(() => {
    if (held || !saved) {
      return;
    }
    const timer = setTimeout(() => {
      router.dismissTo('/');
    }, CONFIRMATION_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [held, saved]);

  if (!saved) {
    return <Redirect href="/" />;
  }

  const time = formatClock(saved.followupAt, saved.tzOffset);
  const message =
    followupDay(saved.createdAt, saved.followupAt, saved.tzOffset) ===
    'tomorrow'
      ? t('capture.saved.tomorrow', { time })
      : t('capture.saved.dayAfterTomorrow', { time });

  return (
    <Screen className="px-6 pb-4">
      <View
        className="flex-1"
        onTouchStart={() => {
          setHeld(true);
        }}
      >
        <View className="flex-[2] justify-center">
          <Text variant="question" accessibilityLiveRegion="polite">
            {message}
          </Text>
          {saved.remindersOff ? (
            <Text variant="muted" className="mt-6">
              {t('notify.disabledHint')}
            </Text>
          ) : null}
        </View>

        <View className="flex-1 justify-end">
          <Button
            large
            label={t('common.done')}
            onPress={() => {
              router.dismissTo('/');
            }}
          />
          <Button
            tone="secondary"
            label={t('capture.exerciseNow')}
            onPress={() => {
              router.dismissTo('/');
              router.push({
                pathname: '/exercises',
                params: { episodeId: saved.episodeId },
              });
            }}
            className="mt-3"
          />
        </View>
      </View>
    </Screen>
  );
}
