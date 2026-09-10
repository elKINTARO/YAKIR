import * as Haptics from 'expo-haptics';
import { Pressable } from 'react-native';

import { Text } from './Text';

export interface TagChipProps {
  label: string;
  selected: boolean;
  onToggle: () => void;
}

export function TagChip({ label, selected, onToggle }: TagChipProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      onPress={() => {
        void Haptics.selectionAsync();
        onToggle();
      }}
      className={`min-h-[44px] justify-center rounded-full border px-4 ${
        selected ? 'border-accent bg-accent' : 'border-line bg-raised'
      }`}
    >
      <Text variant="body" className={selected ? 'text-raised' : 'text-muted'}>
        {label}
      </Text>
    </Pressable>
  );
}
