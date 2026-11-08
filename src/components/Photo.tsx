import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { colors, radius } from '@/theme';
import type { Photo as PhotoT } from '@/types/domain';

/** Portrait photo tile (4:5). Falls back to a warm colour block in mock mode. */
export function Photo({ photo }: { photo: PhotoT }) {
  return (
    <View style={[styles.root, { backgroundColor: photo.tone ?? colors.line }]}>
      {photo.uri ? (
        <Image source={{ uri: photo.uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { width: '100%', aspectRatio: 4 / 5, borderRadius: radius.lg, overflow: 'hidden' },
});
