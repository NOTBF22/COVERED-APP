import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { StatusPill } from '@/components/StatusPill';
import { Text } from '@/components/Text';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, space } from '@/theme';

/**
 * Account screen. Profile editing, privacy settings, block/report, support
 * and account deletion are built out in later steps.
 */
export default function Profile() {
  const { session, signOut } = useAuth();
  if (!session) return null;
  const giver = session.role === 'giver';

  return (
    <Screen scroll>
      <Text variant="h1" style={styles.title}>
        {session.displayName}
      </Text>
      <View style={styles.pills}>
        <StatusPill label={giver ? 'Sending gifts' : 'Receiving gifts'} tone="accent" />
        <StatusPill
          label={session.verification === 'verified' ? 'Verified' : 'Verification needed'}
          tone={session.verification === 'verified' ? 'good' : 'warn'}
        />
      </View>

      <View style={styles.panel}>
        <Text variant="label" uppercase>
          What others see
        </Text>
        <Text variant="body">
          {giver
            ? 'Only your display name, and only to women you’ve gifted. Your optional profile stays hidden unless you choose to reveal it in a chat.'
            : 'Your photos, display name, bio, city and the details you choose to show. Never your legal name, address, phone, bank or bill details.'}
        </Text>
        <Text variant="label" uppercase style={styles.gap}>
          What only TYB knows
        </Text>
        <Text variant="body">
          {giver
            ? 'Your legal name, date of birth, contact details and verification. Payment details stay with the payment provider.'
            : 'Your legal name, date of birth, contact details, verification, bill evidence and payout account (held by the payment provider).'}
        </Text>
      </View>

      <Text variant="caption" style={styles.backend}>
        {isSupabaseConfigured ? 'Connected to TYB servers' : 'Preview mode — sample data, no real payments'}
      </Text>
      <Button label="Sign out" variant="secondary" onPress={signOut} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: space.lg, marginBottom: space.sm },
  pills: { flexDirection: 'row', gap: space.sm, marginBottom: space.xl },
  panel: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.xl,
    gap: space.xs,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    marginBottom: space.xl,
  },
  gap: { marginTop: space.lg },
  backend: { textAlign: 'center', marginBottom: space.md },
});
