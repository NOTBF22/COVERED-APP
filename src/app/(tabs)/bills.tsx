import { StyleSheet, View } from 'react-native';

import { BillRow } from '@/components/BillRow';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { mockMyBills } from '@/data/mock';
import { colors, radius, space } from '@/theme';

/** Recipient's bills. Step 3 adds "Add a bill" with document upload + review. */
export default function Bills() {
  return (
    <Screen scroll>
      <Text variant="h1" style={styles.title}>
        My bills
      </Text>
      <Text variant="body">Verified bills appear on your profile. We pay the biller directly.</Text>

      <View style={styles.panel}>
        {mockMyBills.map((b) => (
          <BillRow key={b.id} bill={b} />
        ))}
      </View>

      <Button label="Add a bill" variant="secondary" disabled />
      <Text variant="caption" style={styles.soon}>
        Adding bills arrives in a later step.
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
