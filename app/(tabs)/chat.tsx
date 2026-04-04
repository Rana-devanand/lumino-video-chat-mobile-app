import { View, Text, StyleSheet, ScrollView, TextInput, Image, Pressable, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '@/services/authService';
import * as Linking from 'expo-linking';

export default function ChatScreen() {
  const handleInvite = async () => {
    const user = authService.getCurrentUser();
    if (!user) return;

    const inviteLink = Linking.createURL('login', {
      queryParams: { referrer: user.uid },
    });

    try {
      await Share.share({
        message: `Join me on Lumina! Use my link to connect with me for high-quality video calls: ${inviteLink}`,
        url: inviteLink, // iOS support
      });
    } catch (error) {
      console.error('Error sharing invitation:', error);
    }
  };

  const chats = [
    {
      id: '1',
      name: 'Sarah Miller',
      message: 'Hey, are we still on for the 3PM call?',
      time: '12:45 PM',
      unread: 2,
      avatar: 'https://i.pravatar.cc/150?u=sarah',
    },
    {
      id: '2',
      name: 'Design Team',
      message: 'Alex: The latest mocks are uploaded.',
      time: '11:20 AM',
      unread: 0,
      avatar: 'https://i.pravatar.cc/150?u=design',
    },
    {
      id: '3',
      name: 'David Chen',
      message: 'Thanks for the quick sync!',
      time: 'Yesterday',
      unread: 0,
      avatar: 'https://i.pravatar.cc/150?u=davidchen',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>
        <Pressable 
          onPress={handleInvite}
          style={({ pressed }) => [styles.inviteBadge, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="person-add-outline" size={18} color="#4F46E5" />
          <Text style={styles.inviteText}>Invite</Text>
        </Pressable>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainerWrapper}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
          <TextInput 
            placeholder="Search chats..." 
            style={styles.searchInput}
            placeholderTextColor="#8E8E93"
          />
        </View>
      </View>

      {/* Chat List */}
      <ScrollView style={styles.chatList}>
        {chats.map((chat) => (
          <Pressable key={chat.id} style={styles.chatItem}>
            <Image source={{ uri: chat.avatar }} style={styles.avatar} />
            <View style={styles.chatContent}>
              <View style={styles.chatHeader}>
                <Text style={styles.chatName}>{chat.name}</Text>
                <Text style={styles.chatTime}>{chat.time}</Text>
              </View>
              <View style={styles.chatFooter}>
                <Text style={styles.chatMessage} numberOfLines={1}>{chat.message}</Text>
                {chat.unread > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{chat.unread}</Text>
                  </View>
                )}
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      {/* Floating Action Button */}
      <Pressable style={styles.fab}>
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </Pressable>
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
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  inviteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  inviteText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4F46E5',
  },
  searchContainerWrapper: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  chatList: {
    flex: 1,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
  },
  chatContent: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  chatTime: {
    fontSize: 13,
    color: '#8E8E93',
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatMessage: {
    fontSize: 15,
    color: '#6B7280',
    flex: 1,
    paddingRight: 16,
  },
  unreadBadge: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  }
});
