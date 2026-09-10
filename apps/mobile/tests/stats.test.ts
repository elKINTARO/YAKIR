import { describe, expect, it } from 'vitest';

import {
  buildCalendar,
  buildCalibrationPoints,
  compareIntensityToImpact,
  computeCalibration,
  distributionByHour,
  distributionByTag,
  MIN_EXERCISE_USES,
  MIN_SAMPLE,
  onTimeAnswers,
  outcomeValue,
  rankExercises,
  remainingUntilSufficient,
  type AnsweredPrediction,
  type CapturedEpisode,
} from '@/domain/stats';
import { OUTCOME } from '@/domain/types';

const KYIV = 180;
const LA = -420;

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function localTime(day: number, hour: number, tzOffsetMinutes: number): number {
  return day * DAY + hour * HOUR - tzOffsetMinutes * MINUTE;
}

function answered(
  overrides: Partial<AnsweredPrediction> = {},
): AnsweredPrediction {
  return {
    createdAt: localTime(20_000, 14, KYIV),
    tzOffset: KYIV,
    intensity: 7,
    probability: 80,
    outcome: OUTCOME.didNotHappen,
    actualImpact: null,
    wasLate: false,
    ...overrides,
  };
}

function captured(overrides: Partial<CapturedEpisode> = {}): CapturedEpisode {
  return {
    createdAt: localTime(20_000, 14, KYIV),
    tzOffset: KYIV,
    intensity: 5,
    tags: [],
    ...overrides,
  };
}

describe('onTimeAnswers', () => {
  it('keeps answers given inside the deadline', () => {
    const entries = [answered(), answered({ wasLate: true }), answered()];
    expect(onTimeAnswers(entries)).toHaveLength(2);
  });
});

describe('remainingUntilSufficient', () => {
  it('counts down towards the minimum sample', () => {
    expect(remainingUntilSufficient(0)).toBe(MIN_SAMPLE);
    expect(remainingUntilSufficient(7)).toBe(3);
  });

  it('never goes below zero', () => {
    expect(remainingUntilSufficient(MIN_SAMPLE)).toBe(0);
    expect(remainingUntilSufficient(MIN_SAMPLE + 5)).toBe(0);
  });
});

describe('computeCalibration', () => {
  it('reports nothing at all with no answers', () => {
    expect(computeCalibration([])).toEqual({
      n: 0,
      meanStatedProbability: 0,
      fullyOccurredRate: 0,
      partiallyOccurredRate: 0,
      overestimationGap: 0,
      isSufficient: false,
    });
  });

  it('averages the stated confidence', () => {
    const result = computeCalibration([
      answered({ probability: 60 }),
      answered({ probability: 80 }),
      answered({ probability: 100 }),
    ]);
    expect(result.meanStatedProbability).toBe(80);
    expect(result.n).toBe(3);
  });

  it('measures the gap between confidence and what happened', () => {
    const entries = [
      ...Array.from({ length: 9 }, () =>
        answered({ probability: 80, outcome: OUTCOME.didNotHappen }),
      ),
      answered({ probability: 80, outcome: OUTCOME.happened }),
    ];
    const result = computeCalibration(entries);

    expect(result.fullyOccurredRate).toBeCloseTo(0.1);
    expect(result.overestimationGap).toBeCloseTo(0.7);
  });

  it('reports partial outcomes separately and never as occurrences', () => {
    const result = computeCalibration([
      answered({ outcome: OUTCOME.partly }),
      answered({ outcome: OUTCOME.partly }),
      answered({ outcome: OUTCOME.didNotHappen }),
      answered({ outcome: OUTCOME.happened }),
    ]);

    expect(result.partiallyOccurredRate).toBe(0.5);
    expect(result.fullyOccurredRate).toBe(0.25);
  });

  it('leaves late answers out of every figure', () => {
    const result = computeCalibration([
      answered({ probability: 20, outcome: OUTCOME.didNotHappen }),
      answered({
        probability: 100,
        outcome: OUTCOME.happened,
        wasLate: true,
      }),
    ]);

    expect(result.n).toBe(1);
    expect(result.meanStatedProbability).toBe(20);
    expect(result.fullyOccurredRate).toBe(0);
  });

  it.each([
    [MIN_SAMPLE - 1, false],
    [MIN_SAMPLE, true],
  ])('with %i answers reports sufficiency as %s', (count, expected) => {
    const entries = Array.from({ length: count }, () => answered());
    expect(computeCalibration(entries).isSufficient).toBe(expected);
  });
});

