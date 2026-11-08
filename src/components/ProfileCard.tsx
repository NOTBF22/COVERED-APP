import { Ionicons } from '@expo/vector-icons';
import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius, space } from '@/theme';
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
      <View style={styles.nameRow}>
        <Text variant="h1">{profile.displayName}</Text>
        {profile.verified ? (
          <Ionicons name="checkmark-circle" size={20} color={colors.accent} accessibilityLabel="Verified" />
        ) : null}
      </View>
      <Text variant="caption" style={styles.meta}>
        {profile.age} · {profile.city}
      </Text>

      {lead ? <Photo photo={lead} /> : null}

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
  root: { gap: space.lg },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.lg },
  meta: { marginTop: -space.md },
  panel: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  answer: { marginTop: space.sm },
});
