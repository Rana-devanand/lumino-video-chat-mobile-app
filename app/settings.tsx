import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Image, Alert, StatusBar } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { authService } from '@/services/authService';
import { useGetProfileQuery, useUpdateAvatarMutation } from '@/services/api';

export default function SettingsScreen() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // RTK Query hooks
  const { data: profile, isLoading: loading } = useGetProfileQuery(userId || '', { skip: !userId });
  const [updateAvatar, { isLoading: isUploading }] = useUpdateAvatarMutation();

  useEffect(() => {
    const fetchUser = async () => {
      const user = await authService.getCurrentUser();
      if (user) setUserId(user.id);
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    try {
      setIsLoggingOut(true);
      await authService.signOut();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout failed:', error);
      Alert.alert('Logout Error', 'Unable to sign out. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const pickImage = async () => {
    if (!profile) return;
    
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    console.log(`[Settings] Media library permission status: ${status}`);
    if (status !== 'granted') {
      Alert.alert(
        'Permission Denied',
        'Sorry, we need camera roll permissions to update your profile picture. Please enable them in your device settings.',
        [{ text: 'OK' }]
      );
      return;
    }

    console.log('[Settings] Launching image library...');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      try {
        console.log(`[Settings] Uploading image: ${result.assets[0].uri}`);
        const newUrl = await authService.uploadAvatar(profile.id, result.assets[0].uri);
        
        // Update via mutation to trigger cache invalidation
        await updateAvatar({ userId: profile.id, publicUrl: newUrl }).unwrap();
        
        Alert.alert('Success', 'Profile picture updated successfully');
      } catch (error: any) {
        Alert.alert('Upload Failed', error.message || 'Failed to upload profile picture. Please try again.');
        console.error('[Settings] uploadAvatar error:', error);
      }
    }
  };

  const sections = [
    {
      title: 'ACCOUNT',
      items: [
        { id: 'profile', icon: 'person-outline', title: 'Personal Information', color: '#4F46E5' },
        { id: 'privacy', icon: 'shield-checkmark-outline', title: 'Privacy & Security', color: '#10B981' },
      ],
    },
    {
      title: 'PREFERENCES',
      items: [
        { id: 'notifications', icon: 'notifications-outline', title: 'Notifications', color: '#F59E0B' },
        { id: 'audio', icon: 'mic-outline', title: 'Audio & Video', color: '#8B5CF6' },
        { id: 'theme', icon: 'color-palette-outline', title: 'Appearance', color: '#EC4899' },
      ],
    },
    {
      title: 'SUPPORT',
      items: [
        { id: 'help', icon: 'help-circle-outline', title: 'Help Center', color: '#6B7280' },
        { id: 'about', icon: 'information-circle-outline', title: 'About lumino', color: '#6B7280' },
      ],
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.pageTitle}>Settings</Text>
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        {loading ? (
          <ActivityIndicator size="small" color="#4F46E5" style={{ flex: 1 }} />
        ) : profile ? (
          <>
            <Pressable 
              style={styles.avatarContainer} 
              onPress={pickImage} 
              disabled={isUploading}
              hitSlop={15}
            >
              {profile.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
              ) : (
                <View style={styles.initialsAvatar}>
                  <Text style={styles.initialsText}>
                    {profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
              <View style={styles.editBadge}>
                {isUploading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Ionicons name="camera" size={14} color="#FFF" />
                )}
              </View>
            </Pressable>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile.full_name || 'Lumino User'}</Text>
              <Text style={styles.profileEmail}>{profile.email || profile.phone_number}</Text>
            </View>
            <Pressable 
              style={styles.editButton} 
              onPress={pickImage}
              hitSlop={10}
            >
              <Text style={styles.editButtonText}>{isUploading ? '...' : 'EDIT'}</Text>
            </Pressable>
          </>
        ) : (
          <Text style={styles.profileEmail}>Failed to load profile</Text>
        )}
      </View>

      {/* Settings Sections */}
      {sections.map((section, idx) => (
        <View key={idx} style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.sectionBlock}>
            {section.items.map((item, index) => (
                <Pressable
                  key={item.id}
                  style={[
                    styles.settingItem,
                    index < section.items.length - 1 && styles.settingItemBorder
                  ]}
                  onPress={() => {
                    if (item.id === 'profile') router.push('/profile-settings');
                  }}
                >
                <View style={[styles.iconWrapper, { backgroundColor: `${item.color}15` }]}>
                  <Ionicons name={item.icon as any} size={20} color={item.color} />
                </View>
                <Text style={styles.settingTitle}>{item.title}</Text>
                <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
              </Pressable>
            ))}
          </View>
        </View>
      ))}

      {/* Log Out Button */}
      <Pressable 
        style={[styles.logoutButton, isLoggingOut && { opacity: 0.7 }]} 
        onPress={handleLogout}
        disabled={isLoggingOut}
      >
        {isLoggingOut ? (
          <ActivityIndicator size="small" color="#E02424" />
        ) : (
          <>
            <Ionicons name="log-out-outline" size={20} color="#E02424" />
            <Text style={styles.logoutText}>Log Out</Text>
          </>
        )}
      </Pressable>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  contentContainer: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backBtn: {
    marginRight: 16,
    padding: 4,
    marginLeft: -4,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 32,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    minHeight: 100,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
  },
  initialsAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    backgroundColor: '#4F46E5',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  initialsText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  editButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4F46E5',
    letterSpacing: 1,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6B7280',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 8,
  },
  sectionBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 20,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingTitle: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 20,
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E02424',
  }
});