describe('outcomeValue', () => {
  it.each([
    [OUTCOME.didNotHappen, 0],
    [OUTCOME.partly, 0.5],
    [OUTCOME.happened, 1],
  ])('maps %i to %d', (outcome, expected) => {
    expect(outcomeValue(outcome)).toBe(expected);
  });
});

describe('buildCalibrationPoints', () => {
  it('pairs each stated probability with what happened', () => {
    const points = buildCalibrationPoints([
      answered({ probability: 90, outcome: OUTCOME.didNotHappen }),
      answered({ probability: 40, outcome: OUTCOME.partly }),
    ]);

    expect(points).toEqual([
      { probability: 90, outcomeValue: 0 },
      { probability: 40, outcomeValue: 0.5 },
    ]);
  });

  it('excludes late answers, as the headline figure does', () => {
    const points = buildCalibrationPoints([
      answered(),
      answered({ wasLate: true }),
    ]);
    expect(points).toHaveLength(1);
  });
});

describe('compareIntensityToImpact', () => {
  it('reports nothing when the feared thing never happened', () => {
    expect(
      compareIntensityToImpact([answered({ outcome: OUTCOME.didNotHappen })]),
    ).toEqual({ n: 0, meanIntensity: 0, meanActualImpact: 0 });
  });

  it('compares how bad it felt against how bad it turned out', () => {
    const result = compareIntensityToImpact([
      answered({
        outcome: OUTCOME.happened,
        intensity: 9,
        actualImpact: 4,
      }),
      answered({
        outcome: OUTCOME.happened,
        intensity: 7,
        actualImpact: 2,
      }),
    ]);

    expect(result).toEqual({ n: 2, meanIntensity: 8, meanActualImpact: 3 });
  });

  it('skips occurrences with no recorded impact', () => {
    const result = compareIntensityToImpact([
      answered({ outcome: OUTCOME.happened, actualImpact: null }),
      answered({ outcome: OUTCOME.happened, intensity: 6, actualImpact: 6 }),
    ]);
    expect(result.n).toBe(1);
  });

  it('leaves partial outcomes out of the comparison', () => {
    const result = compareIntensityToImpact([
      answered({ outcome: OUTCOME.partly, actualImpact: 3 }),
    ]);
    expect(result.n).toBe(0);
  });

  it('leaves late answers out', () => {
    const result = compareIntensityToImpact([
      answered({
        outcome: OUTCOME.happened,
        actualImpact: 3,
        wasLate: true,
      }),
    ]);
    expect(result.n).toBe(0);
  });
});

describe('buildCalendar', () => {
  it('is empty when nothing was recorded', () => {
    expect(buildCalendar([])).toEqual([]);
  });

  it('keeps the strongest episode of each day', () => {
    const calendar = buildCalendar([
      captured({ createdAt: localTime(20_000, 9, KYIV), intensity: 4 }),
      captured({ createdAt: localTime(20_000, 21, KYIV), intensity: 8 }),
      captured({ createdAt: localTime(20_001, 12, KYIV), intensity: 2 }),
    ]);

    expect(calendar).toEqual([
      { day: 20_000, maxIntensity: 8, count: 2 },
      { day: 20_001, maxIntensity: 2, count: 1 },
    ]);
  });

  it('orders days oldest first regardless of input order', () => {
    const calendar = buildCalendar([
      captured({ createdAt: localTime(20_005, 12, KYIV) }),
      captured({ createdAt: localTime(20_001, 12, KYIV) }),
    ]);
    expect(calendar.map((entry) => entry.day)).toEqual([20_001, 20_005]);
  });

  it('groups by the local day of each recording', () => {
    const calendar = buildCalendar([
      captured({ createdAt: localTime(20_000, 23, KYIV), tzOffset: KYIV }),
      captured({ createdAt: localTime(20_000, 1, KYIV), tzOffset: KYIV }),
    ]);
    expect(calendar).toHaveLength(1);
  });
});

