import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authService } from '@/services/authService';
import { messageService, Conversation } from '@/services/messageService';

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7)  return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { day: '2-digit', month: 'short' });
}

function avatarColor(name: string) {
  const palette = ['#5B58F6','#7C3AED','#2563EB','#059669','#D97706','#DC2626','#DB2777'];
  const idx = (name.charCodeAt(0) || 0) % palette.length;
  return palette[idx];
}

export default function ChatScreen() {
  const router   = useRouter();
  const insets   = useSafeAreaInsets();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [searchQuery, setSearchQuery]     = useState('');

  // Reload every time this tab comes into focus (e.g. after returning from a chat)
  useFocusEffect(
    useCallback(() => { loadConversations(); }, [])
  );

  const loadConversations = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const user = authService.getCurrentUser();
      if (user) {
        const data = await messageService.getConversations(user.uid);
        setConversations(data);
      }
    } catch (e) {
      console.error('[ChatScreen] loadConversations error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filtered = conversations.filter(c =>
    c.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openChat = (conv: Conversation) => {
    router.push({
      pathname: `/chat/${conv.contact_id}`,
      params: { name: conv.full_name, avatar: conv.avatar_url || '' },
    });
  };

  const startCall = (conv: Conversation) => {
    router.push({
      pathname: '/room',
      params: { contactId: conv.contact_id, mode: 'caller', name: conv.full_name },
    });
  };

  // ── Row ─────────────────────────────────────────────────────────────────────
  const renderItem = ({ item }: { item: Conversation }) => {
    const initials  = (item.full_name || '?')[0].toUpperCase();
    const bgColor   = avatarColor(item.full_name || '');
    const hasUnread = item.unread_count > 0;

    return (
      <Pressable
        style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}
        onPress={() => openChat(item)}
        android_ripple={{ color: 'rgba(88,85,246,0.08)' }}
      >
        {/* Avatar */}
        <View style={[styles.avatar, { backgroundColor: bgColor }]}>
          <Text style={styles.avatarLetter}>{initials}</Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text style={styles.name} numberOfLines={1}>{item.full_name}</Text>
            <Text style={[styles.time, hasUnread && styles.timeUnread]}>
              {formatTime(item.last_message_at)}
            </Text>
          </View>
          <View style={styles.bottomRow}>
            {item.is_last_mine && (
              <Ionicons name="checkmark-done" size={14} color="#8B8FF8" style={{ marginRight: 3 }} />
            )}
            <Text
              style={[styles.preview, hasUnread && styles.previewUnread]}
              numberOfLines={1}
            >
              {item.last_message}
            </Text>
            {hasUnread ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {item.unread_count > 99 ? '99+' : item.unread_count}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Video call shortcut */}
        <Pressable
          hitSlop={10}
          onPress={() => startCall(item)}
          style={styles.callBtn}
        >
          <Ionicons name="videocam-outline" size={22} color="#5B58F6" />
        </Pressable>
      </Pressable>
    );
  };

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Messages</Text>
        <Pressable
          style={styles.newChatBtn}
          onPress={() => router.push('/(tabs)/contacts')}
          hitSlop={8}
        >
          <Ionicons name="create-outline" size={22} color="#5B58F6" />
        </Pressable>
      </View>

      {/* ── Search ── */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations…"
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </Pressable>
        )}
      </View>

      {/* ── List ── */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#5B58F6" />
        </View>
      ) : filtered.length > 0 ? (
        <FlatList
          data={filtered}
          keyExtractor={item => item.contact_id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadConversations(true)}
              tintColor="#5B58F6"
            />
          }
        />
      ) : (
        <View style={styles.center}>
          <Ionicons name="chatbubbles-outline" size={64} color="#E5E7EB" />
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No results found' : 'No conversations yet'}
          </Text>
          <Text style={styles.emptySub}>
            {searchQuery
              ? 'Try a different name'
              : 'Go to Contacts and start chatting!'}
          </Text>
          {!searchQuery && (
            <Pressable style={styles.goBtn} onPress={() => router.push('/(tabs)/contacts')}>
              <Text style={styles.goBtnText}>Open Contacts</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* ── FAB → New chat via contacts ── */}
      <Pressable
        style={[styles.fab, { bottom: insets.bottom + 100 }]}
        onPress={() => router.push('/(tabs)/contacts')}
      >
        <Ionicons name="chatbubble-ellipses" size={26} color="#FFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root:  { flex: 1, backgroundColor: '#F8F9FA' },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title:     { fontSize: 26, fontWeight: '800', color: '#111827' },
  newChatBtn: { padding: 4 },

  // Search
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#111827' },

  // Conversation row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarLetter: { color: '#FFF', fontSize: 20, fontWeight: '700' },

  content: { flex: 1 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name:       { fontSize: 16, fontWeight: '700', color: '#111827', flex: 1, marginRight: 6 },
  time:       { fontSize: 12, color: '#9CA3AF' },
  timeUnread: { color: '#5B58F6', fontWeight: '700' },

  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  preview:       { flex: 1, fontSize: 14, color: '#9CA3AF' },
  previewUnread: { color: '#374151', fontWeight: '600' },

  // Unread badge
  badge: {
    backgroundColor: '#5B58F6',
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    marginLeft: 6,
  },
  badgeText: { color: '#FFF', fontSize: 11, fontWeight: '800' },

  callBtn:  { padding: 8, marginLeft: 4 },

  // Empty
  center:     { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#4B5563', marginTop: 16, textAlign: 'center' },
  emptySub:   { fontSize: 14, color: '#9CA3AF', marginTop: 8, textAlign: 'center' },
  goBtn: {
    marginTop: 24,
    backgroundColor: '#5B58F6',
    paddingVertical: 13,
    paddingHorizontal: 28,
    borderRadius: 24,
  },
  goBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },

  // FAB
  fab: {
    position: 'absolute',
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#5B58F6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#5B58F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
});
