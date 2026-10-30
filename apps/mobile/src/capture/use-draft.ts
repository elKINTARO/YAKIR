import { useStore } from 'zustand';

import { draftStore, type DraftState } from './draft-store';

export function useDraft<T>(selector: (state: DraftState) => T): T {
  return useStore(draftStore, selector);
}
