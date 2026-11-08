import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors, gradients, space } from '@/theme';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  contentStyle?: ViewStyle;
};

/** Page wrapper: soft blush wash, safe-area aware, optional scroll. */
export function Screen({ children, scroll, edges = ['top'], contentStyle }: Props) {
  return (
    <View style={styles.root}>
      <LinearGradient colors={gradients.paper} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.fill} edges={edges}>
        {scroll ? (
          <ScrollView
            contentContainerStyle={[styles.content, contentStyle]}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.content, styles.fill, contentStyle]}>{children}</View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  content: { paddingHorizontal: space.xl, paddingBottom: space.xxl },
  fill: { flex: 1 },
});
