import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  View,
} from 'react-native';

import {
  loadFollowup,
  saveFollowup,
  type FollowupScreenData,
  type SavedFollowup,
} from '@/followup/save';
import {
  isFollowupComplete,
  needsImpact,
  type Reflection,
} from '@/domain/followup';
import { OUTCOME, type Outcome } from '@/domain/types';
import { getLocale, t } from '@/i18n';
import { formatClock, formatDayMonth } from '@/i18n/format';
import { Button, ImpactSlider, Screen, Text } from '@/ui';

const OUTCOMES: readonly {
  value: Outcome;
  label: Parameters<typeof t>[0];
}[] = [
  { value: OUTCOME.didNotHappen, label: 'followup.outcome.didNotHappen' },
  { value: OUTCOME.partly, label: 'followup.outcome.partly' },
  { value: OUTCOME.happened, label: 'followup.outcome.happened' },
];

function reflectionText(reflection: Reflection): string {
  switch (reflection.kind) {
    case 'didNotHappen':
      return t('followup.reflection.didNotHappen', {
        ordinal: reflection.ordinal,
        total: reflection.total,
      });
    case 'lighterThanFeared':
      return t(
        reflection.partly
          ? 'followup.reflection.partlyLighter'
          : 'followup.reflection.lighterThanFeared',
        { impact: reflection.impact, intensity: reflection.intensity },
      );
    case 'asHardAsFeared':
      return t(
        reflection.partly
          ? 'followup.reflection.partlyAsHard'
          : 'followup.reflection.asHardAsFeared',
      );
  }
}

type Loaded = FollowupScreenData | 'missing' | null;

export default function FollowupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loaded, setLoaded] = useState<Loaded>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [actualImpact, setActualImpact] = useState<number | null>(null);
  const [whatHelped, setWhatHelped] = useState('');
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const [saved, setSaved] = useState<SavedFollowup | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadFollowup(id)
      .then((data) => {
        if (!cancelled) {
          setLoaded(data ?? 'missing');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoaded('missing');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loaded === null) {
    return <Screen />;
  }
  // Deleted, or answered already: one episode has at most one follow-up.
  if (loaded === 'missing' || (loaded.answered && !saved)) {
    return <Redirect href="/" />;
  }

  const { episode } = loaded;
  const input = { outcome, actualImpact, whatHelped };

  const save = async () => {
    setSaving(true);
    setFailed(false);
    try {
      setSaved(await saveFollowup(episode, input));
    } catch (error) {
      if (__DEV__) {
        console.warn('Saving the follow-up failed', error);
      }
      setFailed(true);
      setSaving(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-6 pb-6"
          keyboardShouldPersistTaps="handled"
        >
          <Text variant="caption" className="mt-4">
            {t('followup.recordedOn', {
              date: formatDayMonth(
                episode.createdAt,
                episode.tzOffset,
                getLocale(),
              ),
              time: formatClock(episode.createdAt, episode.tzOffset),
            })}
          </Text>
          <Text variant="question" className="mt-2">
            {episode.fear}
          </Text>
          <Text variant="muted" className="mt-2">
            {t('followup.stated', { probability: episode.probability })}
          </Text>

          {saved ? (
            <View className="mt-10">
              <Text variant="question" accessibilityLiveRegion="polite">
                {reflectionText(saved.reflection)}
              </Text>
              {saved.followup.wasLate ? (
                <Text variant="muted" className="mt-4">
                  {t('followup.late')}
                </Text>
              ) : null}
            </View>
          ) : (
            <>
              <Text variant="body" className="mt-10">
                {t('followup.question')}
              </Text>
              <View className="mt-3 flex-row gap-2">
                {OUTCOMES.map((option) => (
                  <Button
                    key={option.value}
                    label={t(option.label)}
                    tone={outcome === option.value ? 'primary' : 'secondary'}
                    accessibilityState={{ selected: outcome === option.value }}
                    onPress={() => {
                      setOutcome(option.value);
                    }}
                    className="min-h-[64px] flex-1 px-2"
                  />
                ))}
              </View>

              {needsImpact(outcome) ? (
                <View className="mt-8">
                  <Text variant="body">{t('followup.impact.question')}</Text>
                  <ImpactSlider
                    value={actualImpact}
                    onChange={setActualImpact}
                    accessibilityLabel={t('followup.impact.question')}
                  />
                </View>
              ) : null}

              <Text variant="body" className="mt-8">
                {t('followup.helped.question')}
              </Text>
              <TextInput
                multiline
                value={whatHelped}
                onChangeText={setWhatHelped}
                placeholder={t('followup.optional')}
                placeholderClassName="text-muted"
                accessibilityLabel={t('followup.helped.question')}
                textAlignVertical="top"
                className="mt-3 min-h-[96px] rounded-2xl border border-line bg-raised p-4 text-base text-ink"
              />

              {failed ? (
                <Text variant="body" className="mt-4">
                  {t('followup.saveFailed')}
                </Text>
              ) : null}
            </>
          )}
        </ScrollView>

        <View className="px-6 pb-4 pt-2">
          {saved ? (
            <Button
              large
              label={t('common.done')}
              onPress={() => {
                router.dismissTo('/');
              }}
            />
          ) : (
            <Button
              large
              label={t('common.save')}
              disabled={!isFollowupComplete(input) || saving}
              onPress={() => {
                void save();
              }}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
