import React from 'react';
import { View, Text, StyleSheet, Image, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Button } from '../ui/Button';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'cube-outline',
  title,
  message,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  style,
}) => (
  <View style={[styles.container, style]}>
    <View style={styles.iconContainer}>
      <Ionicons name={icon} size={64} color={colors.textTertiary} />
    </View>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.message}>{message}</Text>
    {actionLabel && onAction && (
      <Button
        title={actionLabel}
        onPress={onAction}
        icon="camera-outline"
        style={styles.button}
      />
    )}
    {secondaryActionLabel && onSecondaryAction && (
      <Button
        title={secondaryActionLabel}
        onPress={onSecondaryAction}
        variant="ghost"
        icon="mic-outline"
        style={styles.secondaryButton}
      />
    )}
  </View>
);

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  onContinueLater?: () => void;
  style?: ViewStyle;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'Your product is safely saved. Please try again.',
  onRetry,
  onContinueLater,
  style,
}) => (
  <View style={[styles.container, style]}>
    <View style={styles.errorIconContainer}>
      <Ionicons name="alert-circle-outline" size={64} color={colors.warning} />
    </View>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.message}>{message}</Text>
    {onRetry && (
      <Button
        title="Try Again"
        onPress={onRetry}
        icon="refresh-outline"
        style={styles.button}
      />
    )}
    {onContinueLater && (
      <Button
        title="Continue Later"
        onPress={onContinueLater}
        variant="outline"
        style={styles.secondaryButton}
      />
    )}
  </View>
);

interface LoadingStateProps {
  title?: string;
  message?: string;
  style?: ViewStyle;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  title = 'Loading...',
  message,
  style,
}) => (
  <View style={[styles.container, style]}>
    <View style={styles.loadingIconContainer}>
      <Ionicons name="sparkles" size={48} color={colors.primary} />
    </View>
    <Text style={styles.title}>{title}</Text>
    {message && <Text style={styles.message}>{message}</Text>}
  </View>
);

interface OfflineBannerProps {
  visible: boolean;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ visible }) => {
  if (!visible) return null;
  return (
    <View style={offlineStyles.container}>
      <Ionicons name="cloud-offline-outline" size={18} color={colors.textPrimary} />
      <View style={offlineStyles.textContainer}>
        <Text style={offlineStyles.title}>You're offline</Text>
        <Text style={offlineStyles.message}>Don't worry, your work is saved</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  iconContainer: {
    marginBottom: 24,
    opacity: 0.6,
  },
  errorIconContainer: {
    marginBottom: 24,
  },
  loadingIconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  button: {
    marginTop: 8,
    maxWidth: 280,
  },
  secondaryButton: {
    marginTop: 12,
    maxWidth: 280,
  },
});

const offlineStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  textContainer: {
    marginLeft: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  message: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
