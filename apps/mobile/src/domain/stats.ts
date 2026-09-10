import { localDayNumber, localHour } from './time';
import { OUTCOME, type Outcome } from './types';

export const MIN_SAMPLE = 10;

export const MIN_EXERCISE_USES = 3;

export interface AnsweredPrediction {
  createdAt: number;
  tzOffset: number;
  intensity: number;
  probability: number;
  outcome: Outcome;
  actualImpact: number | null;
  wasLate: boolean;
}

export interface CapturedEpisode {
  createdAt: number;
  tzOffset: number;
  intensity: number;
  tags: readonly string[];
}

export interface FinishedExercise {
  exerciseId: string;
  relief: number | null;
}

export interface CalibrationResult {
  n: number;
  meanStatedProbability: number;
  fullyOccurredRate: number;
  partiallyOccurredRate: number;
  overestimationGap: number;
  isSufficient: boolean;
}

export function onTimeAnswers(
  entries: readonly AnsweredPrediction[],
): AnsweredPrediction[] {
  return entries.filter((entry) => !entry.wasLate);
}

export function remainingUntilSufficient(n: number): number {
  return Math.max(0, MIN_SAMPLE - n);
}

function mean(values: readonly number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((total, value) => total + value, 0) / values.length;
}

export function computeCalibration(
  entries: readonly AnsweredPrediction[],
): CalibrationResult {
  const valid = onTimeAnswers(entries);
  const n = valid.length;

  if (n === 0) {
    return {
      n: 0,
      meanStatedProbability: 0,
      fullyOccurredRate: 0,
      partiallyOccurredRate: 0,
      overestimationGap: 0,
      isSufficient: false,
    };
  }

  const meanStatedProbability = mean(valid.map((entry) => entry.probability));
  const fully = valid.filter(
    (entry) => entry.outcome === OUTCOME.happened,
  ).length;
  const partly = valid.filter(
    (entry) => entry.outcome === OUTCOME.partly,
  ).length;

  const fullyOccurredRate = fully / n;

  return {
    n,
    meanStatedProbability,
    fullyOccurredRate,
    partiallyOccurredRate: partly / n,
    overestimationGap: meanStatedProbability / 100 - fullyOccurredRate,
    isSufficient: n >= MIN_SAMPLE,
  };
}

/** 0 for did not happen, 0.5 for partly, 1 for happened. */
export function outcomeValue(outcome: Outcome): number {
  if (outcome === OUTCOME.happened) {
    return 1;
  }
  if (outcome === OUTCOME.partly) {
    return 0.5;
  }
  return 0;
}

export interface CalibrationPoint {
  probability: number;
  outcomeValue: number;
}

export function buildCalibrationPoints(
  entries: readonly AnsweredPrediction[],
): CalibrationPoint[] {
  return onTimeAnswers(entries).map((entry) => ({
    probability: entry.probability,
    outcomeValue: outcomeValue(entry.outcome),
  }));
}

export interface IntensityAgainstImpact {
  n: number;
  meanIntensity: number;
  meanActualImpact: number;
}

export function compareIntensityToImpact(
  entries: readonly AnsweredPrediction[],
): IntensityAgainstImpact {
  const occurred = onTimeAnswers(entries).filter(
    (entry): entry is AnsweredPrediction & { actualImpact: number } =>
      entry.outcome === OUTCOME.happened && entry.actualImpact !== null,
  );

  return {
    n: occurred.length,
    meanIntensity: mean(occurred.map((entry) => entry.intensity)),
    meanActualImpact: mean(occurred.map((entry) => entry.actualImpact)),
  };
}

export interface CalendarDay {
  day: number;
  maxIntensity: number;
  count: number;
}

export function buildCalendar(
  episodes: readonly CapturedEpisode[],
): CalendarDay[] {
  const byDay = new Map<number, CalendarDay>();

  for (const episode of episodes) {
    const day = localDayNumber(episode.createdAt, episode.tzOffset);
    const existing = byDay.get(day);
    if (existing) {
      existing.maxIntensity = Math.max(
        existing.maxIntensity,
        episode.intensity,
      );
      existing.count += 1;
    } else {
      byDay.set(day, { day, maxIntensity: episode.intensity, count: 1 });
    }
  }

  return [...byDay.values()].sort((a, b) => a.day - b.day);
}

export interface ExerciseRanking {
  exerciseId: string;
  meanRelief: number;
  uses: number;
}

export function rankExercises(
  finished: readonly FinishedExercise[],
  minUses: number = MIN_EXERCISE_USES,
): ExerciseRanking[] {
  const byExercise = new Map<string, number[]>();

  for (const entry of finished) {
    if (entry.relief === null) {
      continue;
    }
    const collected = byExercise.get(entry.exerciseId);
    if (collected) {
      collected.push(entry.relief);
    } else {
      byExercise.set(entry.exerciseId, [entry.relief]);
    }
  }

  const ranked: ExerciseRanking[] = [];
  for (const [exerciseId, reliefs] of byExercise) {
    if (reliefs.length < minUses) {
      continue;
    }
    ranked.push({
      exerciseId,
      meanRelief: mean(reliefs),
      uses: reliefs.length,
    });
  }

  return ranked.sort(
    (a, b) =>
      b.meanRelief - a.meanRelief || a.exerciseId.localeCompare(b.exerciseId),
  );
}

export function distributionByHour(
  episodes: readonly CapturedEpisode[],
): number[] {
  const counts = new Map<number, number>();

  for (const episode of episodes) {
    const hour = localHour(episode.createdAt, episode.tzOffset);
    counts.set(hour, (counts.get(hour) ?? 0) + 1);
  }

  return Array.from({ length: 24 }, (_unused, hour) => counts.get(hour) ?? 0);
}

export interface TagCount {
  tag: string;
  count: number;
}

export function distributionByTag(
  episodes: readonly CapturedEpisode[],
): TagCount[] {
  const counts = new Map<string, number>();

  for (const episode of episodes) {
    for (const tag of episode.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}
