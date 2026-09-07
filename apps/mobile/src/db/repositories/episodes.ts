import type { Episode, EpisodeId } from '@/domain/types';

import { getDatabase } from '../client';
import { newId } from '../ids';
import { serializeTags, toEpisode, type EpisodeRow } from '../rows';

export type NewEpisode = Omit<Episode, 'id' | 'notificationId'>;

const SELECT = `
  SELECT id, created_at, tz_offset, intensity, fear, probability,
         tags, followup_at, notif_id, locked
  FROM episodes
`;

export async function insertEpisode(input: NewEpisode): Promise<Episode> {
  const database = await getDatabase();
  const id = newId();

  await database.runAsync(
    `INSERT INTO episodes
       (id, created_at, tz_offset, intensity, fear, probability, tags, followup_at, notif_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
    [
      id,
      input.createdAt,
      input.tzOffset,
      input.intensity,
      input.fear,
      input.probability,
      serializeTags(input.tags),
      input.followupAt,
    ],
  );

  return { ...input, id, tags: [...input.tags], notificationId: null };
}

export async function getEpisode(id: EpisodeId): Promise<Episode | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<EpisodeRow>(
    `${SELECT} WHERE id = ?`,
    [id],
  );
  return row ? toEpisode(row) : null;
}

export async function listEpisodes(limit?: number): Promise<Episode[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<EpisodeRow>(
    `${SELECT} ORDER BY created_at DESC${limit === undefined ? '' : ' LIMIT ?'}`,
    limit === undefined ? [] : [limit],
  );
  return rows.map(toEpisode);
}

export async function listEpisodesBetween(
  fromInclusive: number,
  toExclusive: number,
): Promise<Episode[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<EpisodeRow>(
    `${SELECT} WHERE created_at >= ? AND created_at < ? ORDER BY created_at ASC`,
    [fromInclusive, toExclusive],
  );
  return rows.map(toEpisode);
}

export async function listEpisodesAwaitingFollowup(
  dueBefore?: number,
): Promise<Episode[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<EpisodeRow>(
    `SELECT e.id, e.created_at, e.tz_offset, e.intensity, e.fear, e.probability,
            e.tags, e.followup_at, e.notif_id, e.locked
     FROM episodes e
     LEFT JOIN followups f ON f.episode_id = e.id
     WHERE f.episode_id IS NULL${dueBefore === undefined ? '' : ' AND e.followup_at <= ?'}
     ORDER BY e.followup_at ASC`,
    dueBefore === undefined ? [] : [dueBefore],
  );
  return rows.map(toEpisode);
}

export async function setEpisodeNotificationId(
  id: EpisodeId,
  notificationId: string | null,
): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('UPDATE episodes SET notif_id = ? WHERE id = ?', [
    notificationId,
    id,
  ]);
}

export async function deleteEpisode(id: EpisodeId): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM episodes WHERE id = ?', [id]);
}

export async function countEpisodes(): Promise<number> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ total: number }>(
    'SELECT COUNT(*) AS total FROM episodes',
  );
  return row?.total ?? 0;
}
