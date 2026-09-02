import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { rp, rf, rs } from '../../theme/responsive';
import { CountBadge } from '../ui/Badge';

interface HeaderProps {
  title?: string;
  onBack?: () => void;
  onNotifications?: () => void;
  notificationCount?: number;
  onCartPress?: () => void;
  cartCount?: number;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
  rightText?: string;
  greeting?: string;
  greetingName?: string;
  onProfilePress?: () => void;
  style?: ViewStyle;
  transparent?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onBack,
  onNotifications,
  notificationCount = 0,
  onCartPress,
  cartCount = 0,
  rightIcon,
  onRightPress,
  rightText,
  greeting,
  greetingName,
  onProfilePress,
  style,
  transparent = false,
}) => {
  const hPad = rp();

  // Greeting variant (Home screen)
  if (greeting) {
    return (
      <View
        style={[
          styles.container,
          transparent && styles.transparent,
          { paddingHorizontal: hPad },
          style,
        ]}
      >
        {/* Left: avatar + greeting — flex: 1 so it takes remaining space */}
        <TouchableOpacity
          style={styles.greetingRow}
          onPress={onProfilePress}
          activeOpacity={onProfilePress ? 0.7 : 1}
          disabled={!onProfilePress}
          accessibilityLabel="Go to Profile"
        >
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={rs(18)} color={colors.textSecondary} />
          </View>
          {/* minWidth: 0 is the key fix for text overflow in flex children */}
          <View style={styles.greetingTextContainer}>
            <Text style={styles.greetingLabel} numberOfLines={1}>
              {greeting}
            </Text>
            <Text style={styles.greetingName} numberOfLines={1} ellipsizeMode="tail">
              {greetingName}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Right: notification icon */}
        {onCartPress && (<TouchableOpacity onPress={onCartPress} style={styles.iconButton} accessibilityLabel={`Cart, ${cartCount} items`} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><Ionicons name="cart-outline" size={rs(22)} color={colors.textPrimary} />{cartCount > 0 && (<CountBadge count={cartCount} style={styles.notifBadge} />)}</TouchableOpacity>)}{onNotifications && (
          <TouchableOpacity
            onPress={onNotifications}
            style={styles.iconButton}
            accessibilityLabel={`Notifications, ${notificationCount} unread`}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="notifications-outline"
              size={rs(22)}
              color={colors.textPrimary}
            />
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
    <View
      style={[
        styles.container,
        transparent && styles.transparent,
        { paddingHorizontal: hPad },
        style,
      ]}
    >
      <View style={styles.leftSection}>
        {onBack && (
          <TouchableOpacity
            onPress={onBack}
            style={[styles.iconButton, styles.backButton]}
            accessibilityLabel="Go back"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={rs(22)} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
        {title && (
          <Text
            style={[styles.title, !onBack && styles.titleNoBack]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
        )}
      </View>
      <View style={styles.rightSection}>
        {rightText && (
          <TouchableOpacity onPress={onRightPress}>
            <Text style={styles.rightText}>{rightText}</Text>
          </TouchableOpacity>
        )}
        {rightIcon && (
          <TouchableOpacity
            onPress={onRightPress}
            style={styles.iconButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name={rightIcon} size={rs(22)} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
        {onCartPress && (<TouchableOpacity onPress={onCartPress} style={styles.iconButton} accessibilityLabel={`Cart, ${cartCount} items`} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><Ionicons name="cart-outline" size={rs(22)} color={colors.textPrimary} />{cartCount > 0 && (<CountBadge count={cartCount} style={styles.notifBadge} />)}</TouchableOpacity>)}{onNotifications && (
          <TouchableOpacity
            onPress={onNotifications}
            style={styles.iconButton}
            accessibilityLabel={`Notifications, ${notificationCount} unread`}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="notifications-outline"
              size={rs(22)}
              color={colors.textPrimary}
            />
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
    // No fixed height — use padding for breathing room
    paddingVertical: rs(10),
    backgroundColor: colors.background,
  },
  transparent: {
    backgroundColor: 'transparent',
  },

  // Standard header
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  backButton: {
    marginRight: 4,
  },
  iconButton: {
    padding: 6,
    position: 'relative',
  },
  title: {
    fontSize: rf(18),
    fontWeight: '700',
    color: colors.textPrimary,
    marginLeft: 6,
    flex: 1,
    minWidth: 0,
  },
  titleNoBack: {
    marginLeft: 0,
  },
  rightText: {
    fontSize: rf(15),
    fontWeight: '600',
    color: colors.primary,
    marginRight: 4,
  },

  // Greeting variant
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  avatarPlaceholder: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  greetingTextContainer: {
    marginLeft: rs(10),
    flex: 1,
    minWidth: 0,
  },
  greetingLabel: {
    fontSize: rf(12),
    color: colors.textSecondary,
    fontWeight: '400',
  },
  greetingName: {
    fontSize: rf(17),
    fontWeight: '700',
    color: colors.textPrimary,
  },
  notifBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
});
