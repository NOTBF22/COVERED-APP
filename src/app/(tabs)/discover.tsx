import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { ProfileCard } from '@/components/ProfileCard';
import { mockDeck } from '@/data/mock';
import { colors, radius, space } from '@/theme';
import type { SwipeDirection } from '@/types/domain';

/**
 * Discover deck. One profile at a time, scrolled top to bottom like Hinge,
 * with Pass / Cover actions floating at the bottom.
 * Step 2 loads the deck from Supabase and records swipes; step 4 turns
 * "Cover" into the payment sheet.
 */
export default function Discover() {
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const card = mockDeck[index];

  const decide = (_direction: SwipeDirection) => {
    setIndex((i) => i + 1);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  if (!card) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <EmptyState title="You're all caught up" body="New profiles appear as bills are verified. Check back soon." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ProfileCard card={card} />
      </ScrollView>

      <View style={styles.actions} pointerEvents="box-none">
        <RoundButton label="Pass" icon="close" onPress={() => decide('pass')} />
        <RoundButton label="Cover a bill" icon="heart" accent onPress={() => decide('like')} />
      </View>
    </SafeAreaView>
  );
}

function RoundButton({
  label,
  icon,
  accent,
  onPress,
}: {
  label: string;
  icon: 'close' | 'heart';
  accent?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.round, accent && styles.roundAccent, pressed && { opacity: 0.85 }]}
    >
      <Ionicons name={icon} size={28} color={accent ? colors.white : colors.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  scroll: { paddingHorizontal: space.xl, paddingBottom: 120 },
  actions: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: space.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: space.xxl,
  },
  round: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  roundAccent: { backgroundColor: colors.accent, borderColor: colors.accent },
});
