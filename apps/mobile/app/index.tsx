import { router } from 'expo-router';
import { View } from 'react-native';

import { t } from '@/i18n';
import { Button, Screen } from '@/ui';

export default function HomeScreen() {
  return (
    <Screen className="px-6">
      {/* Empty on purpose: no quotes, no "how are you today". Pending
          follow-up cards will live here. */}
      <View className="flex-[2]" />
      <View className="flex-1 justify-center">
        <Button
          large
          label={t('home.capture')}
          onPress={() => {
            router.push('/capture/intensity');
          }}
        />
      </View>
    </Screen>
  );
}
