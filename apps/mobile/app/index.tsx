import { SafeAreaView, Text, View } from 'react-native';

/**
 * Placeholder home screen. The real one lands in feature/home-and-navigation
 * once the database, domain layer and capture flow exist.
 */
export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-2xl text-ink">Yakir</Text>
      </View>
    </SafeAreaView>
  );
}
