import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

export type TextVariant =
  'title' | 'question' | 'body' | 'muted' | 'caption' | 'number';

const VARIANTS: Record<TextVariant, string> = {
  title: 'text-3xl text-ink',
  question: 'text-2xl text-ink',
  body: 'text-base text-ink',
  muted: 'text-base text-muted',
  caption: 'text-sm text-muted',
  number: 'text-4xl text-ink',
};

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  className?: string;
}

export function Text({
  variant = 'body',
  className,
  style,
  ...rest
}: TextProps) {
  return (
    <RNText
      className={`${VARIANTS[variant]}${className ? ` ${className}` : ''}`}
      style={
        variant === 'number'
          ? [{ fontVariant: ['tabular-nums'] }, style]
          : style
      }
      {...rest}
    />
  );
}
