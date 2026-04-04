import { supabase } from '@/utils/supabase';

export interface VideoRoom {
  id: string;
  host_id: string;
  guest_id: string | null;
  status: 'waiting' | 'connecting' | 'active' | 'ended';
  offer: any;
  answer: any;
  created_at: string;
}

export const videoCallService = {
  /**
   * Creates a new video call room in Supabase.
   */
  async createRoom(hostId: string) {
    console.log(`[videoCallService] Creating room for host: ${hostId}`);

    // Check if the supabase client is properly initialized
    // (In production, if env vars are missing, the URL might be invalid)
    if (!process.env.EXPO_PUBLIC_SUPABASE_URL) {
      console.error('[videoCallService] EXPO_PUBLIC_SUPABASE_URL is missing! Production build will fail.');
      throw new Error('Database configuration missing. Please report this to support.');
    }

    const { data, error } = await supabase
      .from('webrtc_rooms')
      .insert({ host_id: hostId })
      .select('id')
      .single();

    if (error) {
      // Detailed error logging for production debugging
      console.error('[videoCallService] Room creation failed:', error.message, error.details, error.hint);
      throw new Error(`Failed to create a new room: ${error.message}`);
    }

    if (!data) {
      console.error('[videoCallService] Room data is null after insert.');
      throw new Error('Failed to retrieve new room session.');
    }

    console.log(`[videoCallService] Room created successfully: ${data.id}`);
    return data.id;
  },

  /**
   * Updates an existing room (e.g., adding an offer or answer).
   */
  async updateRoom(roomId: string, updates: Partial<VideoRoom>) {
    console.log(`[videoCallService] Updating room: ${roomId}`, updates);

    const { error } = await supabase
      .from('webrtc_rooms')
      .update(updates)
      .eq('id', roomId);

    if (error) {
      console.error('[videoCallService] Room update failed:', error);
      throw error;
    }
    
    console.log(`[videoCallService] Room updated successfully: ${roomId}`);
    return true;
  },

  /**
   * Fetches the data for a specific room.
   */
  async getRoom(roomId: string) {
    console.log(`[videoCallService] Fetching room data: ${roomId}`);

    const { data, error } = await supabase
      .from('webrtc_rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (error || !data) {
      console.error('[videoCallService] Room fetch failed:', error);
      throw error;
    }

    return data as VideoRoom;
  },

  /**
   * Adds an ICE candidate for a specific room.
   */
  async addIceCandidate(roomId: string, candidate: any, type: 'caller_candidate' | 'callee_candidate') {
    console.log(`[videoCallService] Adding ${type} for room: ${roomId}`);

    const { error } = await supabase.from('webrtc_ice_candidates').insert({
      room_id: roomId,
      candidate: candidate,
      type: type,
    });

    if (error) {
      console.error('[videoCallService] ICE Candidate insertion failed:', error);
      throw error;
    }

    return true;
  },

  /**
   * Fetches all registered ICE candidates for a room and type.
   */
  async getIceCandidates(roomId: string, type: 'caller_candidate' | 'callee_candidate') {
    console.log(`[videoCallService] Fetching ${type}s for room: ${roomId}`);

    const { data, error } = await supabase
      .from('webrtc_ice_candidates')
      .select('candidate')
      .eq('room_id', roomId)
      .eq('type', type);

    if (error) {
      console.error('[videoCallService] ICE Candidate fetch failed:', error);
      throw error;
    }

    return data;
  },

  /**
   * Subscribes to realtime changes for a specific room and its ICE candidates.
   */
  subscribeToCallEvents(roomId: string, onRoomUpdate: (payload: any) => void, onIceCandidate: (payload: any) => void) {
    console.log(`[videoCallService] Subscribing to call events for: ${roomId}`);

    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'webrtc_rooms', filter: `id=eq.${roomId}` },
        onRoomUpdate
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'webrtc_ice_candidates', filter: `room_id=eq.${roomId}` },
        onIceCandidate
      )
      .subscribe();

    return channel;
  },

  /**
   * Removes a subscription channel.
   */
  removeChannel(channel: any) {
    if (channel) {
      supabase.removeChannel(channel);
    }
  }
};
