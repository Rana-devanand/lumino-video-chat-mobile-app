import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authService } from '@/services/authService';
import { useGetProfileQuery, useUpdateProfileMutation } from '@/services/api';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProfileSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [userId, setUserId] = useState<string | null>(null);

  // RTK Query hooks
  const { data: profile, isLoading: loadingProfile } = useGetProfileQuery(userId || '', { skip: !userId });
  const [updateProfile, { isLoading: isUpdatingName }] = useUpdateProfileMutation();

  // State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const user = await authService.getCurrentUser();
      if (user) {
        setUserId(user.id);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setEmail(profile.email || '');
    }
  }, [profile]);

  const handleUpdateName = async () => {
    if (!userId || !fullName.trim()) return;
    try {
      await updateProfile({ userId, fullName: fullName.trim() }).unwrap();
      Alert.alert('Success', 'Your name has been updated.');
    } catch (error: any) {
      Alert.alert('Update Failed', error.message || 'Failed to update name.');
    }
  };

  const handleInitiateEmailChange = async () => {
    if (!email.trim() || email === profile?.email) return;
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    try {
      setIsSendingOtp(true);
      await authService.updateUserEmail(email.trim());
      setIsVerifyingEmail(true);
      Alert.alert('OTP Sent', `A verification code has been sent to ${email}.`);
    } catch (error: any) {
      Alert.alert('Request Failed', error.message || 'Failed to initiate email change.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!otp.trim() || otp.length < 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit verification code.');
      return;
    }

    try {
      setIsVerifyingOtp(true);
      await authService.verifyEmailChange(email.trim(), otp.trim());
      setIsVerifyingEmail(false);
      setOtp('');
      Alert.alert('Success', 'Your email has been verified and updated.');
    } catch (error: any) {
      Alert.alert('Verification Failed', error.message || 'Invalid or expired OTP.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  if (loadingProfile) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={15}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </Pressable>
          <Text style={styles.headerTitle}>Personal Information</Text>
        </View>

        <Text style={styles.headerSubtitle}>
          Keep your profile details up to date to stay connected.
        </Text>

        {/* Name Section */}
        <View style={styles.section}>
          <Text style={styles.label}>Full Name</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your full name"
              placeholderTextColor="#9CA3AF"
            />
          </View>
          <Pressable
            style={[
              styles.primaryButton,
              (isUpdatingName || fullName === profile?.full_name) && styles.disabledButton
            ]}
            onPress={handleUpdateName}
            disabled={isUpdatingName || fullName === profile?.full_name}
          >
            {isUpdatingName ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Save Name</Text>
            )}
          </Pressable>
        </View>

        {/* Email Section */}
        <View style={[styles.section, { marginTop: 20 }]}>
          <Text style={styles.label}>Email Address</Text>
          <View style={[styles.inputContainer, isVerifyingEmail && styles.lockedInput]}>
            <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isVerifyingEmail}
            />
            {email !== profile?.email && !isVerifyingEmail && (
              <View style={styles.changedIndicator} />
            )}
          </View>

          {!isVerifyingEmail ? (
            <Pressable
              style={[
                styles.primaryButton,
                (isSendingOtp || email === profile?.email) && styles.disabledButton,
                { backgroundColor: '#10B981' }
              ]}
              onPress={handleInitiateEmailChange}
              disabled={isSendingOtp || email === profile?.email}
            >
              {isSendingOtp ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>Update Email</Text>
              )}
            </Pressable>
          ) : (
            <View style={styles.otpSection}>
              <View style={styles.otpHeader}>
                <Text style={styles.otpAlert}>Verification Required</Text>
                <Pressable onPress={() => setIsVerifyingEmail(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
              </View>
              <Text style={styles.otpSubtext}>
                Enter the 6-digit code sent to your new email address.
              </Text>
              <View style={styles.inputContainer}>
                <Ionicons name="key-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={otp}
                  onChangeText={setOtp}
                  placeholder="000000"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>
              <Pressable
                style={[
                  styles.primaryButton,
                  isVerifyingOtp && styles.disabledButton,
                  { backgroundColor: '#4F46E5' }
                ]}
                onPress={handleVerifyEmailOtp}
                disabled={isVerifyingOtp}
              >
                {isVerifyingOtp ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.buttonText}>Verify & Update</Text>
                )}
              </Pressable>
            </View>
          )}
        </View>

        {/* Help Tip */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={18} color="#4F46E5" />
          <Text style={styles.infoText}>
            Your phone number is linked to your account and cannot be changed here. Contact support if you need to update it.
          </Text>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backBtn: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 32,
    lineHeight: 22,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  lockedInput: {
    opacity: 0.6,
    backgroundColor: '#E5E7EB',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  primaryButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  disabledButton: {
    opacity: 0.6,
    elevation: 0,
    shadowOpacity: 0,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  changedIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginLeft: 8,
  },
  otpSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  otpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  otpAlert: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4F46E5',
  },
  cancelText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '600',
  },
  otpSubtext: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    padding: 16,
    marginTop: 32,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#4338CA',
    lineHeight: 18,
    marginLeft: 12,
  },
});
