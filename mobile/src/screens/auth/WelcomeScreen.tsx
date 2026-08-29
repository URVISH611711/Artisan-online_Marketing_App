import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';
import { rs, rf, rp, screenHeight } from '../../theme/responsive';
import { Button } from '../../components/ui/Button';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'Welcome'> };

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoText}>Artisan-AI</Text>
        </View>
        <Text style={styles.subtitle}>Empowering artisans with AI-driven digital commerce.</Text>
      </View>

      <View style={styles.content}>
        <Image
          source={require('../../../assets/splash-icon.png')}
          style={styles.illustration}
          resizeMode="contain"
        />
      </View>

      <View style={styles.footer}>
        <Button
          title="Create Account"
          onPress={() => navigation.navigate('SignUp')}
          variant="primary"
          style={styles.button}
        />
        <Button
          title="Log In"
          onPress={() => navigation.navigate('Login')}
          variant="outline"
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: rp(),
    paddingTop: rs(40),
    alignItems: 'center',
  },
  logoPlaceholder: {
    width: rs(80),
    height: rs(80),
    borderRadius: rs(20),
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(24),
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: rs(8) },
    shadowOpacity: 0.3,
    shadowRadius: rs(12),
    elevation: 8,
  },
  logoText: {
    color: colors.textOnPrimary,
    fontSize: rf(14),
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: rf(16),
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: rf(24),
    paddingHorizontal: rp(),
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustration: {
    width: '80%',
    height: screenHeight() * 0.3,
    opacity: 0.8,
  },
  footer: {
    paddingHorizontal: rp(),
    paddingBottom: rs(32),
    gap: rs(16),
  },
  button: {
    width: '100%',
  },
});
