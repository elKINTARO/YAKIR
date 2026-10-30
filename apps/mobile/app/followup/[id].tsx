import { router } from 'expo-router';

import { t } from '@/i18n';
import { Button, Screen, Text } from '@/ui';

/**
 * Placeholder until the follow-up flow lands. Reminder taps already route
 * here with the episode id, so the route contract exists before the screen.
 */
export default function FollowupScreen() {
  return (
    <Screen className="px-6 pb-4">
      <Text variant="title" className="mt-4 flex-1">
        {t('followup.question')}
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
