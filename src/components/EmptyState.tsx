import { StyleSheet, View } from 'react-native';

import { space } from '@/theme';
import { Text } from './Text';

type Props = { title: string; body: string };

/** Quiet placeholder for screens whose real content lands in a later step. */
export function EmptyState({ title, body }: Props) {
  return (
    <View style={styles.root}>
      <Text variant="h2" style={styles.center}>
        {title}
      </Text>
      <Text variant="body" style={[styles.center, styles.body]}>
        {body}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.xl },
  center: { textAlign: 'center' },
  body: { marginTop: space.sm },
});
