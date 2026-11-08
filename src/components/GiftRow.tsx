import { StyleSheet, View } from 'react-native';

import { formatMoney, paymentStatusLabel, payoutStatusLabel } from '@/lib/format';
import { colors, space } from '@/theme';
import type { PaymentStatus, PayoutStatus } from '@/types/domain';
import { StatusPill, type Tone } from './StatusPill';
import { Text } from './Text';

const paymentTone: Record<PaymentStatus, Tone> = {
  awaiting_payment: 'neutral',
  processing: 'neutral',
  paid: 'good',
  failed: 'bad',
  refunded: 'warn',
  disputed: 'bad',
};

const payoutTone: Record<PayoutStatus, Tone> = {
  pending: 'neutral',
  on_hold: 'warn',
  in_transit: 'accent',
  paid_out: 'good',
  failed: 'bad',
  cancelled: 'warn',
};

type Props = {
  title: string;
  subtitle: string;
  amountCents: number;
  currency: string;
  isTest: boolean;
  paymentStatus: PaymentStatus;
  payoutStatus?: PayoutStatus;
};

/**
 * One gift in a history list. Payment and payout are always shown as two
 * separate statuses so "paid" is never mistaken for "paid out".
 */
export function GiftRow({ title, subtitle, amountCents, currency, isTest, paymentStatus, payoutStatus }: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.top}>
        <View style={styles.flex}>
          <Text variant="body" color={colors.ink}>
            {title}
          </Text>
          <Text variant="caption">{subtitle}</Text>
        </View>
        <Text variant="h2">{formatMoney(amountCents, currency)}</Text>
      </View>
      <View style={styles.pills}>
        <StatusPill label={paymentStatusLabel[paymentStatus]} tone={paymentTone[paymentStatus]} />
        {payoutStatus ? <StatusPill label={payoutStatusLabel[payoutStatus]} tone={payoutTone[payoutStatus]} /> : null}
        {isTest ? <StatusPill label="Test — not real money" tone="warn" /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingVertical: space.md, gap: space.sm },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  flex: { flex: 1, gap: 2 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
});
