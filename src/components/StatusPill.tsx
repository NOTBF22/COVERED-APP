import { StyleSheet, View } from 'react-native';

import { colors, radius, space } from '@/theme';
import { Text } from './Text';

export type Tone = 'neutral' | 'good' | 'accent' | 'warn' | 'bad';

const tones: Record<Tone, { bg: string; fg: string }> = {
  neutral: { bg: colors.line, fg: colors.inkSoft },
  good: { bg: '#E3ECDF', fg: colors.success },
  accent: { bg: colors.accentSoft, fg: colors.accent },
  warn: { bg: '#F4E6CF', fg: colors.warning },
  bad: { bg: '#F2D9D6', fg: colors.danger },
};

/** Small rounded status label, e.g. "Paid" or "Payout pending". */
export function StatusPill({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  const t = tones[tone];
  return (
    <View style={[styles.root, { backgroundColor: t.bg }]}>
      <Text variant="caption" color={t.fg} style={styles.text}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: 3 },
  text: { fontSize: 12 },
});
