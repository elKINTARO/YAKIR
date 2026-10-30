import { describe, expect, it } from 'vitest';

import {
  computeFollowupAt,
  DEFAULT_REMINDER_WINDOW,
  findFreeSlot,
  FOLLOWUP_DEADLINE_MS,
  isLateAnswer,
  isReminderExpired,
  MAX_REMINDERS_PER_DAY,
  planReminders,
  planUpcomingReminders,
  SLOT_MS,
  type PendingFollowup,
} from '@/domain/scheduling';
import { localMinuteOfDay } from '@/domain/time';

const KYIV = 180;
const LA = -420;

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function localTime(
  day: number,
  hour: number,
  minute: number,
  tzOffsetMinutes: number,
): number {
  return day * DAY + hour * HOUR + minute * MINUTE - tzOffsetMinutes * MINUTE;
}

function localHourMinute(utcMs: number, tzOffsetMinutes: number): string {
  const minuteOfDay = localMinuteOfDay(utcMs, tzOffsetMinutes);
  const hour = Math.floor(minuteOfDay / 60);
  const minute = minuteOfDay % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function localDay(utcMs: number, tzOffsetMinutes: number): number {
  return Math.floor((utcMs + tzOffsetMinutes * MINUTE) / DAY);
}

describe('computeFollowupAt', () => {
  it('asks a day later when that lands inside the window', () => {
    const createdAt = localTime(20_000, 14, 30, KYIV);
    const followupAt = computeFollowupAt(createdAt, KYIV);

    expect(followupAt).toBe(createdAt + DAY);
    expect(localHourMinute(followupAt, KYIV)).toBe('14:30');
  });

  it('moves a night-time episode to the window opening', () => {
    const createdAt = localTime(20_000, 2, 30, KYIV);
    const followupAt = computeFollowupAt(createdAt, KYIV);

    expect(localHourMinute(followupAt, KYIV)).toBe('10:00');
    expect(localDay(followupAt, KYIV)).toBe(20_001);
  });

  it('moves a late-evening episode to the next window opening', () => {
    const createdAt = localTime(20_000, 22, 15, KYIV);
    const followupAt = computeFollowupAt(createdAt, KYIV);

    expect(localHourMinute(followupAt, KYIV)).toBe('10:00');
    expect(localDay(followupAt, KYIV)).toBe(20_002);
  });

  it('never asks sooner than a full day after the episode', () => {
    for (let hour = 0; hour < 24; hour += 1) {
      const createdAt = localTime(20_000, hour, 0, KYIV);
      expect(computeFollowupAt(createdAt, KYIV)).toBeGreaterThanOrEqual(
        createdAt + DAY,
      );
    }
  });

  it.each([
    ['the opening boundary', 10, 0, '10:00'],
    ['the closing boundary', 20, 0, '20:00'],
  ])('leaves %s untouched', (_label, hour, minute, expected) => {
    const createdAt = localTime(20_000, hour, minute, KYIV);
    expect(localHourMinute(computeFollowupAt(createdAt, KYIV), KYIV)).toBe(
      expected,
    );
  });

  it('applies the window in the given zone, not in UTC', () => {
    const createdAt = localTime(20_000, 3, 0, LA);
    const followupAt = computeFollowupAt(createdAt, LA);
    expect(localHourMinute(followupAt, LA)).toBe('10:00');
  });

  it('honours a custom window', () => {
    const createdAt = localTime(20_000, 6, 0, KYIV);
    const followupAt = computeFollowupAt(createdAt, KYIV, {
      startMinute: 8 * 60,
      endMinute: 12 * 60,
    });
    expect(localHourMinute(followupAt, KYIV)).toBe('08:00');
  });

  it.each([
    ['an end before the start', { startMinute: 1200, endMinute: 600 }],
    ['an empty range', { startMinute: 600, endMinute: 600 }],
    ['a negative start', { startMinute: -60, endMinute: 600 }],
    ['an end past midnight', { startMinute: 600, endMinute: 1441 }],
    ['a fractional boundary', { startMinute: 600.5, endMinute: 1200 }],
  ])('rejects %s', (_label, window) => {
    expect(() => computeFollowupAt(0, KYIV, window)).toThrow(
      /Invalid reminder window/,
    );
  });
});

describe('findFreeSlot', () => {
  it('keeps the candidate when its slot is free', () => {
    const at = localTime(20_000, 12, 0, KYIV);
    expect(findFreeSlot(at, [], KYIV)).toBe(at);
  });

  it('shifts by half an hour when the slot is taken', () => {
    const at = localTime(20_000, 12, 0, KYIV);
    expect(findFreeSlot(at, [at], KYIV)).toBe(at + SLOT_MS);
  });

  it('treats anything in the same half hour as a collision', () => {
    const at = localTime(20_000, 12, 0, KYIV);
    const nearby = at + 10 * MINUTE;
    expect(findFreeSlot(nearby, [at], KYIV)).toBe(nearby + SLOT_MS);
  });

  it('skips over a run of taken slots', () => {
    const at = localTime(20_000, 12, 0, KYIV);
    const taken = [at, at + SLOT_MS, at + 2 * SLOT_MS];
    expect(findFreeSlot(at, taken, KYIV)).toBe(at + 3 * SLOT_MS);
  });

  it('wraps to the next window opening rather than past the closing time', () => {
    const at = localTime(20_000, 20, 0, KYIV);
    const free = findFreeSlot(at, [at], KYIV);

    expect(localHourMinute(free, KYIV)).toBe('10:00');
    expect(localDay(free, KYIV)).toBe(20_001);
  });
});

describe('planReminders', () => {
  function pendingAt(episodeId: string, followupAt: number): PendingFollowup {
    return { episodeId, followupAt };
  }

  it('plans nothing for an empty list', () => {
    expect(planReminders([], KYIV)).toEqual([]);
  });

  it('keeps one reminder per episode when the day is quiet', () => {
    const first = localTime(20_000, 11, 0, KYIV);
    const second = localTime(20_000, 15, 0, KYIV);
    const planned = planReminders(
      [pendingAt('b', second), pendingAt('a', first)],
      KYIV,
    );

    expect(planned).toEqual([
      { kind: 'individual', episodeId: 'a', at: first },
      { kind: 'individual', episodeId: 'b', at: second },
    ]);
  });

  it('spreads collisions across consecutive slots', () => {
    const at = localTime(20_000, 11, 0, KYIV);
    const planned = planReminders(
      [pendingAt('a', at), pendingAt('b', at), pendingAt('c', at)],
      KYIV,
    );

    expect(planned.map((reminder) => reminder.at)).toEqual([
      at,
      at + SLOT_MS,
      at + 2 * SLOT_MS,
    ]);
  });

  it('collapses everything past the daily cap into one summary', () => {
    const at = localTime(20_000, 11, 0, KYIV);
    const planned = planReminders(
      ['a', 'b', 'c', 'd', 'e'].map((id) => pendingAt(id, at)),
      KYIV,
    );

    const individual = planned.filter(
      (reminder) => reminder.kind === 'individual',
    );
    expect(individual).toHaveLength(MAX_REMINDERS_PER_DAY);

    expect(planned.at(-1)).toEqual({
      kind: 'summary',
      at: at + 3 * SLOT_MS,
      count: 2,
      episodeIds: ['d', 'e'],
    });
  });

  it('applies the cap per day rather than across all of them', () => {
    const monday = localTime(20_000, 11, 0, KYIV);
    const tuesday = localTime(20_001, 11, 0, KYIV);
    const planned = planReminders(
      [
        pendingAt('a', monday),
        pendingAt('b', monday),
        pendingAt('c', tuesday),
        pendingAt('d', tuesday),
      ],
      KYIV,
    );

    expect(planned).toHaveLength(4);
    expect(planned.every((reminder) => reminder.kind === 'individual')).toBe(
      true,
    );
  });

  it('orders the plan by day', () => {
    const monday = localTime(20_000, 11, 0, KYIV);
    const tuesday = localTime(20_001, 11, 0, KYIV);
    const planned = planReminders(
      [pendingAt('later', tuesday), pendingAt('earlier', monday)],
      KYIV,
    );

    expect(planned.map((reminder) => reminder.at)).toEqual([monday, tuesday]);
  });

  it('rejects an invalid window before planning anything', () => {
    expect(() =>
      planReminders([], KYIV, { startMinute: 600, endMinute: 100 }),
    ).toThrow(/Invalid reminder window/);
  });
});

describe('isReminderExpired', () => {
  const scheduledAt = localTime(20_000, 11, 0, KYIV);

  it('is false inside the deadline', () => {
    expect(isReminderExpired(scheduledAt, scheduledAt + 47 * HOUR)).toBe(false);
  });

  it('is false exactly on the deadline', () => {
    expect(
      isReminderExpired(scheduledAt, scheduledAt + FOLLOWUP_DEADLINE_MS),
    ).toBe(false);
  });

  it('is true past the deadline', () => {
    expect(
      isReminderExpired(scheduledAt, scheduledAt + FOLLOWUP_DEADLINE_MS + 1),
    ).toBe(true);
  });
});

describe('isLateAnswer', () => {
  const scheduledAt = localTime(20_000, 11, 0, KYIV);

  it('is false for an answer inside two days', () => {
    expect(isLateAnswer(scheduledAt, scheduledAt + HOUR)).toBe(false);
  });

  it('is false exactly on the deadline', () => {
    expect(isLateAnswer(scheduledAt, scheduledAt + FOLLOWUP_DEADLINE_MS)).toBe(
      false,
    );
  });

  it('is true one millisecond past the deadline', () => {
    expect(
      isLateAnswer(scheduledAt, scheduledAt + FOLLOWUP_DEADLINE_MS + 1),
    ).toBe(true);
  });
});

describe('planReminders after a timezone change', () => {
  it('pulls a follow-up back into the window of the current zone', () => {
    // Due at 14:00 in Kyiv, which is 04:00 in Los Angeles.
    const followupAt = localTime(101, 14, 0, KYIV);
    const [reminder] = planReminders([{ episodeId: 'a', followupAt }], LA);
    expect(reminder?.at).toBe(localTime(101, 10, 0, LA));
    expect(localHourMinute(reminder?.at ?? 0, LA)).toBe('10:00');
  });

  it('leaves a follow-up alone when the zone has not changed', () => {
    const followupAt = localTime(101, 14, 0, KYIV);
    const [reminder] = planReminders([{ episodeId: 'a', followupAt }], KYIV);
    expect(reminder?.at).toBe(followupAt);
  });
});

describe('planUpcomingReminders', () => {
  const day = 101;
  const due = (hour: number): PendingFollowup => ({
    episodeId: `at-${hour}`,
    followupAt: localTime(day, hour, 0, KYIV),
  });

  it('schedules only reminders that are still ahead', () => {
    const now = localTime(day, 13, 0, KYIV);
    const planned = planUpcomingReminders([due(11), due(15)], now, KYIV);
    expect(
      planned.map(
        (reminder) => reminder.kind === 'individual' && reminder.episodeId,
      ),
    ).toEqual(['at-15']);
  });

  it('drops expired follow-ups from planning altogether', () => {
    const now = localTime(day, 11, 0, KYIV) + FOLLOWUP_DEADLINE_MS + 1;
    expect(planUpcomingReminders([due(11)], now, KYIV)).toEqual([]);
  });

  it('keeps the plan stable when a due reminder has already fired', () => {
    // Four on one day: three individual, the fourth folds into a summary.
    // Once the first has fired, the summary must not turn into a fourth
    // individual reminder just because the first one left the list.
    const pending = [due(11), due(12), due(13), due(14)];
    const before = planUpcomingReminders(
      pending,
      localTime(day, 9, 0, KYIV),
      KYIV,
    );
    const after = planUpcomingReminders(
      pending,
      localTime(day, 11, 30, KYIV),
      KYIV,
    );

    expect(after).toEqual(before.slice(1));
    expect(after.at(-1)).toMatchObject({ kind: 'summary', count: 1 });
  });
});

describe('the default window', () => {
  it('is the ten to twenty hours the specification names', () => {
    expect(DEFAULT_REMINDER_WINDOW).toEqual({
      startMinute: 600,
      endMinute: 1200,
    });
  });
});
