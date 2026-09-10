export const MINUTE_MS = 60_000;
export const HOUR_MS = 60 * MINUTE_MS;
export const DAY_MS = 24 * HOUR_MS;
export const MINUTES_PER_DAY = 24 * 60;

export function toLocal(utcMs: number, tzOffsetMinutes: number): number {
  return utcMs + tzOffsetMinutes * MINUTE_MS;
}

export function toUtc(localMs: number, tzOffsetMinutes: number): number {
  return localMs - tzOffsetMinutes * MINUTE_MS;
}

export function startOfLocalDay(localMs: number): number {
  return Math.floor(localMs / DAY_MS) * DAY_MS;
}

export function localDayNumber(utcMs: number, tzOffsetMinutes: number): number {
  return Math.floor(toLocal(utcMs, tzOffsetMinutes) / DAY_MS);
}

export function localMinuteOfDay(
  utcMs: number,
  tzOffsetMinutes: number,
): number {
  const local = toLocal(utcMs, tzOffsetMinutes);
  return Math.floor((local - startOfLocalDay(local)) / MINUTE_MS);
}

export function localHour(utcMs: number, tzOffsetMinutes: number): number {
  return Math.floor(localMinuteOfDay(utcMs, tzOffsetMinutes) / 60);
}
