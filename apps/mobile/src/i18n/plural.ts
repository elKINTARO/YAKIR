import type { Locale } from './index';

export type PluralCategory = 'one' | 'few' | 'many';

/**
 * Written out by hand because Intl.PluralRules is not reliably present in
 * Hermes on Android. Ukrainian: 1, 21, 31 take "one"; 2-4, 22-24 take "few";
 * everything else, including 11-14, takes "many". English has no "few".
 */
export function pluralCategory(locale: Locale, count: number): PluralCategory {
  const n = Math.abs(Math.trunc(count));
  if (locale === 'en') {
    return n === 1 ? 'one' : 'many';
  }

  const lastDigit = n % 10;
  const lastTwo = n % 100;
  if (lastDigit === 1 && lastTwo !== 11) {
    return 'one';
  }
  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwo < 12 || lastTwo > 14)) {
    return 'few';
  }
  return 'many';
}
