import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { formatMoney, requestKindLabel, requestStatusLabel } from '@/lib/format';
import { colors, space } from '@/theme';
import type { GiftRequest } from '@/types/domain';
import { StatusPill } from './StatusPill';
import { Text } from './Text';

/**
 * One gift, bill or expense request. Givers see the kind, title, her note,
 * the amount and whether TYB verified it — never the company, bill total or
 * account. `showStatus` is for the receiver's own list.
 */
export function RequestRow({ request, showStatus }: { request: GiftRequest; showStatus?: boolean }) {
  return (
    <View style={styles.root}>
      <View style={styles.flex}>
        <View style={styles.labelRow}>
          <Text variant="label" uppercase>
            {requestKindLabel[request.kind]}
          </Text>
          {request.verifiedByTyb ? (
            <View style={styles.verified}>
              <Ionicons name="shield-checkmark" size={12} color={colors.success} />
              <Text variant="caption" color={colors.success}>
                Verified by TYB
              </Text>
            </View>
          ) : null}
        </View>
        <Text variant="body" color={colors.ink}>
          {request.title}
        </Text>
        {request.description ? <Text variant="caption">{request.description}</Text> : null}
        {showStatus ? (
          <View style={styles.status}>
            <StatusPill
              label={requestStatusLabel[request.status]}
              tone={request.status === 'live' ? 'good' : request.status === 'fulfilled' ? 'accent' : 'neutral'}
            />
          </View>
        ) : null}
      </View>
      <Text variant="h2">{formatMoney(request.amountCents, request.currency)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md, paddingVertical: space.md },
  flex: { flex: 1, gap: 2 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  verified: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  status: { flexDirection: 'row', marginTop: space.xs },
});
