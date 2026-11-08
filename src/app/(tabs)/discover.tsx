import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState, type ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { ProfileCard } from '@/components/ProfileCard';
import { mockDeck } from '@/data/mock';
import { colors, gradients, radius, space } from '@/theme';

type Decision = 'pass' | 'gift' | 'save';

/**
 * Discover deck. One profile at a time, scrolled top to bottom like Hinge,
 * with Pass / Send a gift / Save in a strip below it. Only verified givers
 * see this deck, and only verified receivers appear in it.
 * Step 4 turns "Send a gift" into checkout (amount + TYB fee = total).
 */
export default function Discover() {
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const card = mockDeck[index];

  const decide = (_decision: Decision) => {
    setIndex((i) => i + 1);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={gradients.paper} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.root} edges={['top']}>
        {card ? (
          <>
            <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
              <ProfileCard card={card} />
            </ScrollView>
            <View style={styles.actions}>
              <RoundButton label="Pass" icon="close" onPress={() => decide('pass')} />
              <RoundButton label="Send a gift" icon="heart" size={84} accent onPress={() => decide('gift')} />
              <RoundButton label="Save for later" icon="star-outline" onPress={() => decide('save')} />
            </View>
          </>
        ) : (
          <EmptyState title="You're all caught up" body="New profiles appear as people complete verification. Check back soon." />
        )}
      </SafeAreaView>
    </View>
  );
}

function RoundButton({
  label,
  icon,
  accent,
  size = 66,
  onPress,
}: {
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  accent?: boolean;
  size?: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.round,
        { width: size, height: size },
        accent && styles.roundAccent,
        pressed && { transform: [{ scale: 0.95 }] },
      ]}
    >
      {accent ? <LinearGradient colors={gradients.rose} style={[StyleSheet.absoluteFill, styles.pill]} /> : null}
      <Ionicons name={icon} size={accent ? 38 : 28} color={accent ? colors.white : colors.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  scroll: { paddingHorizontal: space.lg, paddingBottom: space.xl },
  actions: {
    paddingVertical: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: space.xl,
  },
  round: {
    borderRadius: radius.pill,
    backgroundColor: colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: '#7B4B48',
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    overflow: 'hidden',
  },
  roundAccent: { borderColor: colors.rose },
  pill: { borderRadius: radius.pill },
});
