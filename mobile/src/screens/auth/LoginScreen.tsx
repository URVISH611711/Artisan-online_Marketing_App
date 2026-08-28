import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Ionicons } from '@expo/vector-icons';
import { rs, rf, rp } from '../../theme/responsive';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'> };

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const hPad = rp();

  const handleContinue = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const response = await fetch(require('../../config/api').endpoints.auth.login, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase() }),
      });

      const data = await response.json();
      setLoading(false);

      if (!response.ok) {
        setError(data.detail || 'Failed to send OTP');
        return;
      }

      navigation.navigate('OTP', { email: email.toLowerCase() });
    } catch (err) {
      setLoading(false);
      setError('Network error. Is the backend running?');
      console.error(err);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingHorizontal: hPad }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoCard}>
            <View style={styles.logoInner}>
              <Ionicons name="leaf" size={rs(20)} color={colors.primary} />
              <Text style={styles.logoText}>Artisan-AI</Text>
            </View>
          </View>

          <Text style={styles.title}>Welcome to Artisan-AI</Text>
          <Text style={styles.subtitle}>Enter your email address to get started</Text>

          <Input
            label="Email Address"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(t) => { setEmail(t); setError(''); }}
            error={error}
            containerStyle={styles.input}
          />

          <Button
            title="Continue"
            onPress={handleContinue}
            icon="arrow-forward"
            iconPosition="right"
            style={styles.button}
            loading={loading}
          />

          {/* Terms */}
          <Text style={styles.terms}>
            By continuing, you agree to our{' '}
            <Text style={styles.link}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={styles.link}>Privacy Policy</Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingTop: rs(48),
    paddingBottom: rs(32),
    alignItems: 'center',
  },
  logoCard: {
    width: rs(90),
    height: rs(70),
    borderRadius: rs(18),
    backgroundColor: '#EBF5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(32),
  },
  logoInner: { flexDirection: 'row', alignItems: 'center', gap: rs(5) },
  logoText: {
    fontSize: rf(12),
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.8,
  },
  title: {
    fontSize: rf(24),
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: rs(8),
  },
  subtitle: {
    fontSize: rf(14),
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: rs(32),
    lineHeight: rf(21),
  },
  input: { width: '100%', marginBottom: rs(6) },
  button: { width: '100%', marginTop: rs(8) },
  terms: {
    fontSize: rf(12),
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: rs(22),
    lineHeight: rf(18),
    paddingHorizontal: rs(8),
  },
  link: { color: colors.primary, fontWeight: '600' },
});
