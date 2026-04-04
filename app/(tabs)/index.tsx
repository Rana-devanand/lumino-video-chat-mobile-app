import React from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  const recentCalls = [
    {
      id: '1',
      name: 'David Miller',
      time: 'Yesterday, 8:45 PM',
      type: 'incoming',
      avatar: 'https://i.pravatar.cc/150?u=david',
    },
    {
      id: '2',
      name: 'Elena Rodriguez',
      time: 'Tuesday, 2:12 PM',
      type: 'missed',
      avatar: 'https://i.pravatar.cc/150?u=elena',
    },
    {
      id: '3',
      name: 'Marcus Chen',
      time: 'Oct 12, 11:30 AM',
      type: 'incoming',
      avatar: 'https://i.pravatar.cc/150?u=marcus',
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={{ uri: 'https://i.pravatar.cc/150?u=sarah' }} style={styles.avatar} />
          <Text style={styles.brandName}>Lumina</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <Pressable onPress={() => router.push('/settings')}>
            <Ionicons name="settings-outline" size={24} color="#4F46E5" />
          </Pressable>
          <Pressable>
            <Ionicons name="notifications" size={24} color="#4F46E5" />
          </Pressable>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
        <TextInput 
          placeholder="Search contacts or history..." 
          style={styles.searchInput}
          placeholderTextColor="#8E8E93"
        />
      </View>

      {/* Action Cards */}
    <View>
        <Pressable style={styles.primaryCard} onPress={() => router.push('/room')}>
        <View style={styles.iconContainerPrimary}>
          <Ionicons name="videocam" size={28} color="#FFFFFF" />
        </View>
        <Text style={styles.cardTitlePrimary}>Start New Call</Text>
        <Text style={styles.cardSubtitlePrimary}>Reach out to your inner circle instantly</Text>
      </Pressable>

      <Pressable style={styles.secondaryCard} onPress={() => router.push('/room')}>
        <View style={styles.iconContainerSecondary}>
          <Ionicons name="person-add" size={28} color="#4F46E5" />
        </View>
        <Text style={styles.cardTitleSecondary}>Join Room</Text>
        <Text style={styles.cardSubtitleSecondary}>Enter a code to jump into a live chat</Text>
      </Pressable>
    </View>

      {/* Recent Calls */}
      <View style={styles.recentSectionHeader}>
        <Text style={styles.recentTitle}>Recent Calls</Text>
        <Pressable onPress={() => router.push('/(tabs)/history')}>
          <Text style={styles.viewAllText}>View All</Text>
        </Pressable>
      </View>

      <View style={styles.recentList}>
        {recentCalls.map((call) => (
          <View key={call.id} style={styles.recentCallItem}>
            <Image source={{ uri: call.avatar }} style={styles.callAvatar} />
            <View style={styles.callDetails}>
              <Text style={styles.callName}>{call.name}</Text>
              <View style={styles.callMeta}>
                {call.type === 'incoming' && <Ionicons name="arrow-down" size={14} color="#4F46E5" />}
                {call.type === 'missed' && <Ionicons name="arrow-down" size={14} color="#E02424" />}
                <Text style={styles.callTime}>{call.time}</Text>
              </View>
            </View>
            <View style={styles.callAction}>
               <Ionicons name="videocam" size={24} color="#4B5563" />
            </View>
          </View>
        ))}
      </View>
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
    paddingTop: 60, // Adjust for safe area
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  brandName: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#4F46E5',
    letterSpacing: -0.5,
  },
  greeting: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 50,
    marginBottom: 32,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  primaryCard: {
    backgroundColor: '#4F46E5',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainerPrimary: {
    width: 56,
    height: 56,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitlePrimary: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  cardSubtitlePrimary: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  secondaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 36,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  iconContainerSecondary: {
    width: 56,
    height: 56,
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitleSecondary: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  cardSubtitleSecondary: {
    fontSize: 14,
    color: '#6B7280',
  },
  recentSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
  },
  recentList: {
    gap: 16,
  },
  recentCallItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 2,
  },
  callAvatar: {
    width: 50,
    height: 50,
    borderRadius: 12,
    marginRight: 16,
  },
  callDetails: {
    flex: 1,
  },
  callName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  callMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  callTime: {
    fontSize: 13,
    color: '#6B7280',
  },
  callAction: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  }
});