describe('rankExercises', () => {
  function used(exerciseId: string, relief: number | null) {
    return { exerciseId, relief };
  }

  it('is empty with nothing recorded', () => {
    expect(rankExercises([])).toEqual([]);
  });

  it('ignores exercises used fewer than the minimum times', () => {
    const ranked = rankExercises([
      used('breathing-478', 9),
      used('breathing-478', 9),
    ]);
    expect(ranked).toEqual([]);
    expect(MIN_EXERCISE_USES).toBe(3);
  });

  it('ranks by average relief once there is enough use', () => {
    const ranked = rankExercises([
      used('grounding-54321', 4),
      used('grounding-54321', 6),
      used('grounding-54321', 5),
      used('breathing-478', 8),
      used('breathing-478', 8),
      used('breathing-478', 8),
    ]);

    expect(ranked).toEqual([
      { exerciseId: 'breathing-478', meanRelief: 8, uses: 3 },
      { exerciseId: 'grounding-54321', meanRelief: 5, uses: 3 },
    ]);
  });

  it('skips runs with no relief rating', () => {
    const ranked = rankExercises([
      used('cold-reset', 7),
      used('cold-reset', 7),
      used('cold-reset', null),
    ]);
    expect(ranked).toEqual([]);
  });

  it('breaks ties by identifier so the order is stable', () => {
    const ranked = rankExercises([
      used('b', 5),
      used('b', 5),
      used('b', 5),
      used('a', 5),
      used('a', 5),
      used('a', 5),
    ]);
    expect(ranked.map((entry) => entry.exerciseId)).toEqual(['a', 'b']);
  });

  it('honours a custom minimum', () => {
    const ranked = rankExercises([used('cold-reset', 6)], 1);
    expect(ranked).toEqual([
      { exerciseId: 'cold-reset', meanRelief: 6, uses: 1 },
    ]);
  });
});

describe('distributionByHour', () => {
  it('returns a bucket for every hour even with no episodes', () => {
    const hours = distributionByHour([]);
    expect(hours).toHaveLength(24);
    expect(hours.every((count) => count === 0)).toBe(true);
  });

  it('counts episodes into their local hour', () => {
    const hours = distributionByHour([
      captured({ createdAt: localTime(20_000, 3, KYIV) }),
      captured({ createdAt: localTime(20_001, 3, KYIV) }),
      captured({ createdAt: localTime(20_000, 17, KYIV) }),
    ]);

    expect(hours[3]).toBe(2);
    expect(hours[17]).toBe(1);
  });

  it('uses the offset recorded with each episode', () => {
    const hours = distributionByHour([
      captured({ createdAt: localTime(20_000, 9, KYIV), tzOffset: KYIV }),
      captured({ createdAt: localTime(20_000, 9, LA), tzOffset: LA }),
    ]);

    expect(hours[9]).toBe(2);
  });
});

describe('distributionByTag', () => {
  it('is empty when nothing was tagged', () => {
    expect(distributionByTag([captured({ tags: [] })])).toEqual([]);
  });

  it('counts every tag on every episode', () => {
    const counts = distributionByTag([
      captured({ tags: ['work', 'money'] }),
      captured({ tags: ['work'] }),
      captured({ tags: ['health'] }),
    ]);

    expect(counts).toEqual([
      { tag: 'work', count: 2 },
      { tag: 'health', count: 1 },
      { tag: 'money', count: 1 },
    ]);
  });
});
