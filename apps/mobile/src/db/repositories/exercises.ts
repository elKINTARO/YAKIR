import type { EpisodeId, Exercise, ExerciseLog } from '@/domain/types';

import { getDatabase } from '../client';
import { newId } from '../ids';
import {
  toExercise,
  toExerciseLog,
  type ExerciseLogRow,
  type ExerciseRow,
} from '../rows';

const SELECT_EXERCISE = `
  SELECT id, slug, title, duration_sec, category, body_md, source_note
  FROM exercises
`;

const SELECT_LOG = `
  SELECT id, exercise_id, episode_id, started_at, completed_at, relief
  FROM exercise_logs
`;

export async function listExercises(): Promise<Exercise[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<ExerciseRow>(
    `${SELECT_EXERCISE} ORDER BY category, title`,
  );
  return rows.map(toExercise);
}

export async function getExerciseBySlug(
  slug: string,
): Promise<Exercise | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<ExerciseRow>(
    `${SELECT_EXERCISE} WHERE slug = ?`,
    [slug],
  );
  return row ? toExercise(row) : null;
}

export async function upsertExercises(
  exercises: readonly Omit<Exercise, 'id'>[],
): Promise<void> {
  const database = await getDatabase();
  await database.withTransactionAsync(async () => {
    for (const exercise of exercises) {
      await database.runAsync(
        `INSERT INTO exercises (id, slug, title, duration_sec, category, body_md, source_note)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(slug) DO UPDATE SET
           title = excluded.title,
           duration_sec = excluded.duration_sec,
           category = excluded.category,
           body_md = excluded.body_md,
           source_note = excluded.source_note`,
        [
          newId(),
          exercise.slug,
          exercise.title,
          exercise.durationSec,
          exercise.category,
          exercise.bodyMd,
          exercise.sourceNote,
        ],
      );
    }
  });
}

export type NewExerciseLog = Omit<ExerciseLog, 'id'>;

export async function insertExerciseLog(
  input: NewExerciseLog,
): Promise<ExerciseLog> {
  const database = await getDatabase();
  const id = newId();
  await database.runAsync(
    `INSERT INTO exercise_logs (id, exercise_id, episode_id, started_at, completed_at, relief)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.exerciseId,
      input.episodeId,
      input.startedAt,
      input.completedAt,
      input.relief,
    ],
  );
  return { ...input, id };
}

export async function completeExerciseLog(
  id: string,
  completedAt: number,
  relief: number | null,
): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE exercise_logs SET completed_at = ?, relief = ? WHERE id = ?',
    [completedAt, relief, id],
  );
}

export async function listExerciseLogs(): Promise<ExerciseLog[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<ExerciseLogRow>(
    `${SELECT_LOG} ORDER BY started_at ASC`,
  );
  return rows.map(toExerciseLog);
}

export async function listExerciseLogsForEpisode(
  episodeId: EpisodeId,
): Promise<ExerciseLog[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<ExerciseLogRow>(
    `${SELECT_LOG} WHERE episode_id = ? ORDER BY started_at ASC`,
    [episodeId],
  );
  return rows.map(toExerciseLog);
}
