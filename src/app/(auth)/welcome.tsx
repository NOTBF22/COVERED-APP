import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useAuth } from '@/providers/AuthProvider';
import { colors, space } from '@/theme';

/**
 * Welcome + role choice. Real sign-up (Apple / Google / email), the 18+
 * check and full verification replace the direct preview sign-in later.
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
          Private gifting,{'\n'}beautifully simple
        </Text>
        <View style={styles.rule} />
        <Text variant="body" style={[styles.center, styles.lede]}>
          Browse verified profiles and send gifts or cover bills through TYB. Personal, bank and
          payment details always stay private.
        </Text>
      </View>

      <View style={styles.actions}>
        <Button label="I want to send gifts" icon="gift-outline" onPress={() => signInAs('giver')} />
        <Button
          label="I want to receive gifts"
          icon="sparkles-outline"
          variant="secondary"
          onPress={() => signInAs('receiver')}
        />
        <Text variant="caption" style={[styles.center, styles.legal]}>
          18+ only. Everyone completes verification.{'\n'}Preview mode — sample profiles, no real payments.
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
