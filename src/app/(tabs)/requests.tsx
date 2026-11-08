import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { RequestRow } from '@/components/RequestRow';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { mockMyRequests } from '@/data/mock';
import { colors, radius, space } from '@/theme';

/** Receiver's gift, bill and expense requests. Creating them comes in step 3. */
export default function Requests() {
  return (
    <Screen scroll>
      <Text variant="h1" style={styles.title}>
        My requests
      </Text>
      <Text variant="body">
        Live requests appear on your profile. Each one is gifted in full. Bills are checked privately by TYB — the
        company, total and account number are never shown.
      </Text>

      <View style={styles.panel}>
        {mockMyRequests.map((r) => (
          <RequestRow key={r.id} request={r} showStatus />
        ))}
      </View>

      <Button label="Add a request" variant="secondary" icon="add" disabled />
      <Text variant="caption" style={styles.soon}>
        Adding requests arrives in the next step.
      </Text>
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
    marginVertical: space.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  soon: { textAlign: 'center', marginTop: space.sm },
});
