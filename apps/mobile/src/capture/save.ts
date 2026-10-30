import { insertEpisode } from '@/db/repositories/episodes';
import { buildEpisode, tzOffsetFromPlatform } from '@/domain/capture';

import type { Draft, SavedEpisode } from './draft-store';

export async function saveDraft(
  draft: Draft,
  now: number = Date.now(),
): Promise<SavedEpisode> {
  const tzOffset = tzOffsetFromPlatform(new Date(now).getTimezoneOffset());
  const episode = await insertEpisode(buildEpisode(draft, now, tzOffset));

  return {
    episodeId: episode.id,
    createdAt: episode.createdAt,
    tzOffset: episode.tzOffset,
    followupAt: episode.followupAt,
  };
}
