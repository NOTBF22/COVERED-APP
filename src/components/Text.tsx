import { Text as RNText, type TextProps } from 'react-native';

import { type, type TypeVariant } from '@/theme';

type Props = TextProps & {
  variant?: TypeVariant;
  color?: string;
  uppercase?: boolean;
};

/** Themed text. Pick a `variant` instead of styling fonts ad hoc. */
export function Text({ variant = 'body', color, uppercase, style, ...rest }: Props) {
  return (
    <RNText
      {...rest}
      style={[
        type[variant],
        color ? { color } : null,
        uppercase ? { textTransform: 'uppercase' } : null,
        style,
      ]}
    />
  );
}
