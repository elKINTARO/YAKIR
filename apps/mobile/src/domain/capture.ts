import {
  computeFollowupAt,
  DEFAULT_REMINDER_WINDOW,
  type ReminderWindow,
} from './scheduling';
import { localDayNumber } from './time';
import type { NewEpisode, TagId } from './types';

/** Mirrors `CHECK (length(trim(fear)) >= 3)` in the schema. */
export const MIN_FEAR_LENGTH = 3;

export interface CaptureInput {
  intensity: number | null;
  fear: string;
  tags: readonly TagId[];
  probability: number | null;
}

/**
 * Counts characters the way SQLite's length() does, in code points rather than
 * UTF-16 units, so that the screen and the database agree about what is long
 * enough.
 */
export function fearLength(fear: string): number {
  return [...fear.trim()].length;
}

export function isFearLongEnough(fear: string): boolean {
  return fearLength(fear) >= MIN_FEAR_LENGTH;
}

const STATE_WORDS =
  /тривож|страшн|страх|панік|нерв|хвилю|погано|паршив|не по собі|anxious|anxiety|scared|afraid|nervous|panic|worried|uneasy/iu;

const EVENT_MARKERS =
  /(?:^|[^\p{L}])(?:що|якщо|коли|буде|будуть|станеться|скажуть|that|if|when|will)(?=[^\p{L}]|$)/iu;

/**
 * True when the text reads as a description of how the person feels rather
 * than of something that is supposed to happen. Only ever drives a soft hint:
 * a heuristic this crude must never stand between the person and saving.
 */
export function looksLikeState(fear: string): boolean {
  if (!isFearLongEnough(fear)) {
    return false;
  }
  return STATE_WORDS.test(fear) && !EVENT_MARKERS.test(fear);
}

/** Appends dictated text to what was already typed. */
export function joinTranscript(typed: string, transcript: string): string {
  const head = typed.trimEnd();
  const tail = transcript.trim();
  if (!tail) {
    return typed;
  }
  return head ? `${head} ${tail}` : tail;
}

export function isComplete(input: CaptureInput): boolean {
  return (
    input.intensity !== null &&
    input.probability !== null &&
    isFearLongEnough(input.fear)
  );
}

/**
 * `Date.getTimezoneOffset()` is positive west of UTC; the episode stores it
 * positive east of UTC. Subtracting from zero rather than negating keeps UTC
 * itself as 0 instead of -0.
 */
export function tzOffsetFromPlatform(platformOffsetMinutes: number): number {
  return 0 - platformOffsetMinutes;
}

export function buildEpisode(
  input: CaptureInput,
  createdAt: number,
  tzOffset: number,
  window: ReminderWindow = DEFAULT_REMINDER_WINDOW,
): NewEpisode {
  const { intensity, probability } = input;
  if (intensity === null || probability === null) {
    throw new Error(
      'Cannot store an episode without intensity and probability.',
    );
  }
  if (!isFearLongEnough(input.fear)) {
    throw new Error(
      `Cannot store an episode with a prediction shorter than ${MIN_FEAR_LENGTH} characters.`,
    );
  }

  return {
    createdAt,
    tzOffset,
    intensity,
    fear: input.fear.trim(),
    probability,
    tags: [...new Set(input.tags)],
    followupAt: computeFollowupAt(createdAt, tzOffset, window),
  };
}

export type FollowupDay = 'tomorrow' | 'dayAfterTomorrow';

/**
 * The follow-up is at least a day away, and the forward-only clamp can push it
 * one more day: an episode at 22:15 is checked the day after tomorrow at 10:00.
 * Saying "tomorrow" there would be a promise the app then breaks.
 */
export function followupDay(
  createdAt: number,
  followupAt: number,
  tzOffset: number,
): FollowupDay {
  const days =
    localDayNumber(followupAt, tzOffset) - localDayNumber(createdAt, tzOffset);
  return days <= 1 ? 'tomorrow' : 'dayAfterTomorrow';
}
