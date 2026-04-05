import { supabase } from '@/utils/supabase';

export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

export interface Conversation {
  contact_id: string;
  full_name: string;
  phone_number: string;
  avatar_url: string | null;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  is_last_mine: boolean; // did I send the last message?
}

export const messageService = {
  /**
   * Fetches the conversation history between two users.
   */
  async getChatHistory(userId: string, contactId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${userId})`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[messageService] getChatHistory error:', error);
      throw error;
    }
    return data as ChatMessage[];
  },

  /**
   * Sends a message to a specific contact.
   */
  async sendMessage(senderId: string, receiverId: string, content: string) {
    const { data, error } = await supabase
      .from('messages')
      .insert({ sender_id: senderId, receiver_id: receiverId, content, is_read: false })
      .select()
      .single();

    if (error) {
      console.error('[messageService] sendMessage error:', error);
      throw error;
    }
    return data as ChatMessage;
  },

  /**
   * Marks all messages from a specific sender as read.
   * Call this when the receiver opens the chat.
   */
  async markMessagesAsRead(receiverId: string, senderId: string) {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('receiver_id', receiverId)
      .eq('sender_id', senderId)
      .eq('is_read', false);

    if (error) {
      console.error('[messageService] markMessagesAsRead error:', error);
    }
  },

  /**
   * Subscribes to real-time INSERT events (new incoming messages).
   */
  subscribeToMessages(userId: string, onNewMessage: (msg: ChatMessage) => void) {
    return supabase
      .channel(`chat_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`
        },
        (payload) => {
          onNewMessage(payload.new as ChatMessage);
        }
      )
      .subscribe();
  },

  /**
   * Subscribes to real-time UPDATE events so the sender can see when
   * their messages get marked as read by the receiver.
   */
  subscribeToReadReceipts(senderId: string, onRead: (updatedMsg: ChatMessage) => void) {
    return supabase
      .channel(`receipts_${senderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${senderId}`
        },
        (payload) => {
          if (payload.new.is_read) {
            onRead(payload.new as ChatMessage);
          }
        }
      )
      .subscribe();
  },

  /**
   * Fetches all started conversations for the current user.
   * Returns one entry per conversation partner, sorted by most recent.
   */
  async getConversations(userId: string): Promise<Conversation[]> {
    // Pull all messages involving this user
    const { data, error } = await supabase
      .from('messages')
      .select(`
        id,
        sender_id,
        receiver_id,
        content,
        created_at,
        is_read
      `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[messageService] getConversations error:', error);
      throw error;
    }

    // Group by conversation partner — keep only the latest message per partner
    const seenPartners = new Set<string>();
    const latestPerPartner: ChatMessage[] = [];

    for (const msg of (data as ChatMessage[])) {
      const partnerId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
      if (!seenPartners.has(partnerId)) {
        seenPartners.add(partnerId);
        latestPerPartner.push(msg);
      }
    }

    if (latestPerPartner.length === 0) return [];

    // Fetch profile details for all partners
    const partnerIds = latestPerPartner.map(m =>
      m.sender_id === userId ? m.receiver_id : m.sender_id
    );

    const { data: profiles, error: profErr } = await supabase
      .from('profiles')
      .select('id, full_name, phone_number, avatar_url')
      .in('id', partnerIds);

    if (profErr) {
      console.error('[messageService] getConversations profiles error:', profErr);
      throw profErr;
    }

    // Count unread per partner (messages sent TO me that are unread)
    const unreadCounts: Record<string, number> = {};
    for (const msg of (data as ChatMessage[])) {
      if (msg.receiver_id === userId && !msg.is_read) {
        const pid = msg.sender_id;
        unreadCounts[pid] = (unreadCounts[pid] || 0) + 1;
      }
    }

    const profileMap: Record<string, any> = {};
    for (const p of (profiles || [])) { profileMap[p.id] = p; }

    return latestPerPartner.map(msg => {
      const partnerId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
      const profile = profileMap[partnerId] || {};
      return {
        contact_id:      partnerId,
        full_name:       profile.full_name  || 'Unknown',
        phone_number:    profile.phone_number || '',
        avatar_url:      profile.avatar_url  || null,
        last_message:    msg.content,
        last_message_at: msg.created_at,
        unread_count:    unreadCounts[partnerId] || 0,
        is_last_mine:    msg.sender_id === userId,
      } as Conversation;
    });
  },

  /**
   * Deletes all messages between two users (Clear Chat).
   */
  async clearChat(userId: string, contactId: string) {
    const { error } = await supabase
      .from('messages')
      .delete()
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${userId})`);

    if (error) {
      console.error('[messageService] clearChat error:', error);
      throw error;
    }
    return true;
  },

  removeChannel(channel: any) {
    supabase.removeChannel(channel);
  }
};
