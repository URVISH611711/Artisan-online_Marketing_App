import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { useAuthStore } from '../../store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'Splash'> };

export const SplashScreen: React.FC<Props> = ({ navigation }) => {
  const { isAuthenticated, isOnboarded } = useAuthStore();
  const opacity = React.useRef(new Animated.Value(0)).current;
  const scale = React.useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      if (isAuthenticated) {
        navigation.replace('Login'); // will be overridden by RootNavigator
      } else if (isOnboarded) {
        navigation.replace('Login');
      } else {
        navigation.replace('Language');
      }
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Grid dot pattern background */}
      <View style={styles.dotGrid}>
        {Array.from({ length: 120 }).map((_, i) => (
          <View key={i} style={styles.dot} />
        ))}
      </View>

      <Animated.View style={[styles.content, { opacity, transform: [{ scale }] }]}>
        {/* Logo card */}
        <View style={styles.logoCard}>
          <View style={styles.logoInner}>
            <Ionicons name="leaf" size={28} color={colors.primary} />
            <Text style={styles.logoText}>Artisan-AI</Text>
          </View>
        </View>

        <Text style={styles.appName}>Artisan-AI</Text>
        <Text style={styles.tagline}>Your Craft. Your Market. Powered by AI.</Text>
      </Animated.View>

      {/* Loading bar */}
      <View style={styles.loadingBarContainer}>
        <Animated.View style={[styles.loadingBar, { width: '50%' }]} />
      </View>

      <Text style={styles.footer}>EMPOWERING ARTISANS ACROSS INDIA</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotGrid: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    opacity: 0.5,
  },
  dot: {
    width: 4, height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    margin: 10,
  },
  content: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoCard: {
    width: 120, height: 120,
    borderRadius: 28,
    backgroundColor: '#EBF5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  logoInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
    marginLeft: 6,
    letterSpacing: 1,
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 10,
  },
  tagline: {
    fontSize: 15,
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
  loadingBarContainer: {
    width: 160,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    position: 'absolute',
    bottom: 100,
    overflow: 'hidden',
  },
  loadingBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 48,
    fontSize: 11,
    color: colors.textTertiary,
    letterSpacing: 2,
    fontWeight: '500',
  },
});
