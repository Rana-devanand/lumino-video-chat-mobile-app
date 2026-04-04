import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useEffect, useState } from 'react';
import * as ExpoSplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { firebase } from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth'; 
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/utils/supabase';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { SplashScreen } from '@/components/splash-screen';
import { videoCallService, VideoRoom } from '@/services/videoCallService';
import { authService } from '@/services/authService';
import { soundService } from '@/services/soundService';
import { presenceService } from '@/services/presenceService';

const firebaseConfig = {
  apiKey: "AIzaSyB1d0tISuiw55cKrkXhzyaIW4BGFYZ415o",
  appId: "1:618427604336:android:b84cd491409bd29a1943b5",
  projectId: "lumino-16c60",
  storageBucket: "lumino-16c60.firebasestorage.app",
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

ExpoSplashScreen.preventAutoHideAsync();

// --- Global Incoming Call Overlay ---
const IncomingCallOverlay = ({ room, onAccept, onDecline }: 
  { room: VideoRoom, onAccept: () => void, onDecline: () => void }) => {
  const [callerName, setCallerName] = useState('Lumina User');

  useEffect(() => {
    const fetchCaller = async () => {
      const profile = await authService.getProfile(room.host_id);
      if (profile?.full_name) setCallerName(profile.full_name);
    };
    fetchCaller();
    soundService.playRingtone();
    return () => { soundService.stopAll(); };
  }, [room.host_id]);

  return (
    <View style={styles.overlayContainer}>
      <View style={styles.overlayCard}>
        <View style={styles.callerAvatar}>
          <Text style={styles.avatarTextInitial}>{callerName[0]}</Text>
        </View>
        <Text style={styles.incomingTitle}>Incoming Video Call</Text>
        <Text style={styles.callerNameText}>{callerName}</Text>
        
        <View style={styles.actionRow}>
          <Pressable style={[styles.actionBtn, styles.declineBtn]} onPress={onDecline}>
            <Ionicons name="call" size={28} color="#FFF" style={{ transform: [{ rotate: '135deg' }] }} />
          </Pressable>
          <Pressable style={[styles.actionBtn, styles.acceptBtn]} onPress={onAccept}>
            <Ionicons name="videocam" size={28} color="#FFF" />
          </Pressable>
        </View>
      </View>
    </View>
  );
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [incomingCall, setIncomingCall] = useState<VideoRoom | null>(null);

  // 1. Auth State Monitoring
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((user) => {
      console.log('[RootLayout] Auth State Changed:', user ? 'Logged In' : 'Logged Out');
      setIsAuthenticated(!!user);
      setTimeout(() => setShowSplash(false), 2000);
    });
    return unsubscribe;
  }, []);

  // 2. Global Call Listener
  useEffect(() => {
    if (!isAuthenticated) return;

    const user = authService.getCurrentUser();
    if (!user) return;

    const subscription = videoCallService.listenForIncomingCalls(user.uid, (room) => {
      console.log('[RootLayout] New Incoming Call detected:', room.id);
      setIncomingCall(room);
    });

    return () => {
      videoCallService.removeChannel(subscription);
    };
  }, [isAuthenticated]);

  // 3. Global Presence Tracker
  useEffect(() => {
    if (!isAuthenticated) return;

    const user = authService.getCurrentUser();
    if (!user) return;

    const channel = presenceService.trackPresence(user.uid);
    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated]);

  // 4. Navigation logic
  useEffect(() => {
    if (isAuthenticated === null) return; 
    if (isAuthenticated) {
      router.replace('/(tabs)');
    } else {
      router.replace('/(onboarding)');
    }
  }, [isAuthenticated]);

  const handleAcceptCall = () => {
    if (!incomingCall) return;
    const roomId = incomingCall.id;
    const hostId = incomingCall.host_id;
    setIncomingCall(null);
    soundService.stopAll();
    router.push({
      pathname: '/room',
      params: { directRoomId: roomId, mode: 'callee', contactId: hostId }
    });
  };

  const handleDeclineCall = async () => {
    if (!incomingCall) return;
    await videoCallService.rejectCall(incomingCall.id);
    setIncomingCall(null);
    soundService.stopAll();
  };

  // 4. Deep Linking
  const url = Linking.useURL();
  useEffect(() => {
    if (url) {
      const { queryParams } = Linking.parse(url);
      if (queryParams?.referrer) {
        const rid = String(queryParams.referrer);
        AsyncStorage.setItem('referrerId', rid);
      }
    }
  }, [url]);

  useEffect(() => {
    ExpoSplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <View style={{ flex: 1 }}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="room" />
            <Stack.Screen name="chat/[contactId]" />
            <Stack.Screen name="call-summary" />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>

          {/* Incoming Call UI Overlay */}
          {incomingCall && (
            <IncomingCallOverlay 
              room={incomingCall} 
              onAccept={handleAcceptCall} 
              onDecline={handleDeclineCall} 
            />
          )}

          {/* Premium Splash Overlay (Absolute) */}
          {(showSplash || isAuthenticated === null) && (
            <View style={[StyleSheet.absoluteFill, { zIndex: 999 }]}>
              <SplashScreen />
            </View>
          )}
        </View>
        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    zIndex: 2000,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  overlayCard: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 32,
    padding: 30,
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  callerAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarTextInitial: { fontSize: 40, color: '#FFF', fontWeight: 'bold' },
  incomingTitle: { fontSize: 14, color: '#6B7280', fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 5 },
  callerNameText: { fontSize: 26, fontWeight: '800', color: '#111827', marginBottom: 30 },
  actionRow: { flexDirection: 'row', gap: 30 },
  actionBtn: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  acceptBtn: { backgroundColor: '#10B981' },
  declineBtn: { backgroundColor: '#EF4444' },
});



