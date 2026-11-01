import { describe, expect, it } from 'vitest';

import {
  buildFollowup,
  isFollowupComplete,
  needsImpact,
  selectReflection,
  type FollowupInput,
} from '@/domain/followup';
import { FOLLOWUP_DEADLINE_MS } from '@/domain/scheduling';
import { OUTCOME, type Followup, type Outcome } from '@/domain/types';

const EPISODE = { id: 'e1', followupAt: 1_000_000 };

function followup(
  episodeId: string,
  outcome: Outcome,
  actualImpact: number | null = null,
): Followup {
  return {
    episodeId,
    completedAt: 0,
    outcome,
    actualImpact,
    whatHelped: null,
    wasLate: false,
  };
}

describe('needsImpact', () => {
  it('asks how bad it was only when something happened', () => {
    expect(needsImpact(null)).toBe(false);
    expect(needsImpact(OUTCOME.didNotHappen)).toBe(false);
    expect(needsImpact(OUTCOME.partly)).toBe(true);
    expect(needsImpact(OUTCOME.happened)).toBe(true);
  });
});

describe('isFollowupComplete', () => {
  const base: FollowupInput = {
    outcome: null,
    actualImpact: null,
    whatHelped: '',
  };

  it('needs an outcome', () => {
    expect(isFollowupComplete(base)).toBe(false);
  });

  it('is complete with "did not happen" alone, two taps in total', () => {
    expect(isFollowupComplete({ ...base, outcome: OUTCOME.didNotHappen })).toBe(
      true,
    );
  });

  it('needs the actual impact when it happened', () => {
    expect(isFollowupComplete({ ...base, outcome: OUTCOME.happened })).toBe(
      false,
    );
    expect(
      isFollowupComplete({
        ...base,
        outcome: OUTCOME.partly,
        actualImpact: 0,
      }),
    ).toBe(true);
  });
});

describe('buildFollowup', () => {
  it('stores the answer with a trimmed note', () => {
    expect(
      buildFollowup(
        EPISODE,
        {
          outcome: OUTCOME.happened,
          actualImpact: 4,
          whatHelped: '  прогулянка ',
        },
        EPISODE.followupAt + 1,
      ),
    ).toEqual({
      episodeId: 'e1',
      completedAt: EPISODE.followupAt + 1,
      outcome: OUTCOME.happened,
      actualImpact: 4,
      whatHelped: 'прогулянка',
      wasLate: false,
    });
  });

  it('stores an empty note as no note', () => {
    const stored = buildFollowup(
      EPISODE,
      { outcome: OUTCOME.didNotHappen, actualImpact: null, whatHelped: '   ' },
      EPISODE.followupAt,
    );
    expect(stored.whatHelped).toBeNull();
  });

  it('drops an impact left on the slider before choosing "did not happen"', () => {
    const stored = buildFollowup(
      EPISODE,
      { outcome: OUTCOME.didNotHappen, actualImpact: 7, whatHelped: '' },
      EPISODE.followupAt,
    );
    expect(stored.actualImpact).toBeNull();
  });

  it('marks an answer after the 48 hour deadline as late', () => {
    const input: FollowupInput = {
      outcome: OUTCOME.didNotHappen,
      actualImpact: null,
      whatHelped: '',
    };
    expect(
      buildFollowup(EPISODE, input, EPISODE.followupAt + FOLLOWUP_DEADLINE_MS)
        .wasLate,
    ).toBe(false);
    expect(
      buildFollowup(
        EPISODE,
        input,
        EPISODE.followupAt + FOLLOWUP_DEADLINE_MS + 1,
      ).wasLate,
    ).toBe(true);
  });

  it('refuses an incomplete answer', () => {
    expect(() =>
      buildFollowup(
        EPISODE,
        { outcome: null, actualImpact: null, whatHelped: '' },
        0,
      ),
    ).toThrow(/incomplete/);
    expect(() =>
      buildFollowup(
        EPISODE,
        { outcome: OUTCOME.happened, actualImpact: null, whatHelped: '' },
        0,
      ),
    ).toThrow(/incomplete/);
  });
});

describe('selectReflection', () => {
  it('counts this case among the predictions that did not come true', () => {
    const current = followup('e3', OUTCOME.didNotHappen);
    const history = [
      followup('e1', OUTCOME.didNotHappen),
      followup('e2', OUTCOME.happened, 3),
      current,
    ];
    expect(selectReflection(7, current, history)).toEqual({
      kind: 'didNotHappen',
      ordinal: 2,
      total: 3,
    });
  });

  it('counts this case even when the history was read before saving it', () => {
    const current = followup('e3', OUTCOME.didNotHappen);
    expect(
      selectReflection(7, current, [followup('e1', OUTCOME.happened, 2)]),
    ).toEqual({ kind: 'didNotHappen', ordinal: 1, total: 2 });
  });

  it('says it was lighter than it felt when the impact was lower', () => {
    expect(
      selectReflection(8, followup('e1', OUTCOME.happened, 3), []),
    ).toEqual({
      kind: 'lighterThanFeared',
      partly: false,
      impact: 3,
      intensity: 8,
    });
  });

  it('does not reframe it when it was as hard as it felt', () => {
    expect(
      selectReflection(5, followup('e1', OUTCOME.happened, 5), []),
    ).toEqual({ kind: 'asHardAsFeared', partly: false });
    expect(
      selectReflection(5, followup('e1', OUTCOME.happened, 9), []),
    ).toEqual({ kind: 'asHardAsFeared', partly: false });
  });

  it('keeps "partly" visible rather than folding it into "happened"', () => {
    expect(selectReflection(6, followup('e1', OUTCOME.partly, 2), [])).toEqual({
      kind: 'lighterThanFeared',
      partly: true,
      impact: 2,
      intensity: 6,
    });
    expect(selectReflection(2, followup('e1', OUTCOME.partly, 6), [])).toEqual({
      kind: 'asHardAsFeared',
      partly: true,
    });
  });

  it('treats a missing impact as no evidence that it was lighter', () => {
    expect(
      selectReflection(5, followup('e1', OUTCOME.happened, null), []),
    ).toEqual({ kind: 'asHardAsFeared', partly: false });
  });
});
