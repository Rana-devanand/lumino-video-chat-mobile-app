import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthHeader } from '@/components/auth/auth-header';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '@/services/authService';
import { authSession } from '@/lib/auth-session';

// ── Country data with flag emoji, dial code, max digits, and phone mask ──────
const COUNTRIES = [
  { code: 'IN', name: 'India',          dialCode: '+91', flag: '🇮🇳', maxDigits: 10, mask: '##### #####' },
  { code: 'US', name: 'United States',  dialCode: '+1',  flag: '🇺🇸', maxDigits: 10, mask: '(###) ###-####' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧', maxDigits: 10, mask: '#### ######' },
  { code: 'AE', name: 'UAE',            dialCode: '+971',flag: '🇦🇪', maxDigits: 9,  mask: '## ### ####' },
  { code: 'SG', name: 'Singapore',      dialCode: '+65', flag: '🇸🇬', maxDigits: 8,  mask: '#### ####' },
  { code: 'AU', name: 'Australia',      dialCode: '+61', flag: '🇦🇺', maxDigits: 9,  mask: '### ### ###' },
  { code: 'CA', name: 'Canada',         dialCode: '+1',  flag: '🇨🇦', maxDigits: 10, mask: '(###) ###-####' },
  { code: 'DE', name: 'Germany',        dialCode: '+49', flag: '🇩🇪', maxDigits: 11, mask: '#### #######' },
  { code: 'FR', name: 'France',         dialCode: '+33', flag: '🇫🇷', maxDigits: 9,  mask: '# ## ## ## ##' },
  { code: 'JP', name: 'Japan',          dialCode: '+81', flag: '🇯🇵', maxDigits: 10, mask: '##-####-####' },
  { code: 'PK', name: 'Pakistan',       dialCode: '+92', flag: '🇵🇰', maxDigits: 10, mask: '### #######' },
  { code: 'BD', name: 'Bangladesh',     dialCode: '+880',flag: '🇧🇩', maxDigits: 10, mask: '####-######' },
  { code: 'NP', name: 'Nepal',          dialCode: '+977',flag: '🇳🇵', maxDigits: 10, mask: '###-#######' },
  { code: 'LK', name: 'Sri Lanka',      dialCode: '+94', flag: '🇱🇰', maxDigits: 9,  mask: '## ### ####' },
  { code: 'SA', name: 'Saudi Arabia',   dialCode: '+966',flag: '🇸🇦', maxDigits: 9,  mask: '## ### ####' },
  { code: 'MY', name: 'Malaysia',       dialCode: '+60', flag: '🇲🇾', maxDigits: 10, mask: '##-### ####' },
  { code: 'ID', name: 'Indonesia',      dialCode: '+62', flag: '🇮🇩', maxDigits: 12, mask: '####-####-####' },
  { code: 'PH', name: 'Philippines',    dialCode: '+63', flag: '🇵🇭', maxDigits: 10, mask: '#### ### ####' },
  { code: 'NG', name: 'Nigeria',        dialCode: '+234',flag: '🇳🇬', maxDigits: 10, mask: '### ### ####' },
  { code: 'ZA', name: 'South Africa',   dialCode: '+27', flag: '🇿🇦', maxDigits: 9,  mask: '## ### ####' },
];

// ── Apply mask to raw digit string ───────────────────────────────────────────
function applyMask(digits: string, mask: string): string {
  let result = '';
  let di = 0;
  for (let i = 0; i < mask.length && di < digits.length; i++) {
    if (mask[i] === '#') {
      result += digits[di++];
    } else {
      result += mask[i];
    }
  }
  return result;
}

// ── Strip non-digit chars ─────────────────────────────────────────────────────
function stripMask(masked: string): string {
  return masked.replace(/\D/g, '');
}

export default function LoginScreen() {
  const router = useRouter();
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]); // India default
  const [rawDigits, setRawDigits] = useState('');
  const [displayValue, setDisplayValue] = useState('');
  const [pickerVisible, setPickerVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // ── Handle Deep Linking (Invitations) ──────────────────────────────────────
  const url = Linking.useURL();
  useEffect(() => {
    if (url) {
      const { queryParams } = Linking.parse(url);
      if (queryParams?.referrer) {
        const rid = String(queryParams.referrer);
        AsyncStorage.setItem('referrerId', rid);
        console.log(`[Deep Link] Referrer detected and saved: ${rid}`);
      }
    }
  }, [url]);
  const inputRef = useRef<TextInput>(null);

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.dialCode.includes(search)
  );

  const handleTextChange = (text: string) => {
    const digits = stripMask(text).slice(0, selectedCountry.maxDigits);
    setRawDigits(digits);
    setDisplayValue(applyMask(digits, selectedCountry.mask));
  };

  const handleCountrySelect = (country: typeof COUNTRIES[0]) => {
    setSelectedCountry(country);
    setRawDigits('');
    setDisplayValue('');
    setPickerVisible(false);
    setSearch('');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const isValid = rawDigits.length === selectedCountry.maxDigits;

  const handleContinue = async () => {
    if (!isValid || loading) return;

    setLoading(true);
    try {
      const fullPhone = `${selectedCountry.dialCode}${rawDigits}`;
      const confirmation = await authService.signInWithPhone(fullPhone);
      authSession.setConfirmation(confirmation);
      
      router.push({
        pathname: '/(auth)/verify',
        params: { phone: fullPhone },
      });
    } catch (error: any) {
      alert(error?.message || 'Failed to send OTP. Check your network.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#F8F9FB', '#FFFFFF']} style={StyleSheet.absoluteFill} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <AuthHeader type="login" />

        <View style={styles.textContainer}>
          <Text style={styles.title}>Enter your mobile number</Text>
          <Text style={styles.subtitle}>
            We'll send a secure verification code to your device to keep your account safe.
          </Text>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>PHONE NUMBER</Text>

          <View style={styles.phoneRow}>
            {/* ── Country Picker Trigger ── */}
            <TouchableOpacity
              style={styles.countryButton}
              onPress={() => setPickerVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.flagEmoji}>{selectedCountry.flag}</Text>
              <Text style={styles.dialCode}>{selectedCountry.dialCode}</Text>
              <Ionicons name="chevron-down" size={14} color="#888" style={{ marginLeft: 2 }} />
            </TouchableOpacity>

            {/* ── Masked Phone Input ── */}
            <TextInput
              ref={inputRef}
              style={styles.phoneInput}
              value={displayValue}
              onChangeText={handleTextChange}
              placeholder={selectedCountry.mask.replace(/#/g, '0')}
              placeholderTextColor="#AAAAAA"
              keyboardType="phone-pad"
              autoFocus
              maxLength={selectedCountry.mask.length}
            />
          </View>

          {/* Digit counter hint */}
          {rawDigits.length > 0 && (
            <Text style={styles.digitHint}>
              {rawDigits.length}/{selectedCountry.maxDigits} digits
            </Text>
          )}
        </View>

        {/* ── Privacy Guarantee ── */}
        <View style={styles.privacyBox}>
          <View style={styles.shieldIcon}>
            <Ionicons name="shield-checkmark" size={24} color="#4440EB" />
          </View>
          <View style={styles.privacyTextContainer}>
            <Text style={styles.privacyTitle}>Privacy Guarantee</Text>
            <Text style={styles.privacyDescription}>
              Your phone number is encrypted and will never be shared with others or used for
              marketing without consent.
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.continueButton, (!isValid || loading) && styles.buttonDisabled]}
            onPress={handleContinue}
            disabled={!isValid || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.continueText}>Continue</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFF" style={styles.arrowIcon} />
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.termsText}>
            By continuing, you agree to our{' '}
            <Text style={styles.linkText}>Terms of Service</Text> and{' '}
            <Text style={styles.linkText}>Privacy Policy</Text>.
          </Text>

          <Text style={styles.logoText}>Lumino</Text>
        </View>
      </ScrollView>

      {/* ── Country Picker Modal ── */}
      <Modal
        visible={pickerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setPickerVisible(false)} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Select Country</Text>

          <TextInput
            style={styles.searchInput}
            placeholder="Search country or code..."
            placeholderTextColor="#AAAAAA"
            value={search}
            onChangeText={setSearch}
            autoFocus
          />

          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item.code}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.countryRow,
                  item.code === selectedCountry.code && styles.countryRowSelected,
                ]}
                onPress={() => handleCountrySelect(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.flagEmojiLarge}>{item.flag}</Text>
                <Text style={styles.countryName}>{item.name}</Text>
                <Text style={styles.countryDial}>{item.dialCode}</Text>
                {item.code === selectedCountry.code && (
                  <Ionicons name="checkmark" size={18} color="#4440EB" />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 30, paddingBottom: 40 },

  textContainer: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 28, fontWeight: '800', color: '#1A1A1A', textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 15, color: '#666', textAlign: 'center', lineHeight: 22, opacity: 0.8 },

  inputSection: { marginBottom: 30 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#666', letterSpacing: 1, marginBottom: 12 },

  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8E9F0',
    borderRadius: 16,
    overflow: 'hidden',
    height: 60,
  },

  // ── Country button: flag + dial code + chevron ──
  countryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: '100%',
    borderRightWidth: 1,
    borderRightColor: '#CED0D9',
    gap: 6,
  },
  flagEmoji: { fontSize: 22, lineHeight: 28 },
  dialCode: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },

  phoneInput: {
    flex: 1,
    paddingHorizontal: 14,
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    height: '100%',
  },

  digitHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
    marginLeft: 2,
  },

  privacyBox: {
    flexDirection: 'row',
    backgroundColor: '#F7F8FA',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 40,
  },
  shieldIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#FFF',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  privacyTextContainer: { flex: 1, marginLeft: 15 },
  privacyTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
  privacyDescription: { fontSize: 13, color: '#666', lineHeight: 18, opacity: 0.7 },

  footer: { alignItems: 'center', marginTop: 'auto' },
  continueButton: {
    width: '100%',
    height: 64,
    backgroundColor: '#4440EB',
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4440EB',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 24,
  },
  buttonDisabled: { opacity: 0.5 },
  continueText: { color: '#FFF', fontSize: 18, fontWeight: '700', marginRight: 8 },
  arrowIcon: { marginTop: 2 },
  termsText: { fontSize: 12, color: '#999', textAlign: 'center', marginBottom: 30, lineHeight: 18 },
  linkText: { color: '#4440EB', fontWeight: '600' },
  logoText: { fontSize: 24, fontWeight: '700', color: '#CCC', letterSpacing: 1 },

  // ── Modal ──
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '75%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#DDD',
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginBottom: 16 },
  searchInput: {
    backgroundColor: '#F2F3F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A1A1A',
    marginBottom: 12,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 12,
  },
  countryRowSelected: { backgroundColor: '#EEF0FF' },
  flagEmojiLarge: { fontSize: 26 },
  countryName: { flex: 1, fontSize: 15, color: '#1A1A1A', fontWeight: '500' },
  countryDial: { fontSize: 14, color: '#888', fontWeight: '600' },
});