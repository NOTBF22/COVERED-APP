import { StyleSheet, View } from 'react-native';

import { GiftRow } from '@/components/GiftRow';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { mockGiftsReceived, mockGiftsSent } from '@/data/mock';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, space } from '@/theme';

const when = (iso: string) => new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });

/**
 * Gift and payout history. Givers see what they sent and its status; receivers
 * see what they received and when it's paid out — neither sees the other's
 * payment, bank or legal details.
 */
export default function Gifts() {
  const { session } = useAuth();
  const giver = session?.role === 'giver';

  return (
    <Screen scroll>
      <Text variant="h1" style={styles.title}>
        {giver ? 'Gifts sent' : 'Gifts received'}
      </Text>
      <Text variant="body">
        {giver
          ? 'Your payment goes to TYB, and TYB pays her. "Paid" means your payment went through; "Paid out" means it has reached her.'
          : 'TYB pays your gifts into your verified payout account. You can keep every gift whether or not you reply to anyone.'}
      </Text>

      <View style={styles.panel}>
        {giver
          ? mockGiftsSent.map((g) => (
              <GiftRow
                key={g.id}
                title={`To ${g.receiverDisplayName}`}
                subtitle={`${when(g.createdAt)} · ${g.requestId ? 'Request' : 'Gift'}`}
                amountCents={g.totalCents}
                currency={g.currency}
                isTest={g.isTest}
                paymentStatus={g.paymentStatus}
                payoutStatus={g.payoutStatus}
              />
            ))
          : mockGiftsReceived.map((g) => (
              <GiftRow
                key={g.id}
                title={`From ${g.giverDisplayName}`}
                subtitle={`${when(g.paidAt)} · ${g.requestId ? 'Request' : 'Gift'}`}
                amountCents={g.giftAmountCents}
                currency={g.currency}
                isTest={g.isTest}
                paymentStatus={g.paymentStatus}
                payoutStatus={g.payoutStatus}
              />
            ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: space.lg, marginBottom: space.sm },
  panel: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingHorizontal: space.xl,
    paddingVertical: space.sm,
    marginTop: space.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
});
