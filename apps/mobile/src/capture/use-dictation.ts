import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
  type ExpoSpeechRecognitionErrorCode,
} from 'expo-speech-recognition';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { getLocale, type Locale } from '@/i18n';

/**
 * Dictation is on-device only (ADR-0005). Every check below exists because the
 * library would otherwise fall back to cloud recognition without telling
 * anyone, and the prediction is the most private thing the app holds.
 */

const SPEECH_LOCALE: Record<Locale, string> = { uk: 'uk-UA', en: 'en-US' };

/** Below Android 13 the library ignores requiresOnDeviceRecognition and uses
 * the default recogniser, which is network based. */
const ANDROID_ON_DEVICE_MIN_API = 33;

/** Errors that mean dictation cannot work offline on this device, as opposed
 * to one attempt that heard nothing. "network" is here because it can only
 * mean the recogniser tried to go online. */
const UNAVAILABLE_ON_ERROR = new Set<ExpoSpeechRecognitionErrorCode>([
  'not-allowed',
  'service-not-allowed',
  'language-not-supported',
  'network',
]);

function hasLocale(available: readonly string[], lang: string): boolean {
  const language = lang.split('-')[0];
  return available.some(
    (candidate) => candidate === lang || candidate.split('-')[0] === language,
  );
}

async function isOfflineDictationAvailable(lang: string): Promise<boolean> {
  try {
    if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
      return false;
    }

    if (Platform.OS === 'android') {
      if (
        typeof Platform.Version !== 'number' ||
        Platform.Version < ANDROID_ON_DEVICE_MIN_API ||
        !ExpoSpeechRecognitionModule.supportsOnDeviceRecognition()
      ) {
        return false;
      }
      const { installedLocales } =
        await ExpoSpeechRecognitionModule.getSupportedLocales({});
      return hasLocale(installedLocales, lang);
    }

    // iOS cannot report per-locale on-device support from JavaScript. The
    // patched module fails the task instead of going online, and the error
    // handler below hides the microphone from then on.
    const { locales } = await ExpoSpeechRecognitionModule.getSupportedLocales(
      {},
    );
    return hasLocale(locales, lang);
  } catch {
    return false;
  }
}

export type DictationStatus = 'checking' | 'unavailable' | 'idle' | 'listening';

export function useDictation(onTranscript: (transcript: string) => void) {
  const [status, setStatus] = useState<DictationStatus>('checking');
  const lang = SPEECH_LOCALE[getLocale()];

  useEffect(() => {
    let cancelled = false;

    void isOfflineDictationAvailable(lang).then((available) => {
      if (!cancelled) {
        setStatus(available ? 'idle' : 'unavailable');
      }
    });

    return () => {
      cancelled = true;
      // The microphone must never outlive the screen that opened it.
      ExpoSpeechRecognitionModule.abort();
    };
  }, [lang]);

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript;
    if (transcript) {
      onTranscript(transcript);
    }
  });

  useSpeechRecognitionEvent('end', () => {
    setStatus((current) => (current === 'listening' ? 'idle' : current));
  });

  useSpeechRecognitionEvent('error', (event) => {
    setStatus(UNAVAILABLE_ON_ERROR.has(event.error) ? 'unavailable' : 'idle');
  });

  const start = useCallback(async () => {
    const permission =
      await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) {
      setStatus('unavailable');
      return;
    }
    setStatus('listening');
    ExpoSpeechRecognitionModule.start({
      lang,
      interimResults: true,
      continuous: false,
      addsPunctuation: true,
      requiresOnDeviceRecognition: true,
    });
  }, [lang]);

  const stop = useCallback(() => {
    ExpoSpeechRecognitionModule.stop();
  }, []);

  return { status, start, stop };
}
