import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

import { useAuth } from '@/providers/AuthProvider';
import { colors, fonts } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

/** Outline icon normally, filled when the tab is active. */
const icon =
  (outline: IconName, filled: IconName) =>
  ({ color, size, focused }: { color: ColorValue; size: number; focused: boolean }) => (
    <Ionicons name={focused ? filled : outline} color={typeof color === 'string' ? color : undefined} size={size} />
  );

export default function TabsLayout() {
  const { session } = useAuth();
  if (!session) return <Redirect href="/welcome" />;

  const isGiver = session.role === 'giver';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.line, height: 64, paddingTop: 6 },
        tabBarLabelStyle: { fontFamily: fonts.bodyMedium, fontSize: 12 },
        sceneStyle: { backgroundColor: colors.paper },
      }}
    >
      {/* Givers browse; receivers manage their requests. */}
      <Tabs.Screen
        name="discover"
        options={{ title: 'Discover', tabBarIcon: icon('albums-outline', 'albums'), href: isGiver ? undefined : null }}
      />
      <Tabs.Screen
        name="requests"
        options={{ title: 'Requests', tabBarIcon: icon('sparkles-outline', 'sparkles'), href: isGiver ? null : undefined }}
      />
      <Tabs.Screen name="gifts" options={{ title: 'Gifts', tabBarIcon: icon('gift-outline', 'gift') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('person-outline', 'person') }} />
    </Tabs>
  );
}
