import { en } from './en';
import { uk, type Dictionary, type TranslationKey } from './uk';

export type { Dictionary, TranslationKey };
export { en, uk };

export const LOCALES = ['uk', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const dictionaries: Record<Locale, Dictionary> = { uk, en };

let locale: Locale = 'uk';

export function getLocale(): Locale {
  return locale;
}

export function setLocale(next: Locale): void {
  locale = next;
}

export type Placeholders = Record<string, string | number>;

export function interpolate(
  template: string,
  values: Placeholders = {},
): string {
  return template.replace(/\{(\w+)\}/g, (whole, name: string) => {
    const value = values[name];
    return value === undefined ? whole : String(value);
  });
}

export function t(key: TranslationKey, values?: Placeholders): string {
  return interpolate(dictionaries[locale][key], values);
}
