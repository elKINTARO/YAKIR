import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  edgeToEdgeBottom?: boolean;
  className?: string;
}

export function Screen({
  children,
  scroll = false,
  edgeToEdgeBottom = false,
  className,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const padding = {
    paddingTop: insets.top,
    paddingBottom: edgeToEdgeBottom ? 0 : insets.bottom,
  };

  if (scroll) {
    return (
      <ScrollView
        className="flex-1 bg-surface"
        contentContainerStyle={padding}
        contentContainerClassName={className ?? ''}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View className={`flex-1 bg-surface ${className ?? ''}`} style={padding}>
      {children}
    </View>
  );
}
