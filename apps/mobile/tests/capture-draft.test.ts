import { describe, expect, it } from 'vitest';

import { createDraftStore, type SavedEpisode } from '@/capture/draft-store';
import { formatClock, formatDayMonth } from '@/i18n/format';

const SAVED: SavedEpisode = {
  episodeId: 'episode-1',
  createdAt: 1,
  tzOffset: 180,
  followupAt: 2,
  remindersOff: false,
};

function filledStore() {
  const store = createDraftStore();
  const state = store.getState();
  state.setIntensity(6);
  state.setFear('мене звільнять');
  state.toggleTag('work');
  state.setProbability(80);
  return store;
}

describe('the capture draft', () => {
  it('starts with nothing answered, so no value is suggested', () => {
    const { intensity, fear, tags, probability, saved } =
      createDraftStore().getState();
    expect({ intensity, fear, tags, probability, saved }).toEqual({
      intensity: null,
      fear: '',
      tags: [],
      probability: null,
      saved: null,
    });
  });

  it('toggles a tag on and off', () => {
    const store = createDraftStore();
    store.getState().toggleTag('money');
    store.getState().toggleTag('work');
    expect(store.getState().tags).toEqual(['money', 'work']);
    store.getState().toggleTag('money');
    expect(store.getState().tags).toEqual(['work']);
  });

  it('forgets everything on reset', () => {
    const store = filledStore();
    store.getState().reset();
    const { intensity, fear, tags, probability } = store.getState();
    expect({ intensity, fear, tags, probability }).toEqual({
      intensity: null,
      fear: '',
      tags: [],
      probability: null,
    });
  });

  it('erases the prediction from memory once it is stored', () => {
    const store = filledStore();
    store.getState().complete(SAVED);
    expect(store.getState().fear).toBe('');
    expect(store.getState().intensity).toBeNull();
    expect(store.getState().saved).toEqual(SAVED);
  });

  it('forgets the confirmation too when the flow is left', () => {
    const store = filledStore();
    store.getState().complete(SAVED);
    store.getState().reset();
    expect(store.getState().saved).toBeNull();
  });
});

describe('formatClock', () => {
  const MINUTE = 60_000;

  it('formats in the local time of the given offset', () => {
    expect(formatClock(7 * 60 * MINUTE, 180)).toBe('10:00');
  });

  it('pads hours and minutes', () => {
    expect(formatClock(5 * MINUTE, 0)).toBe('00:05');
  });
});

describe('formatDayMonth', () => {
  // 2026-10-30 21:30 UTC is already 31 October in Kyiv.
  const lateEvening = Date.UTC(2026, 9, 30, 21, 30);

  it('uses the local date of the offset, not the UTC one', () => {
    expect(formatDayMonth(lateEvening, 0, 'uk')).toBe('30 жовтня');
    expect(formatDayMonth(lateEvening, 180, 'uk')).toBe('31 жовтня');
  });

  it('puts the month first in english', () => {
    expect(formatDayMonth(lateEvening, 0, 'en')).toBe('October 30');
  });
});
