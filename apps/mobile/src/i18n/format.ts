import { localMinuteOfDay } from '@/domain/time';

/** 24-hour clock in the local time of the given offset, e.g. "10:00". */
export function formatClock(utcMs: number, tzOffsetMinutes: number): string {
  const minutes = localMinuteOfDay(utcMs, tzOffsetMinutes);
  const hours = Math.floor(minutes / 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}
