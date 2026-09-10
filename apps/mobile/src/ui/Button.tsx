import * as Haptics from 'expo-haptics';
import { Pressable, type PressableProps } from 'react-native';

import { Text } from './Text';

export type ButtonTone = 'primary' | 'secondary' | 'quiet';

const TONES: Record<ButtonTone, { container: string; label: string }> = {
  primary: { container: 'bg-accent', label: 'text-raised' },
  secondary: { container: 'bg-raised border border-line', label: 'text-ink' },
  quiet: { container: 'bg-transparent', label: 'text-muted' },
};

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  tone?: ButtonTone;
  large?: boolean;
  className?: string;
}

export function Button({
  label,
  tone = 'primary',
  large = false,
  className,
  onPress,
  disabled,
  ...rest
}: ButtonProps) {
  const styles = TONES[tone];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={(event) => {
        void Haptics.selectionAsync();
        onPress?.(event);
      }}
      className={[
        'items-center justify-center rounded-2xl px-6',
        large ? 'min-h-[72px]' : 'min-h-[52px]',
        styles.container,
        disabled ? 'opacity-40' : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      <Text variant={large ? 'question' : 'body'} className={styles.label}>
        {label}
      </Text>
    </Pressable>
  );
}
