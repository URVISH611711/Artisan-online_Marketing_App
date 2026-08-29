import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';
import { rs, rf, rp } from '../../theme/responsive';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { API_URL } from '../../config/api';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'SignUp'> };

export const SignUpScreen: React.FC<Props> = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    address: '',
  });

  const handleSignUp = async () => {
    // Basic validation
    if (!form.name || !form.email || !form.phone || !form.password || !form.address) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (form.password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Registration failed');
      }

      navigation.navigate('OTP', { email: form.email.toLowerCase().trim(), isSignUp: true });
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join Artisan-AI to start your digital journey.</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Full Name"
              placeholder="Enter your full name"
              value={form.name}
              onChangeText={(t) => setForm({ ...form, name: t })}
              icon="person-outline"
            />
            <Input
              label="Email Address"
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={form.email}
              onChangeText={(t) => setForm({ ...form, email: t })}
              icon="mail-outline"
            />
            <Input
              label="Mobile Number"
              placeholder="Enter your mobile number"
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={(t) => setForm({ ...form, phone: t })}
              icon="call-outline"
            />
            <Input
              label="Password"
              placeholder="Create a password (min 8 chars)"
              secureTextEntry
              value={form.password}
              onChangeText={(t) => setForm({ ...form, password: t })}
              icon="lock-closed-outline"
            />
            <Input
              label="Physical Address"
              placeholder="Enter your full address"
              multiline
              value={form.address}
              onChangeText={(t) => setForm({ ...form, address: t })}
              icon="location-outline"
            />
          </View>

          <View style={styles.footer}>
            <Button
              title="Create Account"
              onPress={handleSignUp}
              loading={loading}
              style={styles.button}
            />
            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <Text
                style={styles.loginLink}
                onPress={() => navigation.navigate('Login')}
              >
                Log In
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: rp(),
    paddingBottom: rs(100),
  },
  header: {
    marginTop: rs(24),
    marginBottom: rs(32),
  },
  title: {
    fontSize: rf(28),
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: rs(8),
  },
  subtitle: {
    fontSize: rf(16),
    color: colors.textSecondary,
    lineHeight: rf(24),
  },
  form: {
    gap: rs(16),
    marginBottom: rs(32),
  },
  footer: {
    marginTop: rs(16),
    alignItems: 'center',
    gap: rs(24),
  },
  button: {
    width: '100%',
  },
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginText: {
    fontSize: rf(15),
    color: colors.textSecondary,
  },
  loginLink: {
    fontSize: rf(15),
    color: colors.primary,
    fontWeight: '600',
  },
});
