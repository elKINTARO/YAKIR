import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { countEpisodes } from '@/db/repositories/episodes';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState('Відкриваю базу…');

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const total = await countEpisodes();
        if (!cancelled) {
          setStatus(`База зашифрована. Записів: ${total}.`);
        }
      } catch (error) {
        if (!cancelled) {
          setStatus(error instanceof Error ? error.message : String(error));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <View
      className="flex-1 items-center justify-center bg-surface px-6"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <Text className="text-2xl text-ink">Yakir</Text>
      <Text className="mt-4 text-center text-base text-muted">{status}</Text>
    </View>
  );
}
