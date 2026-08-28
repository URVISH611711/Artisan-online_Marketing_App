import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  dot?: boolean;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  dot = true,
  size = 'sm',
  style,
}) => {
  const dotColor = {
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    info: colors.primary,
    default: colors.textSecondary,
  }[variant];

  const bgColor = {
    success: colors.successLight,
    warning: colors.warningLight,
    error: colors.errorLight,
    info: '#EBF5FF',
    default: '#F3F4F6',
  }[variant];

  const textColor = {
    success: colors.success,
    warning: '#92400E',
    error: colors.error,
    info: colors.primary,
    default: colors.textSecondary,
  }[variant];

  return (
    <View
      style={[
        styles.container,
        size === 'sm' ? styles.sm : styles.md,
        { backgroundColor: bgColor },
        style,
      ]}
    >
      {dot && <View style={[styles.dot, { backgroundColor: dotColor }]} />}
      <Text
        style={[
          styles.label,
          size === 'sm' ? styles.labelSm : styles.labelMd,
          { color: textColor },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

// Small count badge (for notification bell, tab badges)
interface CountBadgeProps {
  count: number;
  style?: ViewStyle;
}

export const CountBadge: React.FC<CountBadgeProps> = ({ count, style }) => {
  if (count <= 0) return null;
  return (
    <View style={[countStyles.container, style]}>
      <Text style={countStyles.text}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  sm: { paddingHorizontal: 8, paddingVertical: 4 },
  md: { paddingHorizontal: 12, paddingVertical: 6 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  label: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  labelSm: { fontSize: 10 },
  labelMd: { fontSize: 12 },
});

const countStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.badgeRed,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
