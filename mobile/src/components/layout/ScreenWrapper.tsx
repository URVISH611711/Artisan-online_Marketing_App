import React from 'react';
import {
  View,
  StatusBar,
  StyleSheet,
  ScrollView,
  ViewStyle,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { rp } from '../../theme/responsive';

interface ScreenWrapperProps {
  children: React.ReactNode;
  scrollable?: boolean;
  padded?: boolean;
  safeArea?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  backgroundColor?: string;
  keyboardAvoiding?: boolean;
  /** Extra bottom padding added to scroll content (useful when FAB is on screen) */
  extraBottomPadding?: number;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  scrollable = true,
  padded = true,
  safeArea = true,
  refreshing = false,
  onRefresh,
  style,
  contentStyle,
  backgroundColor = colors.background,
  keyboardAvoiding = false,
  extraBottomPadding = 0,
}) => {
  const insets = useSafeAreaInsets();
  const hPad = rp();

  const innerContent = scrollable ? (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        padded && { paddingHorizontal: hPad },
        // Ensure content always clears the bottom safe area + nav
        { paddingBottom: insets.bottom + extraBottomPadding + 16 },
        contentStyle,
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, padded && { paddingHorizontal: hPad }, contentStyle]}>
      {children}
    </View>
  );

  const wrappedContent = keyboardAvoiding ? (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {innerContent}
    </KeyboardAvoidingView>
  ) : innerContent;

  if (safeArea) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor }, style]}
        edges={['top', 'left', 'right']}
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor={backgroundColor}
          translucent={false}
        />
        {wrappedContent}
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={backgroundColor}
        translucent={false}
      />
      {wrappedContent}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
