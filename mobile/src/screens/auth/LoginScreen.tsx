import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Ionicons } from '@expo/vector-icons';
import { rs, rf, rp } from '../../theme/responsive';
import { useAuthStore } from '../../store/useAuthStore';
import { API_URL } from '../../config/api';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'> };

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setToken, setUser } = useAuthStore();
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
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Account not found. Please sign up instead.');
        }
        if (response.status === 401) {
          throw new Error('Incorrect email or password.');
        }
        throw new Error(data.detail || 'Login failed');
      }

      setToken(data.access_token);
      setUser({
        id: data.user.id,
        email: data.user.email,
        phone: data.user.phone,
        name: data.user.name,
        address: data.user.address,
        role: data.user.role,
        language: data.user.preferred_language,
        voiceLanguage: data.user.voice_language,
        createdAt: data.user.created_at,
      });
    } catch (err: any) {
      Alert.alert('Login Error', err.message);
    } finally {
      setLoading(false);
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

          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Enter your email to log in to your account</Text>
          </View>

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
          <Input
            label="Password"
            placeholder="Enter your password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            containerStyle={styles.input}
          />

          <Button
            title="Log In"
            onPress={handleContinue}
            style={styles.button}
            loading={loading}
          />

          <View style={styles.signupRow}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <Text
              style={styles.signupLink}
              onPress={() => navigation.navigate('SignUp')}
            >
              Sign Up
            </Text>
          </View>

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
  header: { width: '100%', alignItems: 'center', marginBottom: rs(16) },
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
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: rs(24),
  },
  signupText: {
    fontSize: rf(15),
    color: colors.textSecondary,
  },
  signupLink: {
    fontSize: rf(15),
    color: colors.primary,
    fontWeight: '600',
  },
});
