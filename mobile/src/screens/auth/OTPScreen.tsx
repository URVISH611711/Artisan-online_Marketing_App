import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { AuthStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'OTP'>;
  route: RouteProp<AuthStackParamList, 'OTP'>;
};

const OTP_LENGTH = 4;
const RESEND_SECONDS = 30;

export const OTPScreen: React.FC<Props> = ({ navigation, route }) => {
  const { phone } = route.params;
  const [otp, setOtp] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(RESEND_SECONDS);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<TextInput[]>([]);
  const { setUser, setToken } = useAuthStore();

  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text.slice(-1);
    setOtp(newOtp);
    if (text && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
    if (!text && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) return;

    setLoading(true);
    // Mock: any 4-digit OTP works in dev mode
    await new Promise((r) => setTimeout(r, 1200));

    setToken('mock_jwt_token_' + Date.now());
    setUser({
      id: 'artisan_001', phone, name: 'Ramesh Patel',
      role: 'artisan', language: 'en', voiceLanguage: 'hi',
      createdAt: new Date().toISOString(),
    });
    setLoading(false);
    navigation.replace('Registration');
  };

  const codeEntered = otp.join('').length === OTP_LENGTH;

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Verify your number</Text>
        <Text style={styles.subtitle}>
          We sent a 4-digit code to{' '}
          <Text style={styles.phone}>{phone}</Text>
        </Text>

        {/* OTP boxes */}
        <View style={styles.otpRow}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(r) => { if (r) inputRefs.current[index] = r; }}
              style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
              value={digit}
              onChangeText={(t) => handleOtpChange(t, index)}
              keyboardType="numeric"
              maxLength={1}
              textAlign="center"
              selectTextOnFocus
              accessibilityLabel={`OTP digit ${index + 1}`}
            />
          ))}
        </View>

        {/* Timer */}
        <Text style={styles.timerText}>
          {timer > 0 ? (
            <>Resend code in <Text style={styles.timerValue}>0:{String(timer).padStart(2, '0')}</Text></>
          ) : (
            <>Didn't receive code? <Text style={styles.resend} onPress={() => setTimer(RESEND_SECONDS)}>Resend</Text></>
          )}
        </Text>

        <Button
          title="Verify"
          onPress={handleVerify}
          disabled={!codeEntered}
          loading={loading}
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  back: { padding: 16, paddingBottom: 0 },
  content: { flex: 1, paddingHorizontal: layout.screenPadding, paddingTop: 32, alignItems: 'center' },
  title: { fontSize: 26, fontWeight: '800', color: colors.textPrimary, marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 40 },
  phone: { fontWeight: '700', color: colors.textPrimary },
  otpRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  otpBox: {
    width: 64, height: 64,
    borderRadius: 12, borderWidth: 1.5, borderColor: colors.border,
    fontSize: 28, fontWeight: '700', color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  otpBoxFilled: { borderColor: colors.primary, backgroundColor: '#F0F6FF' },
  timerText: { fontSize: 14, color: colors.textSecondary, marginBottom: 36, textAlign: 'center' },
  timerValue: { color: colors.primary, fontWeight: '600' },
  resend: { color: colors.primary, fontWeight: '600' },
  button: { width: '100%' },
});
