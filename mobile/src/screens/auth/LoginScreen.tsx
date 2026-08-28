import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Ionicons } from '@expo/vector-icons';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'> };

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const handleContinue = () => {
    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setError('');
    navigation.navigate('OTP', { phone: `+91${phone}` });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoCard}>
          <View style={styles.logoInner}>
            <Ionicons name="leaf" size={22} color={colors.primary} />
            <Text style={styles.logoText}>Artisan-AI</Text>
          </View>
        </View>

        <Text style={styles.title}>Welcome to Artisan-AI</Text>
        <Text style={styles.subtitle}>Enter your mobile number to get started</Text>

        <Input
          label="Mobile Number"
          prefix="+91"
          placeholder="9876543210"
          keyboardType="numeric"
          maxLength={10}
          value={phone}
          onChangeText={(t) => { setPhone(t.replace(/\D/g, '')); setError(''); }}
          error={error}
          containerStyle={styles.input}
        />

        <Button
          title="Continue"
          onPress={handleContinue}
          icon="arrow-forward"
          iconPosition="right"
          style={styles.button}
        />

        {/* Terms */}
        <Text style={styles.terms}>
          By continuing, you agree to our{' '}
          <Text style={styles.link}>Terms of Service</Text>
          {' '}and{' '}
          <Text style={styles.link}>Privacy Policy</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1, paddingHorizontal: layout.screenPadding,
    paddingTop: 60, alignItems: 'center',
  },
  logoCard: {
    width: 100, height: 80, borderRadius: 20,
    backgroundColor: '#EBF5FF',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 36,
  },
  logoInner: { flexDirection: 'row', alignItems: 'center' },
  logoText: {
    fontSize: 12, fontWeight: '800', color: colors.primary,
    marginLeft: 5, letterSpacing: 0.8,
  },
  title: {
    fontSize: 26, fontWeight: '800', color: colors.textPrimary,
    textAlign: 'center', marginBottom: 10,
  },
  subtitle: {
    fontSize: 15, color: colors.textSecondary,
    textAlign: 'center', marginBottom: 36, lineHeight: 22,
  },
  input: { width: '100%', marginBottom: 8 },
  button: { width: '100%', marginTop: 8 },
  terms: {
    fontSize: 13, color: colors.textSecondary,
    textAlign: 'center', marginTop: 24, lineHeight: 20, paddingHorizontal: 8,
  },
  link: { color: colors.primary, fontWeight: '600' },
});
