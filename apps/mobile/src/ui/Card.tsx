import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

export interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  className?: string;
}

export function Card({
  children,
  onPress,
  accessibilityLabel,
  className,
}: CardProps) {
  const shared = `rounded-2xl border border-line bg-raised p-5 ${className ?? ''}`;

  if (!onPress) {
    return <View className={shared}>{children}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      className={shared}
    >
      {children}
    </Pressable>
  );
}
