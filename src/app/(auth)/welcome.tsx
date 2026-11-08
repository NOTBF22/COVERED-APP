import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useAuth } from '@/providers/AuthProvider';
import { colors, space } from '@/theme';

/**
 * Welcome + role choice. Step 2 replaces the direct sign-in with real
 * sign-up (Apple / Google / email), 18+ check and onboarding.
 */
export default function Welcome() {
  const { signInAs } = useAuth();

  return (
    <Screen edges={['top', 'bottom']} contentStyle={styles.content}>
      <View style={styles.brand}>
        <Text variant="brand" style={styles.center}>
          Thank You, Baby
        </Text>
        <Text variant="tagline" uppercase style={[styles.center, styles.tagline]}>
          Kindness,{'\n'}paid forward
        </Text>
        <View style={styles.rule} />
        <Text variant="body" style={[styles.center, styles.lede]}>
          Meet real people with real bills, and cover one directly. Every payment goes straight to
          the biller — never cash in hand.
        </Text>
      </View>

      <View style={styles.actions}>
        <Button label="I want to cover bills" icon="heart" onPress={() => signInAs('supporter')} />
        <Button
          label="I have bills to share"
          icon="receipt-outline"
          variant="secondary"
          onPress={() => signInAs('recipient')}
        />
        <Text variant="caption" style={[styles.center, styles.legal]}>
          18+ only. Preview mode — sample profiles, no real payments.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { justifyContent: 'space-between', paddingTop: space.xxxl + space.xl },
  brand: { alignItems: 'center', gap: space.lg },
  center: { textAlign: 'center' },
  tagline: { marginTop: space.sm },
  rule: { width: 40, height: 1, backgroundColor: colors.roseDeep, opacity: 0.6, marginVertical: space.sm },
  lede: { maxWidth: 320 },
  actions: { gap: space.md },
  legal: { marginTop: space.md },
});
