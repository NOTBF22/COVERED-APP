import { Pressable, StyleSheet, type PressableProps, type ViewStyle } from 'react-native';

import { colors, radius, space } from '@/theme';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'ghost';

type Props = Omit<PressableProps, 'style'> & {
  label: string;
  variant?: Variant;
  style?: ViewStyle;
};

export function Button({ label, variant = 'primary', style, disabled, ...rest }: Props) {
  const v = variants[variant];
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      {...rest}
      style={({ pressed }) => [
        styles.base,
        v.container,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text variant="button" color={v.text}>
        {label}
      </Text>
    </Pressable>
  );
}

const variants: Record<Variant, { container: ViewStyle; text: string }> = {
  primary: { container: { backgroundColor: colors.accent }, text: colors.white },
  secondary: {
    container: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
    text: colors.ink,
  },
  ghost: { container: { backgroundColor: 'transparent' }, text: colors.inkSoft },
};

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    paddingHorizontal: space.xl,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.4 },
});
