import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useEffect, useState } from 'react';
import * as ExpoSplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';
import { firebase } from '@react-native-firebase/app';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { SplashScreen } from '@/components/splash-screen';

const firebaseConfig = {
  apiKey: "AIzaSyB1d0tISuiw55cKrkXhzyaIW4BGFYZ415o",
  appId: "1:618427604336:android:b84cd491409bd29a1943b5",
  projectId: "lumino-16c60",
  storageBucket: "lumino-16c60.firebasestorage.app",
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Prevent native splash auto-hide
ExpoSplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  // Initial route is onboarding
  initialRouteName: '(onboarding)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Hide native splash immediately since we are showing our custom splash
    ExpoSplashScreen.hideAsync().catch(() => {});
    
    // Timer for the premium custom splash
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return (
      <View style={{ flex: 1 }}>
        <SplashScreen />
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack initialRouteName="(onboarding)">
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="room" options={{ headerShown: false }} />
        <Stack.Screen name="call-summary" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
