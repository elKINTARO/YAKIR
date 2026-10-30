import { Stack } from 'expo-router';
import { useEffect } from 'react';

import { draftStore } from '@/capture/draft-store';

export default function CaptureLayout() {
  // The draft is erased on the way in and on the way out, whichever way the
  // person leaves: close button, back gesture, or the confirmation screen.
  useEffect(() => {
    const { reset } = draftStore.getState();
    reset();
    return reset;
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}
