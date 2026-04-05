import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Share,
  Alert,
  Animated,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { RTCView } from 'react-native-webrtc';
import { useWebRTC } from '../hooks/useWebRTC';
import { soundService } from '../services/soundService';
import { authService } from '../services/authService';

const { width, height } = Dimensions.get('window');

// Simple Pulse Animation component using standard Animated API
const PulseRing = () => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1.5,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.pulseRing,
        { transform: [{ scale }], opacity }
      ]}
    />
  );
};

export default function RoomScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const directRoomId = params.roomId as string;
  const directMode = params.mode as 'caller' | 'callee';
  const contactName = (params.name as string) || 'lumino User';
  const contactId = params.contactId as string;

  const [contactAvatar, setContactAvatar] = useState<string | null>(null);
  const [inputRoomId, setInputRoomId] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  const {
    localStream,
    remoteStream,
    callStatus,
    roomId,
    startCall,
    joinCall,
    endCall,
    setupMediaStream
  } = useWebRTC();

  useEffect(() => {
    const initialize = async () => {
      await setupMediaStream();

      if (directMode === 'caller' && contactId) {
        // Fetch contact profile for avatar
        authService.getProfile(contactId).then(p => {
          if (p?.avatar_url) setContactAvatar(p.avatar_url);
        });

        soundService.playCallingSound();

        // Handle visual-only calls for dummy contacts
        if (contactId.startsWith('d')) {
          console.log('[RoomScreen] Visual-only call for dummy contact.');
          return;
        }

        const newId = await startCall(contactId);
        if (!newId) {
          soundService.stopAll();
          Alert.alert('Call Failed', 'Could not initiate video session.');
        }
      } else if (directMode === 'callee' && directRoomId) {
        const success = await joinCall(directRoomId);
        if (!success) Alert.alert('Call Error', 'This call session is no longer active.');
      }
    };
    initialize();

    return () => {
      soundService.stopAll();
    };
  }, [directMode, contactId, directRoomId]);

  useEffect(() => {
    if (callStatus === 'connected' || callStatus === 'ended') {
      soundService.stopAll();
    }
  }, [callStatus]);

  const handleJoinCall = async () => {
    if (!inputRoomId) return;
    const success = await joinCall(inputRoomId);
    if (!success) Alert.alert('Error', 'Room not found or invalid.');
  };

  const handleEndCall = () => {
    soundService.stopAll();
    endCall();
    router.back();
  };

  const handleShareRoom = async () => {
    if (!roomId) return;
    try {
      await Share.share({ message: `Join my lumino Video Call! Room ID: ${roomId}` });
    } catch (error) { console.error(error); }
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => { track.enabled = isMuted; });
      setIsMuted(!isMuted);
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => { track.enabled = isCameraOff; });
      setIsCameraOff(!isCameraOff);
    }
  };

  // 1. CALLING STATE (Outbound Call)
  if (callStatus === 'connecting' && directMode === 'caller') {
    return (
      <View style={styles.callingContainer}>
        {localStream && (
          <RTCView streamURL={localStream.toURL()} style={styles.blurredBg} objectFit="cover" />
        )}
        <View style={styles.overlay} />
        <View style={styles.callingContent}>
          <View style={styles.avatarContainer}>
            <PulseRing />
            <View style={styles.avatarMain}>
              {contactAvatar ? (
                <Image 
                  source={{ uri: contactAvatar }} 
                  style={{ width: '100%', height: '100%', borderRadius: 60 }} 
                />
              ) : (
                <Text style={styles.avatarText}>{contactName[0]}</Text>
              )}
            </View>
          </View>
          <Text style={styles.callingName}>{contactName}</Text>
          <Text style={styles.callingStatus}>Calling...</Text>
        </View>
        <View style={styles.controlBarCalling}>
          <Pressable style={styles.endCallBtnFull} onPress={handleEndCall}>
            <Ionicons name="call" size={32} color="#FFF" />
          </Pressable>
        </View>
      </View>
    );
  }

  // 2. CONNECTING STATE (Standard Joining)
  if (callStatus === 'connecting') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>{roomId ? 'Joining Room...' : 'Initializing Session...'}</Text>
        <Pressable style={styles.cancelButton} onPress={handleEndCall}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>
      </View>
    );
  }

  // 3. ACTIVE CALL (Connected)
  if (callStatus === 'connected' || (callStatus === 'idle' && roomId && (directMode || inputRoomId))) {
    return (
      <View style={styles.callContainer}>
        {remoteStream ? (
          <RTCView streamURL={remoteStream.toURL()} style={styles.remoteVideo} objectFit="cover" />
        ) : (
          <View style={styles.remotePlaceholder}>
            <ActivityIndicator color="#FFF" />
            <Text style={styles.waitingText}>Connecting to {contactName}...</Text>
          </View>
        )}

        <View style={styles.localVideoWrapper}>
          {localStream && !isCameraOff ? (
            <RTCView streamURL={localStream.toURL()} style={styles.localVideo} objectFit="cover" zOrder={1} />
          ) : (
            <View style={styles.localPlaceholder}><Ionicons name="videocam-off" size={24} color="#6B7280" /></View>
          )}
        </View>

        <View style={styles.callHeader}>
          <View style={styles.roomBadge}>
            <Text style={styles.roomBadgeLabel}>ROOM ID</Text>
            <Text style={styles.roomBadgeId}>{roomId}</Text>
          </View>
          <Pressable onPress={handleShareRoom} style={styles.shareIconBtn}>
            <Ionicons name="share-social" size={20} color="#FFF" />
          </Pressable>
        </View>

        <View style={styles.controlBar}>
          <Pressable style={[styles.controlBtn, isMuted && styles.controlBtnActive]} onPress={toggleMute}>
            <Ionicons name={isMuted ? "mic-off" : "mic"} size={24} color={isMuted ? "#FFF" : "#1F2937"} />
          </Pressable>
          <Pressable style={styles.endCallBtn} onPress={handleEndCall}><Ionicons name="call" size={28} color="#FFF" /></Pressable>
          <Pressable style={[styles.controlBtn, isCameraOff && styles.controlBtnActive]} onPress={toggleCamera}>
            <Ionicons name={isCameraOff ? "videocam-off" : "videocam"} size={24} color={isCameraOff ? "#FFF" : "#1F2937"} />
          </Pressable>
        </View>
      </View>
    );
  }

  // 4. MAIN SETUP (Fallback)
  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}><Ionicons name="arrow-back" size={24} color="#111827" /></Pressable>
          <Text style={styles.brandName}>lumino</Text>
          <View style={styles.placeholderRight} />
        </View>
        <View style={styles.heroContainer}>
          <View style={[styles.heroBackground, localStream && !isCameraOff && { padding: 0, overflow: 'hidden' }]}>
            {localStream && !isCameraOff ? (
              <RTCView streamURL={localStream.toURL()} style={styles.previewVideo} objectFit="cover" />
            ) : (
              <View style={styles.iconCircle}><Ionicons name="videocam" size={40} color="#4F46E5" /></View>
            )}
          </View>
        </View>
        <View style={styles.formContainer}>
          <Text style={styles.pageTitle}>Room Setup</Text>
          <Text style={styles.pageSubtitle}>Join an existing session or start a new one</Text>
          <Text style={styles.inputLabel}>Enter Room ID</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="key" size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Room ID" placeholderTextColor="#9CA3AF" value={inputRoomId} onChangeText={setInputRoomId} autoCapitalize="none" />
          </View>
          <Pressable style={[styles.primaryButton, !inputRoomId && styles.primaryButtonDisabled]} disabled={!inputRoomId} onPress={handleJoinCall}>
            <Ionicons name="log-in-outline" size={20} color="#FFFFFF" style={styles.btnIcon} />
            <Text style={styles.primaryButtonText}>Join Room</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContent: { flexGrow: 1, padding: 24, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 },
  backButton: { padding: 8, marginLeft: -8 },
  brandName: { fontSize: 22, fontWeight: 'bold', color: '#4F46E5', letterSpacing: -0.5 },
  placeholderRight: { width: 40 },
  heroContainer: { alignItems: 'center', marginBottom: 32 },
  heroBackground: { width: '100%', height: 180, backgroundColor: '#E0E7FF', borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  previewVideo: { width: '100%', height: '100%', borderRadius: 24 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', elevation: 5 },
  formContainer: { flex: 1 },
  pageTitle: { fontSize: 32, fontWeight: 'bold', color: '#111827', textAlign: 'center', marginBottom: 8 },
  pageSubtitle: { fontSize: 16, color: '#4B5563', textAlign: 'center', marginBottom: 32 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 16, paddingHorizontal: 16, height: 56, marginBottom: 24 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#111827' },
  primaryButton: { backgroundColor: '#4F46E5', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', height: 56, borderRadius: 28, marginBottom: 24, elevation: 4 },
  primaryButtonDisabled: { backgroundColor: '#A5B4FC' },
  btnIcon: { marginRight: 8 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },

  callingContainer: { flex: 1, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center' },
  blurredBg: { position: 'absolute', width: width, height: height, opacity: 0.4 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  callingContent: { alignItems: 'center', width: '100%' },
  avatarContainer: { width: 140, height: 140, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  pulseRing: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(79, 70, 229, 0.4)' },
  avatarMain: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  avatarText: { fontSize: 50, color: '#FFF', fontWeight: '800' },
  callingName: { fontSize: 28, fontWeight: '800', color: '#FFF', marginBottom: 10 },
  callingStatus: { fontSize: 16, color: 'rgba(255,255,255,0.7)', letterSpacing: 2 },

  callContainer: { flex: 1, backgroundColor: '#000' },
  remoteVideo: { flex: 1, width: width, height: height },
  remotePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1F2937' },
  waitingText: { color: '#9CA3AF', marginTop: 12, fontSize: 16 },
  localVideoWrapper: { position: 'absolute', top: 60, right: 20, width: 120, height: 180, borderRadius: 16, overflow: 'hidden', backgroundColor: '#374151', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
  localVideo: { width: '100%', height: '100%' },
  localPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  callHeader: { position: 'absolute', top: 60, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  roomBadge: { backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  roomBadgeLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: 'bold' },
  roomBadgeId: { fontSize: 12, color: '#FFF', fontWeight: 'bold' },
  shareIconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  controlBar: { position: 'absolute', bottom: 40, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', paddingVertical: 16, borderRadius: 30 },
  controlBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  controlBtnActive: { backgroundColor: '#EF4444' },
  endCallBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '135deg' }] },
  controlBarCalling: { position: 'absolute', bottom: 80, width: '100%', alignItems: 'center' },
  endCallBtnFull: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '135deg' }] },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#4B5563', fontWeight: '500' },
  cancelButton: { marginTop: 40, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 24, backgroundColor: '#E5E7EB' },
  cancelButtonText: { color: '#4B5563', fontWeight: 'bold' }
});
