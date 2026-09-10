import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { countEpisodes } from '@/db/repositories/episodes';
import { t } from '@/i18n';
import {
  Button,
  Card,
  IntensitySlider,
  ProbabilitySlider,
  Screen,
  TagChip,
  Text,
} from '@/ui';

export default function HomeScreen() {
  const [episodes, setEpisodes] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(4);
  const [probability, setProbability] = useState(70);
  const [tag, setTag] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const total = await countEpisodes();
        if (!cancelled) {
          setEpisodes(total);
        }
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : String(caught));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Screen scroll className="px-6 pb-10">
      <Text variant="title" className="mt-4">
        {t('stats.calibration.title')}
      </Text>

      <Card className="mt-4">
        <Text variant="caption">{t('stats.calibration.meanProbability')}</Text>
        <Text variant="body" className="mt-1">
          {error ?? t('stats.calibration.insufficient', { remaining: 10 })}
        </Text>
        <Text variant="caption" className="mt-2">
          {t('stats.calibration.ratio', { count: episodes ?? 0, total: 0 })}
        </Text>
      </Card>

      <Text variant="question" className="mt-8">
        {t('capture.intensity.question')}
      </Text>
      <View className="h-72">
        <IntensitySlider
          value={intensity}
          onChange={setIntensity}
          accessibilityLabel={t('capture.intensity.question')}
        />
      </View>

      <Text variant="question" className="mt-8">
        {t('capture.probability.question')}
      </Text>
      <ProbabilitySlider
        value={probability}
        onChange={setProbability}
        accessibilityLabel={t('capture.probability.question')}
      />

      <View className="mt-8 flex-row flex-wrap gap-2">
        {(['tag.work', 'tag.health', 'tag.money'] as const).map((key) => (
          <TagChip
            key={key}
            label={t(key)}
            selected={tag === key}
            onToggle={() => {
              setTag(tag === key ? null : key);
            }}
          />
        ))}
      </View>

      <Button large label={t('home.capture')} className="mt-8" />
      <Button
        tone="secondary"
        label={t('capture.exerciseNow')}
        className="mt-3"
      />
    </Screen>
  );
}
