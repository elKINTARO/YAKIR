import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';

import { t } from '@/i18n';
import { Button, Screen, Text } from '@/ui';

export const CAPTURE_STEPS = 3;

export interface CaptureStepProps {
  step: number;
  children: ReactNode;
  action: {
    label: string;
    onPress: () => void;
    disabled?: boolean;
  };
}

/**
 * Shared frame of the three capture steps. The action sits in the bottom third
 * so the whole flow works with the thumb of one hand, and closing is always
 * one tap away: validation never stands between the person and the exit.
 */
export function CaptureStep({ step, children, action }: CaptureStepProps) {
  return (
    <Screen>
      <KeyboardAvoidingView
        className="flex-1 px-6 pb-4"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="flex-row items-center justify-between">
          <Text variant="caption">
            {t('capture.step', { current: step, total: CAPTURE_STEPS })}
          </Text>
          <Button
            tone="quiet"
            label={t('common.close')}
            onPress={() => {
              router.dismissTo('/');
            }}
          />
        </View>

        <View className="flex-1">{children}</View>

        <Button
          large
          label={action.label}
          disabled={action.disabled ?? false}
          onPress={action.onPress}
          className="mt-4"
        />
        {step > 1 ? (
          <Button
            tone="quiet"
            label={t('common.back')}
            onPress={() => {
              router.back();
            }}
            className="mt-2"
          />
        ) : null}
      </KeyboardAvoidingView>
    </Screen>
  );
}
