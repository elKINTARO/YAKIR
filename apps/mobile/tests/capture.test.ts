import { describe, expect, it } from 'vitest';

import {
  buildEpisode,
  fearLength,
  followupDay,
  isComplete,
  isFearLongEnough,
  joinTranscript,
  looksLikeState,
  MIN_FEAR_LENGTH,
  tzOffsetFromPlatform,
  type CaptureInput,
} from '@/domain/capture';
import { computeFollowupAt } from '@/domain/scheduling';

const KYIV = 180;

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function localTime(day: number, hour: number, minute: number): number {
  return day * DAY + hour * HOUR + minute * MINUTE - KYIV * MINUTE;
}

const COMPLETE: CaptureInput = {
  intensity: 7,
  fear: '  на зустрічі скажуть, що я не тягну проєкт  ',
  tags: ['work'],
  probability: 85,
};

describe('fear length', () => {
  it('ignores surrounding whitespace, like trim() in the schema check', () => {
    expect(fearLength('   ab   ')).toBe(2);
    expect(isFearLongEnough('   ab   ')).toBe(false);
    expect(isFearLongEnough('abc')).toBe(true);
  });

  it('counts code points rather than UTF-16 units, as SQLite does', () => {
    expect('𝒳𝒳'.length).toBe(4);
    expect(fearLength('𝒳𝒳')).toBe(2);
    expect(isFearLongEnough('𝒳𝒳')).toBe(false);
  });

  it('uses the minimum from the schema', () => {
    expect(MIN_FEAR_LENGTH).toBe(3);
  });
});

describe('looksLikeState', () => {
  it.each(['мені тривожно', 'Дуже страшно', 'знову панікую', 'I feel anxious'])(
    'hints when "%s" describes a feeling',
    (text) => {
      expect(looksLikeState(text)).toBe(true);
    },
  );

  it.each([
    'мене звільнять після зустрічі',
    'страшно, що мене звільнять',
    'мені буде погано на співбесіді',
    'I am afraid that they will fire me',
  ])('stays quiet when "%s" names an event', (text) => {
    expect(looksLikeState(text)).toBe(false);
  });

  it('stays quiet while the text is still too short to judge', () => {
    expect(looksLikeState('ст')).toBe(false);
  });
});

describe('joinTranscript', () => {
  it('uses the transcript alone when nothing was typed', () => {
    expect(joinTranscript('', ' мене звільнять ')).toBe('мене звільнять');
  });

  it('appends the transcript to typed text with one space', () => {
    expect(joinTranscript('на зустрічі  ', 'скажуть')).toBe(
      'на зустрічі скажуть',
    );
  });

  it('leaves the typed text untouched when nothing was heard', () => {
    expect(joinTranscript('на зустрічі ', '   ')).toBe('на зустрічі ');
  });
});

describe('isComplete', () => {
  it('accepts a draft with all three answers', () => {
    expect(isComplete(COMPLETE)).toBe(true);
  });

  it.each([
    ['intensity', { ...COMPLETE, intensity: null }],
    ['probability', { ...COMPLETE, probability: null }],
    ['prediction', { ...COMPLETE, fear: ' a ' }],
  ])('rejects a draft without %s', (_, draft) => {
    expect(isComplete(draft)).toBe(false);
  });

  it('accepts zero as an answer, not as a missing one', () => {
    expect(isComplete({ ...COMPLETE, intensity: 0, probability: 0 })).toBe(
      true,
    );
  });
});

describe('tzOffsetFromPlatform', () => {
  it('flips the sign of Date.getTimezoneOffset', () => {
    expect(tzOffsetFromPlatform(-180)).toBe(KYIV);
    expect(tzOffsetFromPlatform(420)).toBe(-420);
  });

  it('keeps UTC as 0 rather than -0', () => {
    expect(Object.is(tzOffsetFromPlatform(0), 0)).toBe(true);
  });
});

describe('buildEpisode', () => {
  const createdAt = localTime(100, 14, 30);

  it('stores the trimmed prediction and the moment of capture', () => {
    const episode = buildEpisode(COMPLETE, createdAt, KYIV);

    expect(episode).toEqual({
      createdAt,
      tzOffset: KYIV,
      intensity: 7,
      fear: 'на зустрічі скажуть, що я не тягну проєкт',
      probability: 85,
      tags: ['work'],
      followupAt: computeFollowupAt(createdAt, KYIV),
    });
  });

  it('schedules the follow-up by the rules of the scheduling module', () => {
    const lateNight = localTime(100, 22, 15);
    expect(buildEpisode(COMPLETE, lateNight, KYIV).followupAt).toBe(
      localTime(102, 10, 0),
    );
  });

  it('honours a custom reminder window', () => {
    const episode = buildEpisode(COMPLETE, createdAt, KYIV, {
      startMinute: 16 * 60,
      endMinute: 18 * 60,
    });
    expect(episode.followupAt).toBe(localTime(101, 16, 0));
  });

  it('drops repeated tags', () => {
    const episode = buildEpisode(
      { ...COMPLETE, tags: ['work', 'money', 'work'] },
      createdAt,
      KYIV,
    );
    expect(episode.tags).toEqual(['work', 'money']);
  });

  it('refuses a draft without intensity or probability', () => {
    expect(() =>
      buildEpisode({ ...COMPLETE, intensity: null }, createdAt, KYIV),
    ).toThrow(/intensity and probability/);
    expect(() =>
      buildEpisode({ ...COMPLETE, probability: null }, createdAt, KYIV),
    ).toThrow(/intensity and probability/);
  });

  it('refuses a prediction the database would reject', () => {
    expect(() =>
      buildEpisode({ ...COMPLETE, fear: '  ok ' }, createdAt, KYIV),
    ).toThrow(/shorter than 3/);
  });
});

describe('followupDay', () => {
  it('says tomorrow for an afternoon episode', () => {
    const createdAt = localTime(100, 14, 30);
    expect(
      followupDay(createdAt, computeFollowupAt(createdAt, KYIV), KYIV),
    ).toBe('tomorrow');
  });

  it('says tomorrow for an episode after midnight', () => {
    const createdAt = localTime(100, 2, 30);
    expect(
      followupDay(createdAt, computeFollowupAt(createdAt, KYIV), KYIV),
    ).toBe('tomorrow');
  });

  it('says the day after tomorrow when the window pushes it on', () => {
    const createdAt = localTime(100, 22, 15);
    expect(
      followupDay(createdAt, computeFollowupAt(createdAt, KYIV), KYIV),
    ).toBe('dayAfterTomorrow');
  });
});
