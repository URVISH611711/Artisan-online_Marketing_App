import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { AuthStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';
import { rs, rf, rp } from '../../theme/responsive';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'OTP'>;
  route: RouteProp<AuthStackParamList, 'OTP'>;
};

const OTP_LENGTH = 4;
const RESEND_SECONDS = 30;

export const OTPScreen: React.FC<Props> = ({ navigation, route }) => {
  const { email } = route.params;
  const [otp, setOtp] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(RESEND_SECONDS);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<TextInput[]>([]);
  const { setUser, setToken } = useAuthStore();
  const hPad = rp();

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

    try {
      const response = await fetch(require('../../config/api').endpoints.auth.verifyOtp, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: code }),
      });

      let data;
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        data = { detail: 'An unexpected server error occurred.' };
      }
      
      setLoading(false);

      if (!response.ok) {
        Alert.alert('Error', data.detail || 'Invalid OTP');
        setOtp(['', '', '', '']);
        inputRefs.current[0]?.focus();
        return;
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
    } catch (err) {
      setLoading(false);
      Alert.alert('Error', 'Network error. Is the backend running?');
      console.error(err);
    }
  };

  const codeEntered = otp.join('').length === OTP_LENGTH;
  const boxSize = rs(60);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <TouchableOpacity
        style={[styles.back, { paddingHorizontal: rp() }]}
        onPress={() => navigation.goBack()}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="arrow-back" size={rs(22)} color={colors.textPrimary} />
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingHorizontal: hPad }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Verify your email</Text>
          <Text style={styles.subtitle}>
            We sent a 4-digit code to{' '}
            <Text style={styles.emailText}>{email}</Text>
          </Text>

          {/* OTP boxes */}
          <View style={[styles.otpRow, { gap: rs(10) }]}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(r) => { if (r) inputRefs.current[index] = r; }}
                style={[
                  styles.otpBox,
                  { width: boxSize, height: boxSize, borderRadius: rs(12), fontSize: rf(24) },
                  digit ? styles.otpBoxFilled : null,
                ]}
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  back: { paddingTop: rs(8), paddingBottom: rs(4) },
  content: {
    flexGrow: 1,
    paddingTop: rs(28),
    paddingBottom: rs(32),
    alignItems: 'center',
  },
  title: {
    fontSize: rf(24),
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: rs(8),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: rf(14),
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: rf(21),
    marginBottom: rs(36),
  },
  emailText: { fontWeight: '700', color: colors.textPrimary },
  otpRow: { flexDirection: 'row', marginBottom: rs(22) },
  otpBox: {
    borderWidth: 1.5,
    borderColor: colors.border,
    fontWeight: '700',
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  otpBoxFilled: { borderColor: colors.primary, backgroundColor: '#F0F6FF' },
  timerText: { fontSize: rf(13), color: colors.textSecondary, marginBottom: rs(32), textAlign: 'center' },
  timerValue: { color: colors.primary, fontWeight: '600' },
  resend: { color: colors.primary, fontWeight: '600' },
  button: { width: '100%' },
});
