import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { supabase } from '../utils/supabase';
import { AuthProfile } from './authService';
import { RegisteredContact } from './contactService';
import { Group } from './groupService';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Profile', 'Contacts', 'Groups', 'Messages'],
  endpoints: (builder) => ({
    
    // 1. Get Current User Profile
    getProfile: builder.query<AuthProfile, string>({
      queryFn: async (userId) => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
          
          if (error) {
            // Handle profile missing - standard Supabase error check
            return { error: { status: 'CUSTOM_ERROR', error: error.message } };
          }
          return { data: data as AuthProfile };
        } catch (err: any) {
          return { error: { status: 'FETCH_ERROR', error: err.message } };
        }
      },
      providesTags: (result, error, id) => [{ type: 'Profile', id }],
    }),

    // 2. Get Contacts (Dynamic based on user ID)
    getContacts: builder.query<RegisteredContact[], string>({
      queryFn: async (userId) => {
        try {
          // Fetch contacts logic from contactService
          const { data: contactsData, error: contactsError } = await supabase
            .from('contacts')
            .select('contact_id')
            .eq('user_id', userId);

          if (contactsError) throw contactsError;
          if (!contactsData || contactsData.length === 0) return { data: [] };

          const contactIds = contactsData.map(c => c.contact_id);
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .in('id', contactIds);

          if (profilesError) throw profilesError;
          return { data: profiles as RegisteredContact[] };
        } catch (err: any) {
          return { error: { status: 'FETCH_ERROR', error: err.message } };
        }
      },
      providesTags: (result) => 
        result 
          ? [...result.map(({ id }) => ({ type: 'Contacts' as const, id })), { type: 'Contacts', id: 'LIST' }]
          : [{ type: 'Contacts', id: 'LIST' }],
    }),

    // 3. Get User Groups
    getGroups: builder.query<Group[], string>({
      queryFn: async (userId) => {
        try {
          const { data, error } = await supabase
            .from('groups')
            .select('*, group_members!inner(user_id)')
            .eq('group_members.user_id', userId);

          if (error) throw error;
          return { data: data as Group[] };
        } catch (err: any) {
          return { error: { status: 'FETCH_ERROR', error: err.message } };
        }
      },
      providesTags: (result) => 
        result 
          ? [...result.map(({ id }) => ({ type: 'Groups' as const, id })), { type: 'Groups', id: 'LIST' }]
          : [{ type: 'Groups', id: 'LIST' }],
    }),

    // 4. Update Avatar (Mutation)
    updateAvatar: builder.mutation<string, { userId: string, publicUrl: string }>({
      queryFn: async ({ userId, publicUrl }) => {
        try {
          const { error } = await supabase
            .from('profiles')
            .update({ avatar_url: publicUrl })
            .eq('id', userId);

          if (error) throw error;
          return { data: publicUrl };
        } catch (err: any) {
          return { error: { status: 'UPDATE_ERROR', error: err.message } };
        }
      },
      invalidatesTags: (result, error, { userId }) => [{ type: 'Profile', id: userId }],
    }),

    // 5. Update Profile (Name)
    updateProfile: builder.mutation<void, { userId: string, fullName: string }>({
      queryFn: async ({ userId, fullName }) => {
        try {
          const { error } = await supabase
            .from('profiles')
            .update({ full_name: fullName })
            .eq('id', userId);

          if (error) throw error;
          return { data: undefined };
        } catch (err: any) {
          return { error: { status: 'UPDATE_ERROR', error: err.message } };
        }
      },
      invalidatesTags: (result, error, { userId }) => [{ type: 'Profile', id: userId }],
    }),

  }),
});

export const {
  useGetProfileQuery,
  useGetContactsQuery,
  useGetGroupsQuery,
  useUpdateAvatarMutation,
  useUpdateProfileMutation,
} = api;
