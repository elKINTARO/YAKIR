import { createStore } from 'zustand/vanilla';

import type { CaptureInput } from '@/domain/capture';
import type { EpisodeId, TagId } from '@/domain/types';

/**
 * The capture draft lives in memory only and is never persisted. Leaving the
 * flow halfway loses it on purpose: an intensity without a prediction is
 * symptom monitoring with nothing to test, which is what the app avoids.
 */
export type Draft = CaptureInput;

export interface SavedEpisode {
  episodeId: EpisodeId;
  createdAt: number;
  tzOffset: number;
  followupAt: number;
  /** Reminders are off and the one-time hint about it is due. */
  remindersOff: boolean;
}

export interface DraftState extends Draft {
  /** Set once the episode is stored, for the confirmation screen. */
  saved: SavedEpisode | null;
  setIntensity: (intensity: number) => void;
  setFear: (fear: string) => void;
  toggleTag: (tag: TagId) => void;
  setProbability: (probability: number) => void;
  /** Clears the draft and remembers what was stored. */
  complete: (saved: SavedEpisode) => void;
  reset: () => void;
}

const EMPTY: Draft & Pick<DraftState, 'saved'> = {
  intensity: null,
  fear: '',
  tags: [],
  probability: null,
  saved: null,
};

export function createDraftStore() {
  return createStore<DraftState>()((set) => ({
    ...EMPTY,
    setIntensity: (intensity) => {
      set({ intensity });
    },
    setFear: (fear) => {
      set({ fear });
    },
    toggleTag: (tag) => {
      set((state) => ({
        tags: state.tags.includes(tag)
          ? state.tags.filter((existing) => existing !== tag)
          : [...state.tags, tag],
      }));
    },
    setProbability: (probability) => {
      set({ probability });
    },
    complete: (saved) => {
      set({ ...EMPTY, saved });
    },
    reset: () => {
      set(EMPTY);
    },
  }));
}

export const draftStore = createDraftStore();
