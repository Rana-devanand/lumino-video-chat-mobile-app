import { supabase } from '@/utils/supabase';

export interface RegisteredContact {
  id: string;
  full_name: string;
  phone_number: string;
  avatar_url: string | null;
}

export const contactService = {
  /**
   * Syncs device contacts with the Supabase database to find which are registered.
   * Also fetches profiles that are already linked via referral (inner circle).
   * Takes user_id and an array of phone numbers.
   */
  async getRegisteredContacts(userId: string, phoneNumbers: string[]) {
    console.log(`[contactService] Syncing contacts for user ${userId}...`);
    
    // Call the updated Supabase RPC function (v2)
    try {
      const { data, error } = await supabase.rpc('get_registered_contacts', {
        current_user_id: userId,
        phone_numbers: phoneNumbers,
      });

      if (error) {
        console.error('[contactService] Supabase RPC error:', error);
        throw error;
      }

      console.log(`[contactService] Found ${data?.length || 0} total contacts.`);
      return data as RegisteredContact[];
    } catch (error) {
      console.error('[contactService] getRegisteredContacts failed:', error);
      throw error;
    }
  }

};
