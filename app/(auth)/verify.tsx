import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthHeader } from '@/components/auth/auth-header';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '@/services/authService';
import { authSession } from '@/lib/auth-session';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

export default function VerifyScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [timer, setTimer] = useState(RESEND_SECONDS);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false); // New state to track DB sync
  const [focusedIndex, setFocusedIndex] = useState(0);

  console.log(`[Firebase Auth] verify.tsx: Loaded with phone: ${phone}`);

  const inputs = useRef<(TextInput | null)[]>(Array(OTP_LENGTH).fill(null));

  // ── Auto-Verification & Auth State ──────────────────────────────────────────
  useEffect(() => {
    const subscriber = authService.onAuthChange(async (user) => {
      if (user) {
        setSyncing(true);
        try {
          const rid = await AsyncStorage.getItem('referrerId');
          await authService.syncUserWithSupabase(user, rid);
          if (rid) await AsyncStorage.removeItem('referrerId');
          
          router.replace('/(tabs)');
        } catch (error) {
          console.error('[VerifyScreen] Sync failed during auto-auth:', error);
          router.replace('/(tabs)');
        } finally {
          setSyncing(false);
        }
      }
    });
    return subscriber; 
  }, []);

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (timer === 0) { setCanResend(true); return; }
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const handleResend = async () => {
    if (!canResend || loading) return;
    
    setLoading(true);
    try {
      // Re-trigger sign in
      const fullPhone = String(phone);
      const confirmation = await authService.signInWithPhone(fullPhone);
      authSession.setConfirmation(confirmation);
      
      setOtp(Array(OTP_LENGTH).fill(''));
      setTimer(RESEND_SECONDS);
      setCanResend(false);
      inputs.current[0]?.focus();
    } catch (error: any) {
      alert(error?.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  // ── OTP input logic ────────────────────────────────────────────────────────
  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
      const filled = [...Array(OTP_LENGTH).fill('').map((_, i) => digits[i] ?? '')];
      setOtp(filled);
      const nextEmpty = filled.findIndex((d) => !d);
      const focusAt = nextEmpty === -1 ? OTP_LENGTH - 1 : nextEmpty;
      inputs.current[focusAt]?.focus();
      return;
    }

    const digit = value.replace(/\D/g, '');
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    if (digit && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      } else if (index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputs.current[index - 1]?.focus();
      }
    }
  };

  const isComplete = otp.every((d) => d !== '');

  const handleVerify = async () => {
    if (!isComplete || loading) return;

    setLoading(true);
    try {
      const confirmation = authSession.getConfirmation();
      if (!confirmation) {
        throw new Error('Session expired. Please go back and try again.');
      }

      const otpString = otp.join('');
      await authService.confirmOTP(confirmation, otpString);
      
      // onAuthChange listener will handle the sync and navigation
    } catch (error: any) {
      console.error('Verify Error:', error);
      alert(error?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeNumber = () => {
    router.back();
  };

  // ── Masked phone display ───────────────────────────────────────────────────
  const maskedPhone = phone
    ? String(phone).replace(/(\+\d{2})(\d+)(\d{4})/, (_, c, mid, last) => `${c} ${'•'.repeat(mid.length)} ${last}`)
    : '';

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#F8F9FB', '#FFFFFF']} style={StyleSheet.absoluteFill} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <AuthHeader type="verify" />

          {/* ── Heading ── */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>Verify your number</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to{' '}
            </Text>

            {/* Phone + Change number row */}
            <View style={styles.phoneRow}>
              <Text style={styles.phoneHighlight}>{maskedPhone}</Text>
              <TouchableOpacity onPress={handleChangeNumber} style={styles.changeBadge}>
                <Ionicons name="pencil" size={12} color="#4440EB" />
                <Text style={styles.changeText}>Change</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── OTP Boxes ── */}
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => {
              const isFocused = focusedIndex === index;
              const isFilled = digit !== '';
              return (
                <View
                  key={index}
                  style={[
                    styles.otpBox,
                    isFocused && styles.otpBoxFocused,
                    isFilled && !isFocused && styles.otpBoxFilled,
                  ]}
                >
                  {/* Animated bottom line indicator */}
                  {isFocused && <View style={styles.cursor} />}

                  <TextInput
                    ref={(r) => { inputs.current[index] = r; }}
                    style={[styles.otpInput, isFilled && styles.otpInputFilled]}
                    keyboardType="number-pad"
                    maxLength={OTP_LENGTH}        // allow paste
                    value={digit}
                    onChangeText={(v) => handleOtpChange(v, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    onFocus={() => setFocusedIndex(index)}
                    onBlur={() => setFocusedIndex(-1)}
                    placeholder=""
                    caretHidden
                    selectTextOnFocus
                  />
                </View>
              );
            })}
          </View>

          {/* ── Verify Button ── */}
          <TouchableOpacity
            style={[styles.verifyButton, (!isComplete || loading) && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={!isComplete || loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.verifyText}>Verify & Continue</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFF" style={styles.arrowIcon} />
              </>
            )}
          </TouchableOpacity>

          {/* ── Resend Section ── */}
          <View style={styles.resendContainer}>
            <Text style={styles.didNotReceiveText}>Didn't receive the code?</Text>

            {canResend ? (
              <TouchableOpacity onPress={handleResend} style={styles.resendButton} activeOpacity={0.7}>
                <MaterialCommunityIcons name="refresh" size={16} color="#4440EB" />
                <Text style={styles.resendActiveText}>Resend OTP</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.timerBadge}>
                <MaterialCommunityIcons name="clock-outline" size={16} color="#4440EB" />
                <Text style={styles.timerText}>
                  Resend in 0:{timer < 10 ? `0${timer}` : timer}
                </Text>
              </View>
            )}
          </View>

          {/* ── Footer ── */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By verifying, you agree to our security protocols and privacy standards.
            </Text>
            <Text style={styles.logoText}>Lumino</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 28, paddingBottom: 36 },

  // ── Text ──
  textContainer: { alignItems: 'center', marginBottom: 36 },
  title: { fontSize: 26, fontWeight: '800', color: '#1A1A1A', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 15, color: '#888', textAlign: 'center', lineHeight: 22 },

  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 10,
  },
  phoneHighlight: { fontSize: 15, color: '#1A1A1A', fontWeight: '700' },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEEEFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  changeText: { fontSize: 12, color: '#4440EB', fontWeight: '700' },

  // ── OTP ──
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 36,
    gap: 8,
  },
  otpBox: {
    flex: 1,
    height: 64,
    backgroundColor: '#F2F3F8',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
    position: 'relative',
    overflow: 'hidden',
  },
  otpBoxFocused: {
    backgroundColor: '#FFFFFF',
    borderColor: '#4440EB',
    shadowColor: '#4440EB',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  otpBoxFilled: {
    backgroundColor: '#FFFFFF',
    borderColor: '#C8C9FF',
  },
  cursor: {
    position: 'absolute',
    bottom: 10,
    width: 20,
    height: 2,
    backgroundColor: '#4440EB',
    borderRadius: 2,
  },
  otpInput: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    width: '100%',
    height: '100%',
  },
  otpInputFilled: { color: '#4440EB' },

  // ── Verify Button ──
  verifyButton: {
    width: '100%',
    height: 62,
    backgroundColor: '#4440EB',
    borderRadius: 31,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4440EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 8,
    marginBottom: 28,
  },
  buttonDisabled: { opacity: 0.45 },
  verifyText: { color: '#FFF', fontSize: 17, fontWeight: '700', marginRight: 8 },
  arrowIcon: { marginTop: 1 },

  // ── Resend ──
  resendContainer: { alignItems: 'center', gap: 12 },
  didNotReceiveText: { fontSize: 14, color: '#888', fontWeight: '500' },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F1FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  timerText: { color: '#4440EB', fontSize: 13, fontWeight: '700' },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEEEFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  resendActiveText: { color: '#4440EB', fontSize: 14, fontWeight: '700' },

  // ── Footer ──
  footer: { marginTop: 'auto', alignItems: 'center', gap: 16 },
  footerText: { fontSize: 12, color: '#BBB', textAlign: 'center', lineHeight: 18 },
  logoText: { fontSize: 22, fontWeight: '700', color: '#CCC', letterSpacing: 1 },
});