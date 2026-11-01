import { localMinuteOfDay, toLocal } from '@/domain/time';

import type { Locale } from './index';

/** 24-hour clock in the local time of the given offset, e.g. "10:00". */
export function formatClock(utcMs: number, tzOffsetMinutes: number): string {
  const minutes = localMinuteOfDay(utcMs, tzOffsetMinutes);
  const hours = Math.floor(minutes / 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

const MONTHS: Record<Locale, readonly string[]> = {
  // Genitive, as in "30 жовтня".
  uk: [
    'січня',
    'лютого',
    'березня',
    'квітня',
    'травня',
    'червня',
    'липня',
    'серпня',
    'вересня',
    'жовтня',
    'листопада',
    'грудня',
  ],
  en: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
};

/** Day and month in the local time of the given offset, e.g. "30 жовтня".
 * Written out rather than through Intl, which Hermes does not fully carry. */
export function formatDayMonth(
  utcMs: number,
  tzOffsetMinutes: number,
  locale: Locale,
): string {
  const local = new Date(toLocal(utcMs, tzOffsetMinutes));
  const day = local.getUTCDate();
  const month = MONTHS[locale][local.getUTCMonth()] ?? '';
  return locale === 'uk' ? `${day} ${month}` : `${month} ${day}`;
}
