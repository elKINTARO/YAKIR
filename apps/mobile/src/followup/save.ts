import { getEpisode } from '@/db/repositories/episodes';
import {
  getFollowup,
  insertFollowup,
  listFollowups,
} from '@/db/repositories/followups';
import {
  buildFollowup,
  selectReflection,
  type FollowupInput,
  type Reflection,
} from '@/domain/followup';
import type { Episode, EpisodeId, Followup } from '@/domain/types';
import { syncReminders } from '@/notifications/scheduler';

export interface FollowupScreenData {
  episode: Episode;
  answered: Followup | null;
}

export async function loadFollowup(
  id: EpisodeId,
): Promise<FollowupScreenData | null> {
  const episode = await getEpisode(id);
  if (!episode) {
    return null;
  }
  return { episode, answered: await getFollowup(id) };
}

export interface SavedFollowup {
  followup: Followup;
  reflection: Reflection;
}

export async function saveFollowup(
  episode: Episode,
  input: FollowupInput,
  now: number = Date.now(),
): Promise<SavedFollowup> {
  const followup = await insertFollowup(buildFollowup(episode, input, now));
  const reflection = selectReflection(
    episode.intensity,
    followup,
    await listFollowups(),
  );

  // The reminder for this episode is withdrawn, including from the shade.
  // Failing to do so is not a failed answer.
  await syncReminders().catch((error: unknown) => {
    if (__DEV__) {
      console.warn('Syncing reminders after a follow-up failed', error);
    }
  });

  return { followup, reflection };
}
