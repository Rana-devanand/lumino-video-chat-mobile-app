import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HistoryScreen() {
  const recentHistories = [
    {
      id: '1',
      name: 'Alex Johnson',
      type: 'missed',
      time: 'Today, 2:30 PM',
      avatar: 'https://i.pravatar.cc/150?u=alexj',
    },
    {
      id: '2',
      name: 'Maria Garcia',
      type: 'incoming',
      time: 'Today, 11:15 AM',
      avatar: 'https://i.pravatar.cc/150?u=mariag',
    },
  ];

  const yesterdayHistories = [
    {
      id: '3',
      name: 'David Chen',
      type: 'outgoing',
      time: 'Yesterday, 4:45 PM',
      avatar: 'https://i.pravatar.cc/150?u=davidchen2',
    },
    {
      id: '4',
      name: 'Sarah Miller',
      type: 'missed',
      time: 'Yesterday, 9:20 AM',
      avatar: 'https://i.pravatar.cc/150?u=sarahm',
    },
  ];

  const renderHitstoryItem = (item: any) => (
    <View key={item.id} style={styles.historyItem}>
      <View style={styles.avatarContainer}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        <View style={[
          styles.typeBadge,
          item.type === 'missed' ? styles.badgeMissed :
            item.type === 'incoming' ? styles.badgeIncoming : styles.badgeOutgoing
        ]}>
          <Ionicons
            name={item.type === 'outgoing' ? 'arrow-up' : 'arrow-down'}
            size={12}
            color="#FFFFFF"
          />
        </View>
      </View>

      <View style={styles.historyDetails}>
        <Text style={styles.historyName}>{item.name}</Text>
        <View style={styles.historyMeta}>
          <Text style={[
            styles.historyType,
            item.type === 'missed' ? { color: '#E02424' } : null
          ]}>
            {item.type === 'missed' ? 'Missed Call' : item.type === 'incoming' ? 'Incoming' : 'Outgoing'}
          </Text>
          <Text style={styles.historyDot}> • </Text>
          <Text style={styles.historyTime}>{item.time}</Text>
        </View>
      </View>

      <Pressable style={styles.actionButton}>
        <Ionicons name="videocam" size={20} color="#4F46E5" />
      </Pressable>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={{ uri: 'https://i.pravatar.cc/150?u=sarah' }} style={styles.userAvatar} />
          <Text style={styles.brandName}>lumino</Text>
        </View>
        <Ionicons name="notifications" size={24} color="#4F46E5" />
      </View>

      <Text style={styles.pageTitle}>Call History</Text>
      <Text style={styles.pageSubtitle}>Review your recent activity and connections.</Text>

      {/* RECENT Section */}
      <Text style={styles.sectionHeader}>RECENT</Text>
      <View style={styles.listContainer}>
        {recentHistories.map(renderHitstoryItem)}
      </View>

      {/* YESTERDAY Section */}
      <Text style={styles.sectionHeader}>YESTERDAY</Text>
      <View style={styles.listContainer}>
        {yesterdayHistories.map(renderHitstoryItem)}
      </View>

      {/* Video Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Video Summary</Text>
        <Text style={styles.summaryText}>
          You spent 4.5 hours in calls this week. Keep up the high-quality connections!
        </Text>

        <Pressable style={styles.summaryButton}>
          <Text style={styles.summaryButtonText}>VIEW ANALYTICS</Text>
        </Pressable>

        <View style={styles.summaryFooter}>
          <Image source={{ uri: 'https://i.pravatar.cc/150?img=1' }} style={styles.stackedAvatar} />
          <Image source={{ uri: 'https://i.pravatar.cc/150?img=2' }} style={[styles.stackedAvatar, { marginLeft: -10 }]} />
          <View style={styles.moreAvatarBadge}>
            <Text style={styles.moreAvatarText}>+12</Text>
          </View>
        </View>
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
    paddingTop: 60,
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
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  brandName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4F46E5',
    letterSpacing: -0.5,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4F46E5',
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 8,
  },
  listContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    marginBottom: 24,
    gap: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 16,
  },
  typeBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeMissed: {
    backgroundColor: '#E02424',
  },
  badgeIncoming: {
    backgroundColor: '#4F46E5',
  },
  badgeOutgoing: {
    backgroundColor: '#4B5563',
  },
  historyDetails: {
    flex: 1,
  },
  historyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  historyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyType: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  historyDot: {
    fontSize: 13,
    color: '#D1D5DB',
  },
  historyTime: {
    fontSize: 13,
    color: '#6B7280',
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCard: {
    backgroundColor: '#4F46E5',
    borderRadius: 24,
    padding: 24,
    marginTop: 8,
    marginBottom: 40,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 15,
    color: '#E0E7FF',
    lineHeight: 22,
    marginBottom: 24,
  },
  summaryButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  summaryButtonText: {
    color: '#4F46E5',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  summaryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stackedAvatar: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4F46E5',
  },
  moreAvatarBadge: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  moreAvatarText: {
    color: '#4F46E5',
    fontWeight: 'bold',
    fontSize: 15,
  }
});
