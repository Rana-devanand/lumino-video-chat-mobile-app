import React, { useState, useEffect } from 'react';
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
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { RTCView } from 'react-native-webrtc';
import { useWebRTC } from '../hooks/useWebRTC';

const { width, height } = Dimensions.get('window');

export default function RoomScreen() {
  const router = useRouter();
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

  // Initial media setup when component mounts
  useEffect(() => {
    setupMediaStream();
  }, []);

  const handleStartCall = async () => {
    const newId = await startCall();
    if (!newId) {
      Alert.alert('Error', 'Failed to create a new room.');
    }
  };

  const handleJoinCall = async () => {
    if (!inputRoomId) return;
    const success = await joinCall(inputRoomId);
    if (!success) {
      Alert.alert('Error', 'Room not found or invalid.');
    }
  };

  const handleEndCall = () => {
    endCall();
    // After callback, status returns to idle
  };

  const handleShareRoom = async () => {
    if (!roomId) return;
    try {
      await Share.share({
        message: `Join my Lumina Video Call! Room ID: ${roomId}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = isCameraOff;
      });
      setIsCameraOff(!isCameraOff);
    }
  };

  // --- RENDERING ---

  // 1. Loading / Connecting State UI
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

  // 2. Active Call UI
  if (callStatus === 'connected' || (callStatus === 'idle' && roomId)) {
    return (
      <View style={styles.callContainer}>
        {/* Remote Video (Background) */}
        {remoteStream ? (
          <RTCView
            streamURL={remoteStream.toURL()}
            style={styles.remoteVideo}
            objectFit="cover"
          />
        ) : (
          <View style={styles.remotePlaceholder}>
            <ActivityIndicator color="#FFF" />
            <Text style={styles.waitingText}>Waiting for participant...</Text>
          </View>
        )}

        {/* Local Video Overlay (PiP) */}
        <View style={styles.localVideoWrapper}>
          {localStream && !isCameraOff ? (
            <RTCView
              streamURL={localStream.toURL()}
              style={styles.localVideo}
              objectFit="cover"
              zOrder={1}
            />
          ) : (
            <View style={styles.localPlaceholder}>
              <Ionicons name="videocam-off" size={24} color="#6B7280" />
            </View>
          )}
        </View>

        {/* Top Bar (Call Info) */}
        <View style={styles.callHeader}>
          <View style={styles.roomBadge}>
            <Text style={styles.roomBadgeLabel}>ROOM ID</Text>
            <Text style={styles.roomBadgeId}>{roomId}</Text>
          </View>
          <Pressable onPress={handleShareRoom} style={styles.shareIconBtn}>
            <Ionicons name="share-social" size={20} color="#FFF" />
          </Pressable>
        </View>

        {/* Bottom Control Bar */}
        <View style={styles.controlBar}>
          <Pressable 
            style={[styles.controlBtn, isMuted && styles.controlBtnActive]} 
            onPress={toggleMute}
          >
            <Ionicons name={isMuted ? "mic-off" : "mic"} size={24} color={isMuted ? "#FFF" : "#1F2937"} />
          </Pressable>

          <Pressable style={styles.endCallBtn} onPress={handleEndCall}>
            <Ionicons name="call" size={28} color="#FFF" />
          </Pressable>

          <Pressable 
            style={[styles.controlBtn, isCameraOff && styles.controlBtnActive]} 
            onPress={toggleCamera}
          >
            <Ionicons name={isCameraOff ? "videocam-off" : "videocam"} size={24} color={isCameraOff ? "#FFF" : "#1F2937"} />
          </Pressable>
        </View>
      </View>
    );
  }

  // 3. Main Setup UI (Default)
  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </Pressable>
          <Text style={styles.brandName}>Lumina</Text>
          <View style={styles.placeholderRight} />
        </View>

        {/* Video Preview Section */}
        <View style={styles.heroContainer}>
          <View style={[styles.heroBackground, localStream && !isCameraOff && { padding: 0, overflow: 'hidden' }]}>
            {localStream && !isCameraOff ? (
              <RTCView
                streamURL={localStream.toURL()}
                style={styles.previewVideo}
                objectFit="cover"
              />
            ) : (
              <View style={styles.iconCircle}>
                <Ionicons name="videocam" size={40} color="#4F46E5" />
              </View>
            )}
          </View>
        </View>

        {/* Form Section */}
        <View style={styles.formContainer}>
          <Text style={styles.pageTitle}>Room Setup</Text>
          <Text style={styles.pageSubtitle}>Join an existing session or start a new one</Text>

          <Text style={styles.inputLabel}>Enter Room ID</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="key" size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput 
              style={styles.input}
              placeholder="e.g. 550e8400-e29b-..."
              placeholderTextColor="#9CA3AF"
              value={inputRoomId}
              onChangeText={setInputRoomId}
              autoCapitalize="none"
            />
          </View>

          <Pressable 
            style={[styles.primaryButton, !inputRoomId && styles.primaryButtonDisabled]}
            disabled={!inputRoomId}
            onPress={handleJoinCall}
          >
            <Ionicons name="log-in-outline" size={20} color="#FFFFFF" style={styles.btnIcon} />
            <Text style={styles.primaryButtonText}>Join Room</Text>
          </Pressable>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable style={styles.secondaryButton} onPress={handleStartCall}>
            <Ionicons name="add-circle" size={20} color="#4F46E5" style={styles.btnIcon} />
            <Text style={styles.secondaryButtonText}>Create New Room</Text>
          </Pressable>
        </View>

        {/* Footer */}
        <View style={styles.footerContainer}>
          <View style={styles.privacyHeader}>
            <Ionicons name="shield-checkmark" size={16} color="#4F46E5" />
            <Text style={styles.privacyTitle}>PRIVACY FIRST</Text>
          </View>
          <Text style={styles.privacyText}>
            Lumina uses end-to-end encryption for every room. Your conversations and data remain yours, always.
          </Text>
          <Ionicons name="lock-closed" size={100} color="#F3F4F6" style={styles.footerBgIcon} />
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  brandName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4F46E5',
    letterSpacing: -0.5,
  },
  placeholderRight: {
    width: 40,
  },
  heroContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  heroBackground: {
    width: '100%',
    height: 180,
    backgroundColor: '#E0E7FF',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewVideo: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  formContainer: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 24,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  primaryButton: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 56,
    borderRadius: 28,
    marginBottom: 24,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonDisabled: {
    backgroundColor: '#A5B4FC',
    shadowOpacity: 0,
    elevation: 0,
  },
  btnIcon: {
    marginRight: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 1,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: '#4F46E5',
    marginBottom: 40,
  },
  secondaryButtonText: {
    color: '#4F46E5',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  privacyTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4F46E5',
    letterSpacing: 1,
    marginLeft: 6,
  },
  privacyText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    width: '80%',
    zIndex: 1,
  },
  footerBgIcon: {
    position: 'absolute',
    right: -20,
    bottom: -30,
    opacity: 0.5,
    zIndex: 0,
  },

  // --- Call Layout ---
  callContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  remoteVideo: {
    flex: 1,
    width: width,
    height: height,
  },
  remotePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1F2937',
  },
  waitingText: {
    color: '#9CA3AF',
    marginTop: 12,
    fontSize: 16,
  },
  localVideoWrapper: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 120,
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#374151',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  localVideo: {
    width: '100%',
    height: '100%',
  },
  localPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callHeader: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomBadge: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  roomBadgeLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: 'bold',
  },
  roomBadgeId: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: 'bold',
  },
  shareIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlBar: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 16,
  },
  controlBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlBtnActive: {
    backgroundColor: '#EF4444',
  },
  endCallBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '135deg' }],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#4B5563',
    fontWeight: '500',
  },
  cancelButton: {
    marginTop: 40,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#E5E7EB',
  },
  cancelButtonText: {
    color: '#4B5563',
    fontWeight: 'bold',
  }
});
