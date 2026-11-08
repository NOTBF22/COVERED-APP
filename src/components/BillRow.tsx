import { StyleSheet, View } from 'react-native';

import { categoryLabel, formatCents, formatDue } from '@/lib/format';
import { colors, radius, space } from '@/theme';
import type { Bill } from '@/types/domain';
import { Text } from './Text';

/** One bill with a coverage progress bar. */
export function BillRow({ bill }: { bill: Bill }) {
  const pct = Math.min(1, bill.coveredCents / bill.amountCents);
  const remaining = bill.amountCents - bill.coveredCents;

  return (
    <View style={styles.root}>
      <View style={styles.top}>
        <View style={styles.flex}>
          <Text variant="label" uppercase>
            {categoryLabel[bill.category]} · due {formatDue(bill.dueDate)}
          </Text>
          <Text variant="body" color={colors.ink} numberOfLines={1}>
            {bill.billerName}
          </Text>
        </View>
        <Text variant="h2">{formatCents(bill.amountCents)}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct * 100}%` }]} />
      </View>
      <Text variant="caption">
        {remaining > 0 ? `${formatCents(remaining)} to go` : 'Fully covered'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.sm, paddingVertical: space.md },
  top: { flexDirection: 'row', alignItems: 'flex-end', gap: space.md },
  flex: { flex: 1, gap: 2 },
  track: { height: 6, borderRadius: radius.pill, backgroundColor: colors.line, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.accent, borderRadius: radius.pill },
});
