import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/spacing';
import { rs } from '../../theme/responsive';

interface FloatingMicButtonProps {
  onPress: () => void;
}

export const FloatingMicButton: React.FC<FloatingMicButtonProps> = ({ onPress }) => {
  const insets = useSafeAreaInsets();
  // Compute responsive values inside the component (lazy — safe for Hermes)
  const fabSize = rs(52);
  const tabBarBase = rs(56);
  const bottomOffset = tabBarBase + insets.bottom + rs(12);

  return (
    <View
      style={[
        styles.container,
        { bottom: bottomOffset, right: rs(16) },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        accessibilityLabel="Open voice assistant"
        accessibilityRole="button"
        style={[{
          width: fabSize,
          height: fabSize,
          borderRadius: fabSize / 2,
          overflow: 'hidden',
        }, shadows.fab]}
      >
        <View style={[
          styles.inner,
          { width: fabSize, height: fabSize, borderRadius: fabSize / 2 },
        ]}>
          <Ionicons name="mic" size={rs(22)} color={colors.textOnPrimary} />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 100,
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
});
