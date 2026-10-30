import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import {
  listEpisodesAwaitingFollowup,
  setEpisodeNotificationId,
} from '@/db/repositories/episodes';
import { getSetting, setSetting } from '@/db/repositories/settings';
import { tzOffsetFromPlatform } from '@/domain/capture';
import type { Episode } from '@/domain/types';
import {
  isReminderExpired,
  planUpcomingReminders,
  type PlannedReminder,
} from '@/domain/scheduling';
import { getLocale, t } from '@/i18n';
import { pluralCategory } from '@/i18n/plural';

/**
 * Executes the plan computed in src/domain/scheduling.ts and makes no
 * decisions of its own. Syncing is idempotent: everything scheduled is
 * cancelled and the plan is scheduled afresh, so a timezone change, an
 * answered follow-up and an expired one are all handled by the same call.
 */

export const CHANNEL_ID = 'followups';

const DENIED_HINT_SHOWN = 'notify.deniedHintShown';

export type ReminderData =
  { kind: 'individual'; episodeId: string } | { kind: 'summary' };

export async function configureNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: t('notify.channel'),
    importance: Notifications.AndroidImportance.DEFAULT,
    showBadge: false,
  });
}

function currentTzOffset(now: number): number {
  return tzOffsetFromPlatform(new Date(now).getTimezoneOffset());
}

// The prediction itself never goes into a notification: it would sit on the
// lock screen for anyone nearby to read.
function contentFor(
  reminder: PlannedReminder,
): Notifications.NotificationContentInput {
  if (reminder.kind === 'individual') {
    const data: ReminderData = {
      kind: 'individual',
      episodeId: reminder.episodeId,
    };
    return {
      title: t('notify.followup.title'),
      body: t('notify.followup.body'),
      data,
    };
  }

  const data: ReminderData = { kind: 'summary' };
  return {
    title: t(`notify.summary.${pluralCategory(getLocale(), reminder.count)}`, {
      count: reminder.count,
    }),
    data,
  };
}

async function hasPermission(): Promise<boolean> {
  const { granted } = await Notifications.getPermissionsAsync();
  return granted;
}

// Syncs run one after another. Two at once both cancel, then both schedule,
// and every reminder arrives twice. That happens in practice: closing the
// permission dialog makes the app active again while the post-save sync is
// still running.
let queue: Promise<void> = Promise.resolve();

export function syncReminders(now?: number): Promise<void> {
  const run = queue.then(() => runSync(now ?? Date.now()));
  queue = run.catch(() => undefined);
  return run;
}

async function runSync(now: number): Promise<void> {
  const pending = await listEpisodesAwaitingFollowup();
  const permitted = await hasPermission();

  await Notifications.cancelAllScheduledNotificationsAsync();
  await dismissStale(pending, now);

  const plan = permitted
    ? planUpcomingReminders(
        pending.map((episode) => ({
          episodeId: episode.id,
          followupAt: episode.followupAt,
        })),
        now,
        currentTzOffset(now),
      )
    : [];

  const scheduledIds = new Map<string, string>();
  for (const reminder of plan) {
    const id = await Notifications.scheduleNotificationAsync({
      content: contentFor(reminder),
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminder.at,
        channelId: CHANNEL_ID,
      },
    });
    if (reminder.kind === 'individual') {
      scheduledIds.set(reminder.episodeId, id);
    }
  }

  for (const episode of pending) {
    const next = scheduledIds.get(episode.id) ?? null;
    if (episode.notificationId !== next) {
      await setEpisodeNotificationId(episode.id, next);
    }
  }
}

/**
 * Rule 4 of the notification logic: after 48 hours a reminder is withdrawn for
 * good, including one already sitting in the notification shade. The same goes
 * for a reminder whose episode has been answered, since it is no longer in
 * `pending` at all.
 */
async function dismissStale(
  pending: readonly Episode[],
  now: number,
): Promise<void> {
  const presented = await Notifications.getPresentedNotificationsAsync();
  const live = new Set(
    pending
      .filter((episode) => !isReminderExpired(episode.followupAt, now))
      .map((episode) => episode.id),
  );

  for (const notification of presented) {
    const data = notification.request.content.data as
      Partial<ReminderData> | undefined;
    if (data?.kind !== 'individual' || typeof data.episodeId !== 'string') {
      continue;
    }
    if (!live.has(data.episodeId)) {
      await Notifications.dismissNotificationAsync(
        notification.request.identifier,
      );
    }
  }
}

/**
 * Asked after the first saved episode rather than on launch: by then the
 * person knows what the reminder is for. Returns true when reminders are off
 * and the one-time hint about it has not been shown yet.
 */
export async function prepareRemindersAfterSave(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  let granted = current.granted;

  // Not `status === undetermined`: Android 13+ reports a never-asked
  // permission as denied, and only canAskAgain tells the two apart.
  if (!granted && current.canAskAgain) {
    // No badge: a red counter on the icon is pressure, not information.
    const requested = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowSound: true, allowBadge: false },
    });
    granted = requested.granted;
  }

  await syncReminders();

  if (granted || (await getSetting(DENIED_HINT_SHOWN)) === '1') {
    return false;
  }
  await setSetting(DENIED_HINT_SHOWN, '1');
  return true;
}
