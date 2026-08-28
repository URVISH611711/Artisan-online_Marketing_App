import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { layout, shadows } from '../../theme/spacing';

interface FloatingMicButtonProps {
  onPress: () => void;
}

export const FloatingMicButton: React.FC<FloatingMicButtonProps> = ({
  onPress,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        accessibilityLabel="Voice assistant"
        accessibilityRole="button"
        style={[styles.button, shadows.fab]}
      >
        <View style={styles.gradient}>
          <Ionicons name="mic" size={24} color={colors.textOnPrimary} />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 16,
    bottom: layout.bottomNavHeight + 16,
    zIndex: 100,
  },
  button: {
    width: layout.fabSize,
    height: layout.fabSize,
    borderRadius: layout.fabSize / 2,
    overflow: 'hidden',
  },
  gradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: layout.fabSize / 2,
  },
});
