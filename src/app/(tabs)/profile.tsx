import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { space } from '@/theme';

/** Account screen. Step 2 adds profile editing, photos and verification status. */
export default function Profile() {
  const { session, signOut } = useAuth();

  return (
    <Screen scroll>
      <Text variant="h1" style={styles.title}>
        Profile
      </Text>
      <View style={styles.rows}>
        <Text variant="label" uppercase>
          Signed in as
        </Text>
        <Text variant="body">{session?.role === 'supporter' ? 'Supporter' : 'Recipient'}</Text>
        <Text variant="label" uppercase style={styles.gap}>
          Backend
        </Text>
        <Text variant="body">{isSupabaseConfigured ? 'Connected to Supabase' : 'Preview mode (sample data)'}</Text>
      </View>
      <Button label="Sign out" variant="secondary" onPress={signOut} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: space.lg, marginBottom: space.xl },
  rows: { gap: space.xs, marginBottom: space.xxl },
  gap: { marginTop: space.lg },
});
