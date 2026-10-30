import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { CaptureStep } from '@/capture/CaptureStep';
import { draftStore } from '@/capture/draft-store';
import { saveDraft } from '@/capture/save';
import { useDraft } from '@/capture/use-draft';
import { prepareRemindersAfterSave } from '@/notifications/scheduler';
import { isComplete } from '@/domain/capture';
import { t } from '@/i18n';
import { ProbabilitySlider, Text } from '@/ui';

// The episode is already stored by the time this runs. A reminder that fails
// to schedule must not be reported as a failed save: the home screen card
// works without it.
async function prepareReminders(): Promise<boolean> {
  try {
    return await prepareRemindersAfterSave();
  } catch (error) {
    if (__DEV__) {
      console.warn('Preparing reminders failed', error);
    }
    return false;
  }
}

export default function ProbabilityStep() {
  const probability = useDraft((state) => state.probability);
  const setProbability = useDraft((state) => state.setProbability);
  const complete = useDraft(isComplete);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const save = async () => {
    setSaving(true);
    setFailed(false);
    try {
      const saved = await saveDraft(draftStore.getState());
      const remindersOff = await prepareReminders();
      draftStore.getState().complete({ ...saved, remindersOff });
      router.replace('/capture/saved');
    } catch (error) {
      if (__DEV__) {
        console.warn('Saving the episode failed', error);
      }
      setFailed(true);
      setSaving(false);
    }
  };

  return (
    <CaptureStep
      step={3}
      action={{
        label: t('common.save'),
        disabled: !complete || saving,
        onPress: () => {
          void save();
        },
      }}
    >
      <Text variant="question" className="mt-4">
        {t('capture.probability.question')}
      </Text>

      <View className="flex-1 justify-center">
        <ProbabilitySlider
          value={probability}
          onChange={setProbability}
          accessibilityLabel={t('capture.probability.question')}
        />
        <Text
          variant="caption"
          className={`mt-4 text-center ${probability === null ? '' : 'opacity-0'}`}
        >
          {t('capture.scale.untouched')}
        </Text>
      </View>

      {failed ? (
        <Text variant="body" accessibilityLiveRegion="polite">
          {t('capture.saveFailed')}
        </Text>
      ) : null}
    </CaptureStep>
  );
}
