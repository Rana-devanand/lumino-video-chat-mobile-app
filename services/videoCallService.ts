import { supabase } from '@/utils/supabase';

export interface VideoRoom {
  id: string;
  host_id: string;
  guest_id: string | null;
  group_id: string | null; // Added for group calls
  status: 'waiting' | 'connecting' | 'active' | 'ended';
  offer: any;
  answer: any;
  created_at: string;
}

export const videoCallService = {
  /**
   * Creates a new video call room in Supabase.
   */
  async createRoom(hostId: string, guestId?: string, groupId?: string) {
    console.log(`[videoCallService] Creating room: Host=${hostId}, Guest=${guestId || 'NONE'}, Group=${groupId || 'NONE'}`);

    const { data, error } = await supabase
      .from('webrtc_rooms')
      .insert({ 
        host_id: hostId, 
        guest_id: guestId || null,
        group_id: groupId || null,
        status: 'waiting'
      })
      .select('id')
      .single();

    if (error) {
      console.error('[videoCallService] Room creation failed:', error.message);
      throw new Error(`Failed to create a new room: ${error.message}`);
    }

    return data.id;
  },

  /**
   * For group calls, we can notify multiple users at once or create multiple 
   * entries to leverage existing signaling logic.
   */
  async createGroupCall(hostId: string, memberIds: string[], groupId?: string) {
    console.log(`[videoCallService] Starting call for ${memberIds.length} members...`);
    
    // For simplicity, we create one room record per guest for signalling, 
    // but they can all point to the same "session" or just be 1-to-1 rooms.
    // However, a true group call room uses one ID and everyone enters it.
    
    const { data: room, error: roomErr } = await supabase
      .from('webrtc_rooms')
      .insert({
        host_id: hostId,
        group_id: groupId || null,
        status: 'waiting'
      })
      .select('id')
      .single();

    if (roomErr) throw roomErr;

    // Trigger invitations for all members
    const invites = memberIds.map(uid => ({
      room_id: room.id,
      guest_id: uid,
      // We don't have an 'invites' table, we use the existing webrtc_rooms? 
      // Actually, if guest_id is null in webrtc_rooms, our listener won't pick it up.
      // So we must either update the room listener or create individual rooms.
    }));
    
    // Let's create individual rooms for each guest for now to ensure they all get the signal 
    // using the existing 'postgres_changes' filter by guest_id.
    const rooms = memberIds.map(uid => ({
      host_id: hostId,
      guest_id: uid,
      group_id: groupId || null,
      status: 'waiting'
    }));

    const { data, error } = await supabase
      .from('webrtc_rooms')
      .insert(rooms)
      .select('id');

    if (error) throw error;
    return (data || []).map(r => r.id);
  },

  /**
   * Listens for any new rooms where the current user is the guest.
   */
  listenForIncomingCalls(userId: string, onIncomingCall: (room: VideoRoom) => void) {
    // Generate a unique channel name to avoid collisions when re-subscribing
    const channelId = `incoming-calls-${userId}-${Math.random().toString(36).substring(7)}`;
    console.log(`[videoCallService] Creating channel: ${channelId}`);

    return supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'webrtc_rooms', 
          filter: `guest_id=eq.${userId}` 
        },
        (payload) => {
          if (payload.new && payload.new.status === 'waiting') {
            onIncomingCall(payload.new as VideoRoom);
          }
        }
      )
      .subscribe();
  },

  /**
   * Updates an existing room.
   */
  async updateRoom(roomId: string, updates: Partial<VideoRoom>) {
    const { error } = await supabase
      .from('webrtc_rooms')
      .update(updates)
      .eq('id', roomId);

    if (error) {
      console.error('[videoCallService] Room update failed:', error);
      throw error;
    }
    return true;
  },

  /**
   * Fetches room data.
   */
  async getRoom(roomId: string) {
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
   * Adds an ICE candidate.
   */
  async addIceCandidate(roomId: string, candidate: any, type: 'caller_candidate' | 'callee_candidate') {
    const { error } = await supabase.from('webrtc_ice_candidates').insert({
      room_id: roomId,
      candidate: candidate,
      type: type,
    });
    if (error) throw error;
    return true;
  },

  /**
   * Fetches ICE candidates.
   */
  async getIceCandidates(roomId: string, type: 'caller_candidate' | 'callee_candidate') {
    const { data, error } = await supabase
      .from('webrtc_ice_candidates')
      .select('candidate')
      .eq('room_id', roomId)
      .eq('type', type);
    if (error) throw error;
    return data;
  },

  /**
   * Subscribes to realtime changes for a specific room.
   */
  subscribeToCallEvents(roomId: string, onRoomUpdate: (payload: any) => void, onIceCandidate: (payload: any) => void) {
    return supabase
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
  },

  /**
   * Rejects an incoming call by ending the room.
   */
  async rejectCall(roomId: string) {
    return this.updateRoom(roomId, { status: 'ended' });
  },

  removeChannel(channel: any) {
    if (channel) {
      supabase.removeChannel(channel);
    }
  }
};

