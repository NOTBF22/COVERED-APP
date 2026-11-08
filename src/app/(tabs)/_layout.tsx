import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

import { useAuth } from '@/providers/AuthProvider';
import { colors, fonts } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

const icon =
  (name: IconName) =>
  ({ color, size }: { color: ColorValue; size: number }) => <Ionicons name={name} color={typeof color === 'string' ? color : undefined} size={size} />;

export default function TabsLayout() {
  const { session } = useAuth();
  if (!session) return <Redirect href="/welcome" />;

  const isSupporter = session.role === 'supporter';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.line },
        tabBarLabelStyle: { fontFamily: fonts.bodyMedium, fontSize: 11 },
        sceneStyle: { backgroundColor: colors.paper },
      }}
    >
      {/* Supporters swipe; recipients manage their own bills. */}
      <Tabs.Screen
        name="discover"
        options={{ title: 'Discover', tabBarIcon: icon('albums-outline'), href: isSupporter ? undefined : null }}
      />
      <Tabs.Screen
        name="bills"
        options={{ title: 'My bills', tabBarIcon: icon('receipt-outline'), href: isSupporter ? null : undefined }}
      />
      <Tabs.Screen name="activity" options={{ title: 'Activity', tabBarIcon: icon('heart-outline') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('person-outline') }} />
    </Tabs>
  );
}
