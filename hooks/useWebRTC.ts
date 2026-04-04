import { useState, useRef, useEffect } from 'react';
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  mediaDevices,
  MediaStream,
} from 'react-native-webrtc';
import { videoCallService } from '@/services/videoCallService';
import { authService } from '@/services/authService';

const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export function useWebRTC() {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'connected' | 'ended'>('idle');
  const [roomId, setRoomId] = useState<string | null>(null);

  const pc = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<any>(null);

  // Initialize camera and mic
  const setupMediaStream = async () => {
    try {
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: { width: 1280, height: 720, frameRate: 30, facingMode: 'user' },
      });
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      return null;
    }
  };

  // Close tracks and connection thoroughly
  const cleanup = () => {
    if (pc.current) {
      pc.current.close();
      pc.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => track.stop());
      setRemoteStream(null);
    }
    if (channelRef.current) {
      videoCallService.removeChannel(channelRef.current);
    }
    setCallStatus('idle');
    setRoomId(null);
  };

  const createPeerConnection = (currentRoomId: string, role: 'caller' | 'callee') => {
    const peerConnection = new RTCPeerConnection(configuration);
    pc.current = peerConnection;

    // Add local stream tracks to the connection
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
      });
    }

    // Handle remote tracks
    // @ts-ignore - react-native-webrtc types missing ontrack
    peerConnection.ontrack = (event: any) => {
      setRemoteStream(event.streams[0]);
      setCallStatus('connected');
    };

    // Handle ICE Candidates generated locally
    // @ts-ignore - react-native-webrtc types missing onicecandidate
    peerConnection.onicecandidate = async (event: any) => {
      if (event.candidate) {
        await videoCallService.addIceCandidate(
          currentRoomId, 
          event.candidate.toJSON(), 
          role === 'caller' ? 'caller_candidate' : 'callee_candidate'
        );
      }
    };

    return peerConnection;
  };

  const startCall = async () => {
    setCallStatus('connecting');
    const stream = localStream || await setupMediaStream();
    if (!stream) {
      setCallStatus('idle');
      return null;
    }

    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      console.error('No authenticated user found');
      setCallStatus('idle');
      return null;
    }

    // 1. Create a new room in Supabase
    const newRoomId = await videoCallService.createRoom(currentUser.uid);
    setRoomId(newRoomId);

    const peerConnection = createPeerConnection(newRoomId, 'caller');

    // 2. Create Offer
    const offer = await peerConnection.createOffer({});
    await peerConnection.setLocalDescription(offer);

    // 3. Save Offer to Room Database
    await videoCallService.updateRoom(newRoomId, { offer: { type: offer.type, sdp: offer.sdp } });

    // 4. Subscribe to Answer and Callee ICE Candidates
    const channel = videoCallService.subscribeToCallEvents(
      newRoomId,
      async (payload) => {
        if (payload.new.answer && !(pc.current as any)?.remoteDescription) {
          const answer = new RTCSessionDescription(payload.new.answer);
          await pc.current?.setRemoteDescription(answer);
        }
      },
      async (payload) => {
        if (payload.new.type === 'callee_candidate' && pc.current) {
          const candidate = new RTCIceCandidate(payload.new.candidate);
          await pc.current.addIceCandidate(candidate);
        }
      }
    );

    channelRef.current = channel;
    setCallStatus('idle'); // caller should now see the call UI (with local preview)
    return newRoomId;
  };

  const joinCall = async (joinRoomId: string) => {
    setCallStatus('connecting');
    setRoomId(joinRoomId);

    const stream = localStream || await setupMediaStream();
    if (!stream) {
      setCallStatus('idle');
      return false;
    }

    // 1. Fetch Room Offer
    const roomData = await videoCallService.getRoom(joinRoomId);
    if (!roomData || !roomData.offer) {
      console.error('Room not found or no offer present');
      return false;
    }

    const peerConnection = createPeerConnection(joinRoomId, 'callee');

    // 2. Set Remote Description (Caller's Offer)
    const offer = new RTCSessionDescription(roomData.offer);
    await peerConnection.setRemoteDescription(offer);

    // 3. Create Answer
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    // 4. Update Database with Answer
    await videoCallService.updateRoom(joinRoomId, { answer: { type: answer.type, sdp: answer.sdp }, status: 'active' });

    // 5. Subscribe to Caller ICE Candidates
    const channel = videoCallService.subscribeToCallEvents(
      joinRoomId,
      () => {}, // No need for room updates on callee side yet
      async (payload) => {
        if (payload.new.type === 'caller_candidate' && pc.current) {
          const candidate = new RTCIceCandidate(payload.new.candidate);
          await pc.current.addIceCandidate(candidate);
        }
      }
    );

    channelRef.current = channel;

    // 6. Pre-existing Caller ICE Candidates fetch
    const existingCandidates = await videoCallService.getIceCandidates(joinRoomId, 'caller_candidate');
    if (existingCandidates) {
      existingCandidates.forEach(async (c: any) => {
        await peerConnection.addIceCandidate(new RTCIceCandidate(c.candidate));
      });
    }

    return true;
  };

  const endCall = async () => {
    if (roomId) {
      await videoCallService.updateRoom(roomId, { status: 'ended' });
    }
    cleanup();
  };

  // Thorough cleanup when caller unmounts
  const thoroughCleanup = () => {
    if (channelRef.current) {
      videoCallService.removeChannel(channelRef.current);
    }
    cleanup();
  };

  // Mount/Unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  return {
    localStream,
    remoteStream,
    callStatus,
    roomId,
    startCall,
    joinCall,
    endCall,
    setupMediaStream,
  };
}
