import { getAuth, signInWithPhoneNumber, onAuthStateChanged, FirebaseAuthTypes } from '@react-native-firebase/auth';
import { supabase } from '@/utils/supabase';

export const authService = {
  /**
   * Initiates the phone number sign-in process.
   * Returns a confirmation object to be used for OTP verification.
   */
  async signInWithPhone(phoneNumber: string) {
    console.log(`[authService] Initiating signInWithPhoneNumber for: ${phoneNumber}`);
    const auth = getAuth();
    try {
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber);
      console.log(`[authService] Confirmation object received for: ${phoneNumber}`);
      return confirmation;
    } catch (error) {
      console.error('[authService] signInWithPhoneNumber failed:', error);
      throw error;
    }
  },

  /**
   * Confirms the OTP code with the provided confirmation result.
   */
  async confirmOTP(confirmation: any, code: string) {
    console.log(`[authService] Verifying OTP: ${code}`);
    try {
      const result = await confirmation.confirm(code);
      console.log('[authService] OTP Verified successfully');
      return result;
    } catch (error) {
      console.error('[authService] OTP verification failed:', error);
      throw error;
    }
  },

  /**
   * Subscribes to authentication state changes.
   */
  onAuthChange(callback: (user: FirebaseAuthTypes.User | null) => void) {
    console.log('[authService] Subscribing to onAuthStateChanged');
    const auth = getAuth();
    return onAuthStateChanged(auth, callback);
  },

  /**
   * Forces a sync of the current Firebase user profile to the Supabase database.
   * Optionally accepts a referrerId to link the users automatically.
   */
  async syncUserWithSupabase(user: FirebaseAuthTypes.User | null, referrerId?: string | null) {
    if (!user || !user.phoneNumber) {
      console.log('[authService] No user to sync or phone number missing');
      return null;
    }

    console.log(`[authService] Syncing user to Supabase: ${user.uid} (Referrer: ${referrerId || 'NONE'})`);
    try {
      const { data, error } = await supabase.rpc('sync_user_profile', {
        user_id: user.uid,
        user_phone: user.phoneNumber,
        user_name: user.displayName,
        referrer_id: referrerId,
      });

      if (error) {
        console.error('[authService] Supabase sync error:', error);
        throw error;
      }

      console.log('[authService] User synced successfully:', data);
      return data;
    } catch (error) {
      console.error('[authService] syncUserWithSupabase failed:', error);
      throw error;
    }
  },

  /**
   * Returns the currently authenticated Firebase user.
   */
  getCurrentUser() {
    return getAuth().currentUser;
  },

  /**
   * Signs out the current user.
   */
  async signOut() {
    console.log('[authService] Signing out...');
    const auth = getAuth();
    try {
      await auth.signOut();
      console.log('[authService] Signed out successfully');
    } catch (error) {
      console.error('[authService] Sign out failed:', error);
      throw error;
    }
  }
};
