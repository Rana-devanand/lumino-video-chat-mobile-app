import { supabase } from '@/utils/supabase';
import { Session, User } from '@supabase/supabase-js';

export interface AuthProfile {
  id: string;
  email: string;
  full_name: string;
  phone_number: string;
  avatar_url: string | null;
}

export const authService = {
  /**
   * Initiates the Email OTP sign-in/signup process.
   * Supabase will send a 6-digit code to the provided email.
   */
  async signInWithEmail(email: string, name?: string, phone?: string) {
    console.log(`[authService] Initiating Email OTP for: ${email}`);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          data: {
            full_name: name,
            phone_number: phone,
          }
        }
      });
      if (error) throw error;
      console.log(`[authService] OTP sent to: ${email}`);
      return true;
    } catch (error) {
      console.error('[authService] signInWithEmail failed:', error);
      throw error;
    }
  },

  /**
   * Looks up the email associated with a phone number.
   */
  async getEmailByPhone(phone: string) {
    console.log(`[authService] Looking up email for phone: ${phone}`);
    const { data, error } = await supabase
      .from('profiles')
      .select('email')
      .eq('phone_number', phone)
      .single();
    
    if (error) {
      console.error('[authService] getEmailByPhone failed:', error.message);
      return null;
    }
    return data?.email as string;
  },

  /**
   * Initiates login using Phone Number (Lookup Email -> Send OTP).
   */
  async signInWithPhone(phone: string) {
    const email = await this.getEmailByPhone(phone);
    if (!email) {
      throw new Error('This phone number is not registered. Please join us first!');
    }
    await this.signInWithEmail(email);
    return email;
  },

  /**
   * Verifies the Email OTP code.
   */
  async verifyOTP(email: string, token: string) {
    console.log(`[authService] Verifying Email OTP for ${email}: ${token}`);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup', // Try signup first, if fails we'll try 'login'
      });
      
      if (error) {
        // Fallback to login type if signup verification fails (e.g. user already exists)
        const { data: loginData, error: loginError } = await supabase.auth.verifyOtp({
          email,
          token,
          type: 'magiclink',
        });
        if (loginError) throw loginError;
        return loginData;
      }
      
      return data;
    } catch (error) {
      console.error('[authService] OTP verification failed:', error);
      throw error;
    }
  },

  /**
   * Subscribes to authentication state changes using Supabase session.
   */
  onAuthChange(callback: (user: User | null) => void) {
    console.log('[authService] Subscribing to Supabase onAuthStateChange');
    
    // Initial check
    supabase.auth.getSession().then(({ data: { session } }) => {
      callback(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`[authService] Auth Event: ${event}`);
      callback(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  },

  /**
   * Syncs the Supabase user profile to the public profiles table.
   */
  async syncUserWithSupabase(user: User | null, referrerId?: string | null) {
    if (!user || !user.email) {
      console.log('[authService] No user to sync or email missing');
      return null;
    }

    // Extract metadata from Supabase user
    const fullName = user.user_metadata?.full_name;
    const phoneNumber = user.user_metadata?.phone_number;

    console.log(`[authService] Syncing user ${user.id} to Profiles (Referrer: ${referrerId || 'NONE'})`);
    try {
      const { data, error } = await supabase.rpc('sync_user_profile', {
        user_id: user.id,
        user_phone: phoneNumber,
        user_email: user.email,
        user_name: fullName,
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
   * Returns the currently authenticated Supabase user.
   */
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  /**
   * Fetches user profile from Supabase by ID.
   */
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('[authService] getProfile failed:', error.message);
      // Self-healing: If the profile is missing (e.g. from an earlier sync failure),
      // try to recreate it now using the active session data.
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.id === userId) {
          console.log('[authService] Attempting self-healing sync...');
          await this.syncUserWithSupabase(user);
          return {
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || 'Lumino User',
            phone_number: user.user_metadata?.phone_number || ''
          } as AuthProfile;
        }
      } catch (syncError) {
        console.error('[authService] Self-healing failed:', syncError);
      }
      return null;
    }
    return data as AuthProfile;
  },

  /**
   * Updates the user's Expo push token in the profiles table.
   */
  async updatePushToken(userId: string, token: string) {
    console.log(`[authService] Updating push token for user ${userId}...`);
    const { error } = await supabase
      .from('profiles')
      .update({ expo_push_token: token })
      .eq('id', userId);
    if (error) throw error;
  },

  /**
   * Uploads a profile picture to Supabase Storage and updates the profiles table.
   */
  async uploadAvatar(userId: string, uri: string) {
    console.log(`[authService] Uploading avatar for user ${userId}...`);
    try {
      // 1. Convert URI to Blob (Robust React Native approach using XMLHttpRequest)
      const blob: Blob = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function () {
          resolve(xhr.response);
        };
        xhr.onerror = function (e) {
          console.error('[authService] xhr failed:', e);
          reject(new TypeError("Network request failed"));
        };
        xhr.responseType = "blob";
        xhr.open("GET", uri, true);
        xhr.send(null);
      });
      
      // 2. Convert Blob to ArrayBuffer (Supabase RN fix)
      const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result instanceof ArrayBuffer) {
            resolve(reader.result);
          } else {
            reject(new Error("Failed to convert blob to ArrayBuffer"));
          }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
      });

      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      console.log(`[authService] Starting Supabase upload: ${filePath} (${blob.size} bytes)`);

      // 3. Upload to 'avatars' bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, arrayBuffer, {
          contentType: `image/${fileExt}`,
          upsert: true
        });


      if (uploadError) throw uploadError;

      // 3. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 4. Update profiles table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      console.log('[authService] Avatar uploaded and profile updated:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('[authService] uploadAvatar failed:', error);
      throw error;
    }
  },

  /**
   * Initiates the email change process.
   * Supabase sends an OTP code to the NEW email address.
   */
  async updateUserEmail(newEmail: string) {
    console.log(`[authService] Initiating Email Change to: ${newEmail}`);
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) throw error;
    return true;
  },

  /**
   * Verifies the OTP code for an email change.
   */
  async verifyEmailChange(newEmail: string, token: string) {
    console.log(`[authService] Verifying Email Change OTP for ${newEmail}: ${token}`);
    const { data, error } = await supabase.auth.verifyOtp({
      email: newEmail,
      token,
      type: 'email_change',
    });

    if (error) throw error;

    // After success, sync to profiles table
    if (data.user) {
      await this.syncUserWithSupabase(data.user);
    }
    return data;
  },

  /**
   * Signs out the current user.
   */
  async signOut() {
    console.log('[authService] Signing out from Supabase...');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      console.log('[authService] Signed out successfully');
    } catch (error) {
      console.error('[authService] Sign out failed:', error);
      throw error;
    }
  }
};
