import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, gradients, radius, space } from '@/theme';
import type { DiscoverCard, Prompt } from '@/types/domain';
import { BillRow } from './BillRow';
import { Photo } from './Photo';
import { Text } from './Text';

/**
 * Hinge-style scrolling profile: lead photo, name, then photos interleaved
 * with prompts and the bio, and the bills at the end.
 */
export function ProfileCard({ card }: { card: DiscoverCard }) {
  const { profile, bills } = card;
  const [lead, ...rest] = profile.photos;

  return (
    <View style={styles.root}>
      {lead ? (
        <Photo photo={lead}>
          <LinearGradient colors={gradients.photoScrim} style={styles.scrim} />
          <View style={styles.overlay}>
            <View style={styles.flex}>
              <View style={styles.nameRow}>
                <Text variant="name">
                  {profile.displayName}, {profile.age}
                </Text>
                {profile.verified ? (
                  <Ionicons name="checkmark-circle" size={22} color={colors.white} accessibilityLabel="Verified" />
                ) : null}
              </View>
              <View style={styles.metaRow}>
                <Ionicons name="location-sharp" size={15} color={colors.white} />
                <Text variant="body" color={colors.white}>
                  {profile.city}
                </Text>
              </View>
            </View>
            {bills.length > 0 ? (
              <View style={styles.billChip} accessibilityLabel={`${bills.length} bills to cover`}>
                <Ionicons name="receipt-outline" size={22} color={colors.white} />
                <Text variant="caption" color={colors.white}>
                  {bills.length}
                </Text>
              </View>
            ) : null}
          </View>
        </Photo>
      ) : null}

      <Panel>
        <Text variant="body" color={colors.ink}>
          {profile.bio}
        </Text>
      </Panel>

      {interleave(rest, profile.prompts).map((item, i) =>
        'question' in item ? (
          <PromptPanel key={`q${i}`} prompt={item} />
        ) : (
          <Fragment key={item.id}>
            <Photo photo={item} />
          </Fragment>
        ),
      )}

      {bills.length > 0 ? (
        <Panel>
          <Text variant="label" uppercase>
            Bills to cover
          </Text>
          {bills.map((b) => (
            <BillRow key={b.id} bill={b} />
          ))}
        </Panel>
      ) : null}
    </View>
  );
}

function interleave<A, B>(a: A[], b: B[]): (A | B)[] {
  const out: (A | B)[] = [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (b[i]) out.push(b[i]);
    if (a[i]) out.push(a[i]);
  }
  return out;
}

function Panel({ children }: { children: React.ReactNode }) {
  return <View style={styles.panel}>{children}</View>;
}

function PromptPanel({ prompt }: { prompt: Prompt }) {
  return (
    <Panel>
      <Text variant="label" uppercase>
        {prompt.question}
      </Text>
      <Text variant="quote" style={styles.answer}>
        {prompt.answer}
      </Text>
    </Panel>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.lg, paddingTop: space.md },
  scrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '45%' },
  overlay: {
    position: 'absolute',
    left: space.xl,
    right: space.lg,
    bottom: space.xl,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space.md,
  },
  flex: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginTop: space.xs },
  billChip: {
    width: 60,
    height: 60,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  panel: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  answer: { marginTop: space.sm },
});
