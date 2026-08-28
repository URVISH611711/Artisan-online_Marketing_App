import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';
import { CountBadge } from '../ui/Badge';

interface HeaderProps {
  title?: string;
  onBack?: () => void;
  onNotifications?: () => void;
  notificationCount?: number;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
  rightText?: string;
  greeting?: string;
  greetingName?: string;
  avatar?: string;
  style?: ViewStyle;
  transparent?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onBack,
  onNotifications,
  notificationCount = 0,
  rightIcon,
  onRightPress,
  rightText,
  greeting,
  greetingName,
  style,
  transparent = false,
}) => {
  // Greeting variant (Home screen)
  if (greeting) {
    return (
      <View style={[styles.container, transparent && styles.transparent, style]}>
        <View style={styles.greetingRow}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={20} color={colors.textSecondary} />
            </View>
          </View>
          <Text style={styles.greetingText}>
            {greeting}, <Text style={styles.greetingName}>{greetingName}</Text>
          </Text>
        </View>
        {onNotifications && (
          <TouchableOpacity
            onPress={onNotifications}
            style={styles.iconButton}
            accessibilityLabel={`Notifications, ${notificationCount} unread`}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
            {notificationCount > 0 && (
              <CountBadge count={notificationCount} style={styles.notifBadge} />
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Standard header
  return (
    <View style={[styles.container, transparent && styles.transparent, style]}>
      <View style={styles.leftSection}>
        {onBack && (
          <TouchableOpacity
            onPress={onBack}
            style={styles.iconButton}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
        {title && (
          <Text style={[styles.title, !onBack && styles.titleNoBack]}>{title}</Text>
        )}
      </View>
      <View style={styles.rightSection}>
        {rightText && (
          <TouchableOpacity onPress={onRightPress}>
            <Text style={styles.rightText}>{rightText}</Text>
          </TouchableOpacity>
        )}
        {rightIcon && (
          <TouchableOpacity onPress={onRightPress} style={styles.iconButton}>
            <Ionicons name={rightIcon} size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
        {onNotifications && (
          <TouchableOpacity
            onPress={onNotifications}
            style={styles.iconButton}
            accessibilityLabel={`Notifications, ${notificationCount} unread`}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
            {notificationCount > 0 && (
              <CountBadge count={notificationCount} style={styles.notifBadge} />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: layout.headerHeight,
    paddingHorizontal: layout.screenPadding,
    backgroundColor: colors.background,
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    position: 'relative',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginLeft: 8,
  },
  titleNoBack: {
    marginLeft: 0,
  },
  rightText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: 20,
    color: colors.textPrimary,
    fontWeight: '400',
  },
  greetingName: {
    fontWeight: '700',
  },
  notifBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
});
