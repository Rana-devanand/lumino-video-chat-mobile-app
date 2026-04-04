import { supabase } from '@/utils/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export type UserStatus = 'online' | 'offline';

export const presenceService = {
  /**
   * Tracks the presence of the current user globally.
   * This is typically called once on app mount for the logged-in user.
   */
  trackPresence(userId: string): RealtimeChannel {
    const channel = supabase.channel('global-presence', {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        // We can handle global sync if needed
        // const state = channel.presenceState();
        // console.log('[presenceService] Global Presence Sync:', state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        // console.log('[presenceService] User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        // console.log('[presenceService] User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            online_at: new Date().toISOString(),
          });
        }
      });

    return channel;
  },

  /**
   * Subscribes to a specific user's online status in real-time.
   * Returns a function to unsubscribe.
   */
  subscribeToUserStatus(userId: string, onStatusChange: (status: UserStatus) => void) {
    const channel = supabase.channel(`user-presence-${userId}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    const handleSync = () => {
      const state = channel.presenceState();
      const isOnline = state[userId] !== undefined;
      onStatusChange(isOnline ? 'online' : 'offline');
    };

    channel
      .on('presence', { event: 'sync' }, handleSync)
      .on('presence', { event: 'join' }, handleSync)
      .on('presence', { event: 'leave' }, handleSync)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Manually check if a user is currently online in a channel.
   * (Note: This only works if you're already subscribed to a channel tracking that user.)
   */
  isUserOnline(channel: RealtimeChannel, userId: string): boolean {
    const state = channel.presenceState();
    return state[userId] !== undefined;
  }
};
