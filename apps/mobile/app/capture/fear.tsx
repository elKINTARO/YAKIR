import { router } from 'expo-router';
import { useRef } from 'react';
import { ScrollView, TextInput, View } from 'react-native';

import { CaptureStep } from '@/capture/CaptureStep';
import { useDictation } from '@/capture/use-dictation';
import { useDraft } from '@/capture/use-draft';
import {
  isFearLongEnough,
  joinTranscript,
  looksLikeState,
} from '@/domain/capture';
import { TAG_IDS } from '@/domain/types';
import { t } from '@/i18n';
import { Button, TagChip, Text } from '@/ui';

export default function FearStep() {
  const fear = useDraft((state) => state.fear);
  const tags = useDraft((state) => state.tags);
  const setFear = useDraft((state) => state.setFear);
  const toggleTag = useDraft((state) => state.toggleTag);

  // What was typed before dictation started. Each partial result replaces the
  // dictated tail instead of being appended again.
  const typedBeforeDictation = useRef('');
  const dictation = useDictation((transcript) => {
    setFear(joinTranscript(typedBeforeDictation.current, transcript));
  });

  const listening = dictation.status === 'listening';
  const canDictate = dictation.status === 'idle' || listening;

  return (
    <CaptureStep
      step={2}
      action={{
        label: t('common.next'),
        disabled: !isFearLongEnough(fear),
        onPress: () => {
          dictation.stop();
          router.push('/capture/probability');
        },
      }}
    >
      <ScrollView keyboardShouldPersistTaps="handled" className="flex-1">
        <Text variant="question" className="mt-4">
          {t('capture.fear.question')}
        </Text>

        <TextInput
          multiline
          value={fear}
          onChangeText={setFear}
          editable={!listening}
          placeholder={t('capture.fear.placeholder')}
          placeholderClassName="text-muted"
          accessibilityLabel={t('capture.fear.question')}
          textAlignVertical="top"
          className="mt-6 min-h-[140px] rounded-2xl border border-line bg-raised p-4 text-base text-ink"
        />

        <Text
          variant="caption"
          className={`mt-2 ${looksLikeState(fear) ? '' : 'opacity-0'}`}
        >
          {t('capture.fear.hint')}
        </Text>

        {canDictate ? (
          <Button
            tone="secondary"
            large
            label={
              listening
                ? t('capture.fear.stopDictation')
                : t('capture.fear.dictate')
            }
            onPress={() => {
              if (listening) {
                dictation.stop();
                return;
              }
              typedBeforeDictation.current = fear;
              void dictation.start();
            }}
            className="mt-4"
          />
        ) : null}

        <Text variant="caption" className="mt-6">
          {t('capture.fear.tags')}
        </Text>
        <View className="mt-2 flex-row flex-wrap gap-2">
          {TAG_IDS.map((tag) => (
            <TagChip
              key={tag}
              label={t(`tag.${tag}`)}
              selected={tags.includes(tag)}
              onToggle={() => {
                toggleTag(tag);
              }}
            />
          ))}
        </View>
      </ScrollView>
    </CaptureStep>
  );
}
