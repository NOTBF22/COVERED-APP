import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, type PressableProps, type ViewStyle } from 'react-native';

import { colors, radius, space } from '@/theme';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'ghost';

type Props = Omit<PressableProps, 'style'> & {
  label: string;
  variant?: Variant;
  icon?: ComponentProps<typeof Ionicons>['name'];
  style?: ViewStyle;
};

export function Button({ label, variant = 'primary', icon, style, disabled, ...rest }: Props) {
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
      {icon ? <Ionicons name={icon} size={20} color={v.text} /> : null}
      <Text variant="button" color={v.text}>
        {label}
      </Text>
    </Pressable>
  );
}

const variants: Record<Variant, { container: ViewStyle; text: string }> = {
  primary: { container: { backgroundColor: colors.accent }, text: colors.white },
  secondary: {
    container: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.line },
    text: colors.ink,
  },
  ghost: { container: { backgroundColor: 'transparent' }, text: colors.inkSoft },
};

const styles = StyleSheet.create({
  base: {
    minHeight: 56,
    paddingHorizontal: space.xl,
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: space.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.4 },
});
