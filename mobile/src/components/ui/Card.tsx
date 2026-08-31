import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors } from '../../theme/colors';
import { layout, shadows } from '../../theme/spacing';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'ai' | 'success' | 'warning';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  style,
}) => {
  return (
    <View
      style={[
        styles.base,
        styles[`padding_${padding}`],
        styles[`variant_${variant}`],
        variant !== 'outlined' && shadows.card,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderRadius: layout.borderRadius.md,
  },

  // Padding
  padding_none: { padding: 0 },
  padding_sm: { padding: 12 },
  padding_md: { padding: 16 },
  padding_lg: { padding: 20 },

  // Variants
  variant_default: {},
  variant_elevated: {
    ...shadows.cardElevated,
  },
  variant_outlined: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  variant_ai: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderLeftWidth: 3,
  },
  variant_success: {
    backgroundColor: colors.successLight,
  },
  variant_warning: {
    backgroundColor: colors.warningLight,
  },
});
