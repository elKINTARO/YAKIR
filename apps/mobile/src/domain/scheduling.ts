const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;
const MINUTES_PER_DAY = 24 * 60;

export const FOLLOWUP_DELAY_MS = 24 * 60 * MINUTE_MS;

export const FOLLOWUP_DEADLINE_MS = 48 * 60 * MINUTE_MS;

export const SLOT_MS = 30 * MINUTE_MS;

export const MAX_REMINDERS_PER_DAY = 3;

export interface ReminderWindow {
  startMinute: number;
  endMinute: number;
}

export const DEFAULT_REMINDER_WINDOW: ReminderWindow = {
  startMinute: 10 * 60,
  endMinute: 20 * 60,
};

function assertWindow(window: ReminderWindow): void {
  const { startMinute, endMinute } = window;
  if (
    !Number.isInteger(startMinute) ||
    !Number.isInteger(endMinute) ||
    startMinute < 0 ||
    endMinute > MINUTES_PER_DAY ||
    startMinute >= endMinute
  ) {
    throw new Error(
      `Invalid reminder window ${startMinute}..${endMinute}: it must be an increasing range inside one day.`,
    );
  }
}

function toLocal(utcMs: number, tzOffsetMinutes: number): number {
  return utcMs + tzOffsetMinutes * MINUTE_MS;
}

function toUtc(localMs: number, tzOffsetMinutes: number): number {
  return localMs - tzOffsetMinutes * MINUTE_MS;
}

/** Local midnight of the day the given local timestamp falls in. */
function startOfLocalDay(localMs: number): number {
  return Math.floor(localMs / DAY_MS) * DAY_MS;
}

export function localMinuteOfDay(
  utcMs: number,
  tzOffsetMinutes: number,
): number {
  const local = toLocal(utcMs, tzOffsetMinutes);
  return Math.floor((local - startOfLocalDay(local)) / MINUTE_MS);
}

function clampLocalToWindow(localMs: number, window: ReminderWindow): number {
  const dayStart = startOfLocalDay(localMs);
  const minuteOfDay = (localMs - dayStart) / MINUTE_MS;

  if (minuteOfDay < window.startMinute) {
    return dayStart + window.startMinute * MINUTE_MS;
  }
  if (minuteOfDay > window.endMinute) {
    return dayStart + DAY_MS + window.startMinute * MINUTE_MS;
  }
  return localMs;
}

export function computeFollowupAt(
  createdAt: number,
  tzOffsetMinutes: number,
  window: ReminderWindow = DEFAULT_REMINDER_WINDOW,
): number {
  assertWindow(window);
  const base = toLocal(createdAt + FOLLOWUP_DELAY_MS, tzOffsetMinutes);
  return toUtc(clampLocalToWindow(base, window), tzOffsetMinutes);
}

export function slotOf(utcMs: number): number {
  return Math.floor(utcMs / SLOT_MS);
}

export function findFreeSlot(
  candidate: number,
  taken: readonly number[],
  tzOffsetMinutes: number,
  window: ReminderWindow = DEFAULT_REMINDER_WINDOW,
): number {
  assertWindow(window);
  const occupied = new Set(taken.map(slotOf));

  let at = candidate;
  while (occupied.has(slotOf(at))) {
    at = toUtc(
      clampLocalToWindow(toLocal(at + SLOT_MS, tzOffsetMinutes), window),
      tzOffsetMinutes,
    );
  }
  return at;
}

export interface PendingFollowup {
  episodeId: string;
  followupAt: number;
}

export interface IndividualReminder {
  kind: 'individual';
  episodeId: string;
  at: number;
}

export interface SummaryReminder {
  kind: 'summary';
  at: number;
  count: number;
  episodeIds: readonly string[];
}

export type PlannedReminder = IndividualReminder | SummaryReminder;

export function planReminders(
  pending: readonly PendingFollowup[],
  tzOffsetMinutes: number,
  window: ReminderWindow = DEFAULT_REMINDER_WINDOW,
): PlannedReminder[] {
  assertWindow(window);

  const ordered = [...pending].sort((a, b) => a.followupAt - b.followupAt);
  const taken: number[] = [];
  const byDay = new Map<number, IndividualReminder[]>();

  for (const item of ordered) {
    const at = findFreeSlot(item.followupAt, taken, tzOffsetMinutes, window);
    taken.push(at);

    const day = startOfLocalDay(toLocal(at, tzOffsetMinutes));
    const bucket = byDay.get(day);
    if (bucket) {
      bucket.push({ kind: 'individual', episodeId: item.episodeId, at });
    } else {
      byDay.set(day, [{ kind: 'individual', episodeId: item.episodeId, at }]);
    }
  }

  const planned: PlannedReminder[] = [];
  const days = [...byDay.entries()].sort(([a], [b]) => a - b);

  for (const [, reminders] of days) {
    planned.push(...reminders.slice(0, MAX_REMINDERS_PER_DAY));

    const overflow = reminders.slice(MAX_REMINDERS_PER_DAY);
    const first = overflow[0];
    if (first) {
      planned.push({
        kind: 'summary',
        at: first.at,
        count: overflow.length,
        episodeIds: overflow.map((reminder) => reminder.episodeId),
      });
    }
  }

  return planned;
}

export function isReminderExpired(scheduledAt: number, now: number): boolean {
  return now > scheduledAt + FOLLOWUP_DEADLINE_MS;
}

export function isLateAnswer(
  scheduledAt: number,
  completedAt: number,
): boolean {
  return completedAt > scheduledAt + FOLLOWUP_DEADLINE_MS;
}

export function shouldReschedule(
  previousTzOffsetMinutes: number | null,
  currentTzOffsetMinutes: number,
): boolean {
  return previousTzOffsetMinutes !== currentTzOffsetMinutes;
}
