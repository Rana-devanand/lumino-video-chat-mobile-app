import React from 'react';
import { View, Text, StyleSheet, Image, Pressable, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function StatusScreen() {
  const statuses = [
    {
      id: '1',
      name: 'Sarah Miller',
      time: '10 minutes ago',
      avatar: 'https://i.pravatar.cc/150?u=sarah',
      isMe: true,
    },
    {
      id: '2',
      name: 'David Chen',
      time: 'Today, 2:30 PM',
      avatar: 'https://i.pravatar.cc/150?u=davidchen',
      isMe: false,
    },
    {
      id: '3',
      name: 'Elena Rodriguez',
      time: 'Today, 10:15 AM',
      avatar: 'https://i.pravatar.cc/150?u=elena',
      isMe: false,
    },
  ];

  const renderStatus = ({ item }: { item: any }) => (
    <Pressable style={styles.statusItem}>
      <View style={styles.avatarContainer}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        {item.isMe && (
          <View style={styles.addBadge}>
            <Ionicons name="add" size={16} color="#FFFFFF" />
          </View>
        )}
      </View>
      <View style={styles.statusDetails}>
        <Text style={styles.statusName}>{item.isMe ? 'My Status' : item.name}</Text>
        <Text style={styles.statusTime}>{item.isMe ? 'Tap to add status update' : item.time}</Text>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Status</Text>
        <Pressable>
          <Ionicons name="camera-outline" size={24} color="#4F46E5" />
        </Pressable>
      </View>

      <FlatList
        data={statuses}
        keyExtractor={(item) => item.id}
        renderItem={renderStatus}
        contentContainerStyle={styles.listContainer}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  listContainer: {
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#4F46E5',
    padding: 2,
  },
  addBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  statusDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  statusName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  statusTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 100, // align with text
  }
});
