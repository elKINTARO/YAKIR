import { router } from 'expo-router';
import { View } from 'react-native';

import { CaptureStep } from '@/capture/CaptureStep';
import { useDraft } from '@/capture/use-draft';
import { t } from '@/i18n';
import { IntensitySlider, Text } from '@/ui';

export default function IntensityStep() {
  const intensity = useDraft((state) => state.intensity);
  const setIntensity = useDraft((state) => state.setIntensity);

  return (
    <CaptureStep
      step={1}
      action={{
        label: t('common.next'),
        disabled: intensity === null,
        onPress: () => {
          router.push('/capture/fear');
        },
      }}
    >
      <Text variant="question" className="mt-4">
        {t('capture.intensity.question')}
      </Text>

      <View className="flex-1 py-6">
        <IntensitySlider
          value={intensity}
          onChange={setIntensity}
          accessibilityLabel={t('capture.intensity.question')}
        />
      </View>

      <Text
        variant="caption"
        className={`text-center ${intensity === null ? '' : 'opacity-0'}`}
      >
        {t('capture.scale.untouched')}
      </Text>
    </CaptureStep>
  );
}
