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
   * Takes an array of phone numbers and returns registered profile data.
   */
  async getRegisteredContacts(phoneNumbers: string[]) {
    if (phoneNumbers.length === 0) return [];

    console.log(`[contactService] Syncing ${phoneNumbers.length} contacts with database...`);
    
    // Call the Supabase RPC function to filter registered contacts
    try {
      const { data, error } = await supabase.rpc('get_registered_contacts', {
        phone_numbers: phoneNumbers,
      });

      if (error) {
        console.error('[contactService] Supabase RPC error:', error);
        throw error;
      }

      console.log(`[contactService] Found ${data?.length || 0} registered contacts.`);
      return data as RegisteredContact[];
    } catch (error) {
      console.error('[contactService] getRegisteredContacts failed:', error);
      throw error;
    }
  }
};
