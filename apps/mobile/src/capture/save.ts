import { insertEpisode } from '@/db/repositories/episodes';
import { buildEpisode, tzOffsetFromPlatform } from '@/domain/capture';
import { MINUTE_MS } from '@/domain/time';

import type { Draft, SavedEpisode } from './draft-store';

/**
 * Development only: EXPO_PUBLIC_FAST_FOLLOWUP=1 makes the follow-up due one
 * minute after capture, so checking the reminder loop by hand does not cost a
 * day each time. The reminder window still applies, so outside 10:00-20:00 the
 * reminder moves to the next opening. Never active in a release build.
 */
const FAST_FOLLOWUP = __DEV__ && process.env.EXPO_PUBLIC_FAST_FOLLOWUP === '1';

export async function saveDraft(
  draft: Draft,
  now: number = Date.now(),
): Promise<SavedEpisode> {
  const tzOffset = tzOffsetFromPlatform(new Date(now).getTimezoneOffset());
  const built = buildEpisode(draft, now, tzOffset);
  const episode = await insertEpisode(
    FAST_FOLLOWUP ? { ...built, followupAt: now + MINUTE_MS } : built,
  );

  return {
    episodeId: episode.id,
    createdAt: episode.createdAt,
    tzOffset: episode.tzOffset,
    followupAt: episode.followupAt,
    remindersOff: false,
  };
}
