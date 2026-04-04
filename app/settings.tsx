import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const router = useRouter();
  
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
        { id: 'about', icon: 'information-circle-outline', title: 'About Lumina', color: '#6B7280' },
      ],
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.pageTitle}>Settings</Text>
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <Image source={{ uri: 'https://i.pravatar.cc/150?u=sarah' }} style={styles.profileAvatar} />
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>Sarah Miller</Text>
          <Text style={styles.profileEmail}>sarah.m@example.com</Text>
        </View>
        <Pressable style={styles.editButton}>
          <Text style={styles.editButtonText}>EDIT</Text>
        </Pressable>
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
      <Pressable style={styles.logoutButton}>
        <Ionicons name="log-out-outline" size={20} color="#E02424" />
        <Text style={styles.logoutText}>Log Out</Text>
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
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
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
