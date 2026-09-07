import { describe, expect, it } from 'vitest';

import {
  parseTags,
  serializeTags,
  toEpisode,
  toExercise,
  toExerciseLog,
  toFollowup,
  type EpisodeRow,
  type ExerciseLogRow,
  type ExerciseRow,
  type FollowupRow,
} from '@/db/rows';

const episodeRow: EpisodeRow = {
  id: 'episode-1',
  created_at: 1_757_000_000_000,
  tz_offset: 180,
  intensity: 7,
  fear: 'на зустрічі скажуть, що я не тягну проєкт',
  probability: 85,
  tags: '["work"]',
  followup_at: 1_757_086_400_000,
  notif_id: 'notification-1',
  locked: 1,
};

describe('parseTags', () => {
  it('reads a json array', () => {
    expect(parseTags('["work","money"]')).toEqual(['work', 'money']);
  });

  it('treats an absent value as no tags', () => {
    expect(parseTags(null)).toEqual([]);
    expect(parseTags('')).toEqual([]);
  });

  it('falls back to no tags when the value is unreadable', () => {
    expect(parseTags('not json')).toEqual([]);
    expect(parseTags('{"work":true}')).toEqual([]);
  });

  it('drops entries that are not strings', () => {
    expect(parseTags('["work",7,null,"money"]')).toEqual(['work', 'money']);
  });
});

describe('serializeTags', () => {
  it('writes null rather than an empty array', () => {
    expect(serializeTags([])).toBeNull();
  });

  it('round trips through parseTags', () => {
    const tags = ['work', 'health'];
    expect(parseTags(serializeTags(tags))).toEqual(tags);
  });
});

describe('toEpisode', () => {
  it('maps every column onto the domain type', () => {
    expect(toEpisode(episodeRow)).toEqual({
      id: 'episode-1',
      createdAt: 1_757_000_000_000,
      tzOffset: 180,
      intensity: 7,
      fear: 'на зустрічі скажуть, що я не тягну проєкт',
      probability: 85,
      tags: ['work'],
      followupAt: 1_757_086_400_000,
      notificationId: 'notification-1',
    });
  });

  it('keeps a missing notification identifier as null', () => {
    expect(
      toEpisode({ ...episodeRow, notif_id: null }).notificationId,
    ).toBeNull();
  });
});

describe('toFollowup', () => {
  const row: FollowupRow = {
    episode_id: 'episode-1',
    completed_at: 1_757_086_400_000,
    outcome: 0,
    actual_impact: null,
    what_helped: null,
    was_late: 0,
  };

  it('maps the columns and turns the late flag into a boolean', () => {
    expect(toFollowup({ ...row, was_late: 1 })).toEqual({
      episodeId: 'episode-1',
      completedAt: 1_757_086_400_000,
      outcome: 0,
      actualImpact: null,
      whatHelped: null,
      wasLate: true,
    });
  });

  it.each([0, 1, 2])('accepts the outcome %i', (outcome) => {
    expect(toFollowup({ ...row, outcome }).outcome).toBe(outcome);
  });

  it('refuses an outcome outside the three known values', () => {
    expect(() => toFollowup({ ...row, outcome: 3 })).toThrow(/Unknown outcome/);
  });
});

describe('toExercise', () => {
  const row: ExerciseRow = {
    id: 'exercise-1',
    slug: 'breathing-478',
    title: 'Дихання 4-7-8',
    duration_sec: 240,
    category: 'breathing',
    body_md: '...',
    source_note: null,
  };

  it('maps the columns', () => {
    expect(toExercise(row)).toEqual({
      id: 'exercise-1',
      slug: 'breathing-478',
      title: 'Дихання 4-7-8',
      durationSec: 240,
      category: 'breathing',
      bodyMd: '...',
      sourceNote: null,
    });
  });

  it('refuses an unknown category', () => {
    expect(() => toExercise({ ...row, category: 'meditation' })).toThrow(
      /Unknown exercise category/,
    );
  });
});

describe('toExerciseLog', () => {
  const row: ExerciseLogRow = {
    id: 'log-1',
    exercise_id: 'exercise-1',
    episode_id: null,
    started_at: 1_757_000_000_000,
    completed_at: null,
    relief: null,
  };

  it('maps an interrupted exercise', () => {
    expect(toExerciseLog(row)).toEqual({
      id: 'log-1',
      exerciseId: 'exercise-1',
      episodeId: null,
      startedAt: 1_757_000_000_000,
      completedAt: null,
      relief: null,
    });
  });
});
