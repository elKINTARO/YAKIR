import type {
  Episode,
  Exercise,
  ExerciseCategory,
  ExerciseLog,
  Followup,
  Outcome,
} from '@/domain/types';

export interface EpisodeRow {
  id: string;
  created_at: number;
  tz_offset: number;
  intensity: number;
  fear: string;
  probability: number;
  tags: string | null;
  followup_at: number;
  notif_id: string | null;
  locked: number;
}

export interface FollowupRow {
  episode_id: string;
  completed_at: number;
  outcome: number;
  actual_impact: number | null;
  what_helped: string | null;
  was_late: number;
}

export interface ExerciseRow {
  id: string;
  slug: string;
  title: string;
  duration_sec: number;
  category: string;
  body_md: string;
  source_note: string | null;
}

export interface ExerciseLogRow {
  id: string;
  exercise_id: string;
  episode_id: string | null;
  started_at: number;
  completed_at: number | null;
  relief: number | null;
}

const CATEGORIES: readonly ExerciseCategory[] = [
  'grounding',
  'breathing',
  'body',
  'cognitive',
  'behavioural',
];

export function parseTags(value: string | null): readonly string[] {
  if (!value) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
}

export function serializeTags(tags: readonly string[]): string | null {
  return tags.length > 0 ? JSON.stringify(tags) : null;
}

export function toEpisode(row: EpisodeRow): Episode {
  return {
    id: row.id,
    createdAt: row.created_at,
    tzOffset: row.tz_offset,
    intensity: row.intensity,
    fear: row.fear,
    probability: row.probability,
    tags: parseTags(row.tags),
    followupAt: row.followup_at,
    notificationId: row.notif_id,
  };
}

export function toFollowup(row: FollowupRow): Followup {
  if (row.outcome !== 0 && row.outcome !== 1 && row.outcome !== 2) {
    throw new Error(
      `Unknown outcome ${row.outcome} for episode ${row.episode_id}.`,
    );
  }
  return {
    episodeId: row.episode_id,
    completedAt: row.completed_at,
    outcome: row.outcome as Outcome,
    actualImpact: row.actual_impact,
    whatHelped: row.what_helped,
    wasLate: row.was_late === 1,
  };
}

export function toExercise(row: ExerciseRow): Exercise {
  const category = CATEGORIES.find((candidate) => candidate === row.category);
  if (!category) {
    throw new Error(
      `Unknown exercise category "${row.category}" for ${row.slug}.`,
    );
  }
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    durationSec: row.duration_sec,
    category,
    bodyMd: row.body_md,
    sourceNote: row.source_note,
  };
}

export function toExerciseLog(row: ExerciseLogRow): ExerciseLog {
  return {
    id: row.id,
    exerciseId: row.exercise_id,
    episodeId: row.episode_id,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    relief: row.relief,
  };
}
