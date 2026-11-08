import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useAuth } from '@/providers/AuthProvider';
import { colors, space } from '@/theme';

/**
 * Welcome + role choice. Step 2 replaces the direct sign-in with real
 * sign-up (email/Apple), 18+ check and onboarding.
 */
export default function Welcome() {
  const { signInAs } = useAuth();

  return (
    <Screen edges={['top', 'bottom']} contentStyle={styles.content}>
      <View style={styles.brand}>
        <Text variant="label" uppercase>
          Thank You, Baby
        </Text>
        <Text variant="hero" style={styles.title}>
          Kindness,{'\n'}
          <Text variant="hero" color={colors.accent}>
            paid forward.
          </Text>
        </Text>
        <Text variant="body" style={styles.lede}>
          Meet real people with real bills, and cover one directly. Every payment goes straight to
          the biller — never cash in hand.
        </Text>
      </View>

      <View style={styles.actions}>
        <Button label="I want to cover bills" onPress={() => signInAs('supporter')} />
        <Button label="I have bills to share" variant="secondary" onPress={() => signInAs('recipient')} />
        <Text variant="caption" style={styles.legal}>
          18+ only. Preview mode — sample profiles, no real payments.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { justifyContent: 'space-between', paddingTop: space.xxxl },
  brand: { gap: space.lg },
  title: { marginTop: space.sm },
  lede: { maxWidth: 340 },
  actions: { gap: space.md },
  legal: { textAlign: 'center', marginTop: space.sm },
});
