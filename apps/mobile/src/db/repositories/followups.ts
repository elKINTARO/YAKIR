import type { EpisodeId, Followup } from '@/domain/types';

import { getDatabase } from '../client';
import { toFollowup, type FollowupRow } from '../rows';

const SELECT = `
  SELECT episode_id, completed_at, outcome, actual_impact, what_helped, was_late
  FROM followups
`;

export async function insertFollowup(followup: Followup): Promise<Followup> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO followups
       (episode_id, completed_at, outcome, actual_impact, what_helped, was_late)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      followup.episodeId,
      followup.completedAt,
      followup.outcome,
      followup.actualImpact,
      followup.whatHelped,
      followup.wasLate ? 1 : 0,
    ],
  );
  return followup;
}

export async function getFollowup(
  episodeId: EpisodeId,
): Promise<Followup | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<FollowupRow>(
    `${SELECT} WHERE episode_id = ?`,
    [episodeId],
  );
  return row ? toFollowup(row) : null;
}

export async function listFollowups(): Promise<Followup[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<FollowupRow>(
    `${SELECT} ORDER BY completed_at ASC`,
  );
  return rows.map(toFollowup);
}

export interface AnsweredEpisode {
  episodeId: EpisodeId;
  createdAt: number;
  tzOffset: number;
  intensity: number;
  probability: number;
  followup: Followup;
}

interface AnsweredRow extends FollowupRow {
  created_at: number;
  tz_offset: number;
  intensity: number;
  probability: number;
}

export async function listAnsweredEpisodes(): Promise<AnsweredEpisode[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<AnsweredRow>(
    `SELECT f.episode_id, f.completed_at, f.outcome, f.actual_impact,
            f.what_helped, f.was_late,
            e.created_at, e.tz_offset, e.intensity, e.probability
     FROM followups f
     JOIN episodes e ON e.id = f.episode_id
     ORDER BY e.created_at ASC`,
  );

  return rows.map((row) => ({
    episodeId: row.episode_id,
    createdAt: row.created_at,
    tzOffset: row.tz_offset,
    intensity: row.intensity,
    probability: row.probability,
    followup: toFollowup(row),
  }));
}
