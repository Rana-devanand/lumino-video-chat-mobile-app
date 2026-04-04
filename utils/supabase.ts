import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://agedljkmopoxihcmvyba.supabase.co";
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY || "sb_publishable_zvTGllPHoSXOlQgXy5PeZA_h9X9pSoV";

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Supabase environment variables are missing! Check your .env file or EAS Secrets.');
}

// Default to empty strings to avoid immediate crash in the SDK,
// but it will fail during actual requests.
export const supabase = createClient(
  supabaseUrl || 'https://MISSING_URL.supabase.co',
  supabaseKey || 'MISSING_KEY',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  })
