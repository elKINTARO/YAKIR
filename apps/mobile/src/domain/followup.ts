import { isLateAnswer } from './scheduling';
import { OUTCOME, type EpisodeId, type Followup, type Outcome } from './types';

export interface FollowupInput {
  outcome: Outcome | null;
  actualImpact: number | null;
  whatHelped: string;
}

/** "How bad did it actually turn out" only makes sense if something happened. */
export function needsImpact(outcome: Outcome | null): boolean {
  return outcome === OUTCOME.partly || outcome === OUTCOME.happened;
}

export function isFollowupComplete(input: FollowupInput): boolean {
  if (input.outcome === null) {
    return false;
  }
  return !needsImpact(input.outcome) || input.actualImpact !== null;
}

export function buildFollowup(
  episode: { id: EpisodeId; followupAt: number },
  input: FollowupInput,
  completedAt: number,
): Followup {
  const { outcome } = input;
  if (outcome === null || !isFollowupComplete(input)) {
    throw new Error('Cannot store an incomplete follow-up.');
  }

  const whatHelped = input.whatHelped.trim();
  return {
    episodeId: episode.id,
    completedAt,
    outcome,
    // A value left on the slider before switching to "did not happen" is not
    // an answer to a question that no longer applies.
    actualImpact: needsImpact(outcome) ? input.actualImpact : null,
    whatHelped: whatHelped === '' ? null : whatHelped,
    wasLate: isLateAnswer(episode.followupAt, completedAt),
  };
}

export type Reflection =
  | { kind: 'didNotHappen'; ordinal: number; total: number }
  | {
      kind: 'lighterThanFeared';
      partly: boolean;
      impact: number;
      intensity: number;
    }
  | { kind: 'asHardAsFeared'; partly: boolean };

/**
 * The deterministic block shown after saving, section 9.3. Counts include late
 * answers: this is a count of cases, not the calibration, and a late answer
 * that left itself out would read as an arithmetic mistake.
 *
 * When it happened and was as hard as feared, the message says so and stops.
 * There is no attempt to turn it into something positive.
 */
export function selectReflection(
  intensity: number,
  followup: Followup,
  allFollowups: readonly Followup[],
): Reflection {
  if (followup.outcome === OUTCOME.didNotHappen) {
    const answered = allFollowups.some(
      (other) => other.episodeId === followup.episodeId,
    )
      ? allFollowups
      : [...allFollowups, followup];
    return {
      kind: 'didNotHappen',
      ordinal: answered.filter(
        (other) => other.outcome === OUTCOME.didNotHappen,
      ).length,
      total: answered.length,
    };
  }

  const partly = followup.outcome === OUTCOME.partly;
  const impact = followup.actualImpact;
  if (impact !== null && impact < intensity) {
    return { kind: 'lighterThanFeared', partly, impact, intensity };
  }
  return { kind: 'asHardAsFeared', partly };
}
