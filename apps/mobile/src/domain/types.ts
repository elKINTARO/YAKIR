/**
 * Domain types. Repositories return these, never raw database rows.
 *
 * Every timestamp is unix milliseconds in UTC. Formatting happens at the UI
 * boundary and nowhere else.
 */

export type EpisodeId = string;

export interface Episode {
  id: EpisodeId;
  /** Unix ms, UTC. */
  createdAt: number;
  /** Minutes from UTC at the moment of capture, kept so that time-of-day
   * statistics are computed in the local time the episode happened in. */
  tzOffset: number;
  /** 0..10 */
  intensity: number;
  /** The prediction, verbatim. Never edited after creation. */
  fear: string;
  /** 0..100, the stated subjective confidence. */
  probability: number;
  tags: readonly string[];
  /** Unix ms, UTC. When the follow-up is due. */
  followupAt: number;
  /** Identifier of the scheduled local notification, if one exists. */
  notificationId: string | null;
}

export const OUTCOME = {
  didNotHappen: 0,
  partly: 1,
  happened: 2,
} as const;

export type Outcome = (typeof OUTCOME)[keyof typeof OUTCOME];

export interface Followup {
  episodeId: EpisodeId;
  completedAt: number;
  outcome: Outcome;
  /** 0..10, how bad it actually turned out. Null when nothing happened. */
  actualImpact: number | null;
  whatHelped: string | null;
  /** Answered more than 48 hours after the follow-up was due. Late answers are
   * excluded from calibration, because recall by then is reconstructed. */
  wasLate: boolean;
}

export type ExerciseCategory =
  'grounding' | 'breathing' | 'body' | 'cognitive' | 'behavioural';

export interface Exercise {
  id: string;
  slug: string;
  title: string;
  durationSec: number;
  category: ExerciseCategory;
  bodyMd: string;
  /** Where the method comes from. */
  sourceNote: string | null;
}

export interface ExerciseLog {
  id: string;
  exerciseId: string;
  /** The episode this was started from, if any. */
  episodeId: EpisodeId | null;
  startedAt: number;
  /** Null means the exercise was interrupted. */
  completedAt: number | null;
  /** 0..10, self-reported relief afterwards. */
  relief: number | null;
}
