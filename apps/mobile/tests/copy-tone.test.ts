import { describe, expect, it } from 'vitest';

import { dictionaries, interpolate, LOCALES, t, uk } from '@/i18n';
import { en } from '@/i18n/en';

const REASSURANCE = [
  { pattern: /все буде добре/i, why: 'promises an outcome nobody knows' },
  { pattern: /всё будет хорошо/i, why: 'promises an outcome nobody knows' },
  {
    pattern: /everything will be (ok|fine|alright)/i,
    why: 'promises an outcome nobody knows',
  },
  { pattern: /не хвилюйся/i, why: 'tells the person their reaction is wrong' },
  { pattern: /не переживай/i, why: 'tells the person their reaction is wrong' },
  { pattern: /don'?t worry/i, why: 'tells the person their reaction is wrong' },
  { pattern: /ти в безпеці/i, why: 'a guarantee the app cannot make' },
  { pattern: /you are safe/i, why: 'a guarantee the app cannot make' },
  { pattern: /це просто тривога/i, why: 'dismisses the experience' },
  { pattern: /(it'?s )?just anxiety/i, why: 'dismisses the experience' },
  { pattern: /ти молодець/i, why: 'praise turns recording into a performance' },
  {
    pattern: /чудова робота/i,
    why: 'praise turns recording into a performance',
  },
  {
    pattern: /(great|good) (job|work)/i,
    why: 'praise turns recording into a performance',
  },
  { pattern: /well done/i, why: 'praise turns recording into a performance' },
];

const EXCLAMATION = /!/;
const EMOJI = /\p{Extended_Pictographic}/u;

describe('the dictionaries', () => {
  it('cover the same keys in every locale', () => {
    const reference = Object.keys(uk).sort();
    for (const locale of LOCALES) {
      expect(Object.keys(dictionaries[locale]).sort()).toEqual(reference);
    }
  });

  it('have no empty strings', () => {
    for (const locale of LOCALES) {
      for (const [key, value] of Object.entries(dictionaries[locale])) {
        expect(value.trim(), `${locale}.${key}`).not.toBe('');
      }
    }
  });
});

describe('copy tone', () => {
  const entries = LOCALES.flatMap((locale) =>
    Object.entries(dictionaries[locale]).map(([key, value]) => ({
      label: `${locale}.${key}`,
      value,
    })),
  );

  it.each(REASSURANCE)('contains no reassurance: $why', ({ pattern }) => {
    const offending = entries.filter((entry) => pattern.test(entry.value));
    expect(offending.map((entry) => entry.label)).toEqual([]);
  });

  it('uses no exclamation marks', () => {
    const offending = entries.filter((entry) => EXCLAMATION.test(entry.value));
    expect(offending.map((entry) => entry.label)).toEqual([]);
  });

  it('uses no emoji', () => {
    const offending = entries.filter((entry) => EMOJI.test(entry.value));
    expect(offending.map((entry) => entry.label)).toEqual([]);
  });

  it('rejects a phrase that would slip past a careless review', () => {
    const tempting = 'Все буде добре, не хвилюйся.';
    const caught = REASSURANCE.filter((rule) => rule.pattern.test(tempting));
    expect(caught.length).toBeGreaterThanOrEqual(2);
  });
});

describe('interpolate', () => {
  it('fills named placeholders', () => {
    expect(interpolate('о {time}', { time: '10:00' })).toBe('о 10:00');
  });

  it('accepts numbers', () => {
    expect(interpolate('{count} з {total}', { count: 2, total: 23 })).toBe(
      '2 з 23',
    );
  });

  it('leaves an unmatched placeholder as written rather than blanking it', () => {
    expect(interpolate('о {time}')).toBe('о {time}');
  });
});

describe('t', () => {
  it('returns ukrainian by default', () => {
    expect(t('common.done')).toBe(uk['common.done']);
  });

  it('fills placeholders from the dictionary entry', () => {
    expect(t('followup.stated', { probability: 85 })).toContain('85%');
  });
});

describe('the english dictionary', () => {
  it('is a complete implementation rather than a stub', () => {
    expect(Object.values(en).every((value) => value.length > 0)).toBe(true);
  });
});
