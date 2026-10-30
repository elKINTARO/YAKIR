import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import {
  configureNotificationChannel,
  syncReminders,
  type ReminderData,
} from './scheduler';

Notifications.setNotificationHandler({
  handleNotification: () =>
    Promise.resolve({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
});

function reportInDev(error: unknown): void {
  if (__DEV__) {
    console.warn('Syncing reminders failed', error);
  }
}

/**
 * Syncs on launch and every time the app comes back to the foreground. That
 * one path covers a timezone change, an expired reminder and a follow-up
 * answered since the last sync.
 */
export function useReminderSync(): void {
  useEffect(() => {
    void configureNotificationChannel()
      .then(() => syncReminders())
      .catch(reportInDev);

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void syncReminders().catch(reportInDev);
      }
    });
    return () => {
      subscription.remove();
    };
  }, []);
}

/** A tap on a reminder opens its follow-up; a tap on the summary opens the
 * home screen, where every pending card is listed. Works from a cold start
 * too, since the last response survives until it is cleared here. */
export function useReminderRouting(): void {
  const response = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (
      !response ||
      response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER
    ) {
      return;
    }

    const data = response.notification.request.content.data as
      Partial<ReminderData> | undefined;
    if (data?.kind === 'individual' && typeof data.episodeId === 'string') {
      router.push({
        pathname: '/followup/[id]',
        params: { id: data.episodeId },
      });
    } else {
      router.navigate('/');
    }
    Notifications.clearLastNotificationResponse();
  }, [response]);
}
