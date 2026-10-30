import { router } from 'expo-router';

import { t } from '@/i18n';
import { Button, Screen, Text } from '@/ui';

/**
 * Placeholder until the exercise library lands. It already receives the
 * episodeId parameter from the capture confirmation, so the route contract
 * exists before the screen does.
 */
export default function ExercisesScreen() {
  return (
    <Screen className="px-6 pb-4">
      <Text variant="title" className="mt-4 flex-1">
        {t('exercises.title')}
      </Text>
      <Button
        tone="quiet"
        label={t('common.back')}
        onPress={() => {
          router.back();
        }}
      />
    </Screen>
  );
}
