import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Platform,
  Pressable,
  ActivityIndicator,
  Keyboard,
  Animated,
  KeyboardEvent,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authService } from '@/services/authService';
import { messageService, ChatMessage } from '@/services/messageService';
import { presenceService, UserStatus } from '@/services/presenceService';

// ─── Theme ────────────────────────────────────────────────────────────────────
const THEME = {
  headerBg:       '#0F0C29',          // deep-space dark
  headerBorder:   'rgba(255,255,255,0.08)',
  bgGradientTop:  '#1A1035',          // rich dark purple
  bgGradientMid:  '#10162A',
  bgGradientBot:  '#0A0E1C',          // near-black navy

  // ↓ Deep teal‑navy — COMPLETELY different hue from the tick colors below
  myBubble:       '#1A3A5C',
  myBubbleBorder: 'rgba(100,180,255,0.18)',

  theirBubble:    'rgba(255,255,255,0.10)', // frosted glass
  theirBubbleBdr: 'rgba(255,255,255,0.14)',
  myText:         '#FFFFFF',
  theirText:      '#E8EAFF',
  tsMe:           'rgba(255,255,255,0.50)',
  tsThem:         'rgba(200,205,255,0.50)',

  // Ticks — completely different from the bubble colour
  seenGreen:      '#4ADE80',          // bright green = clearly SEEN  ✓✓
  deliveredWhite: 'rgba(255,255,255,0.40)', // faded white = delivered, not read

  inputBg:        'rgba(255,255,255,0.07)',
  inputBorder:    'rgba(255,255,255,0.13)',
  inputText:      '#FFFFFF',
  inputPlaceholder:'rgba(255,255,255,0.35)',
  iconTint:       '#A8A4FF',
  sendBtn:        '#5B58F6',
  sendBtnOff:     '#2E2B6B',
  online:         '#34D399',
  nameColor:      '#EDEAFF',
  statusColor:    '#34D399',
};

export default function ChatDetailScreen() {
  const router = useRouter();
  const { contactId, name } = useLocalSearchParams();
  const [messages, setMessages]   = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading]     = useState(true);
  const [sending, setSending]     = useState(false);
  const [contactStatus, setContactStatus] = useState<UserStatus>('offline');
  const flatListRef = useRef<FlatList>(null);
  const insets      = useSafeAreaInsets();
  const bottomPad   = useRef(new Animated.Value(0)).current;
  const currentUser = authService.getCurrentUser();

  // ── Keyboard push-up animation ────────────────────────────────────────────
  useEffect(() => {
    const show = (e: KeyboardEvent) => {
      Animated.timing(bottomPad, {
        toValue: e.endCoordinates.height,
        duration: Platform.OS === 'ios' ? e.duration || 250 : 220,
        useNativeDriver: false,
      }).start();
      // Keep a small timeout to ensure the inverted list adjusts its position
      setTimeout(() => flatListRef.current?.scrollToIndex({ index: 0, animated: true }), 100);
    };
    const hide = (e: KeyboardEvent) => {
      Animated.timing(bottomPad, {
        toValue: 0,
        duration: Platform.OS === 'ios' ? e.duration || 250 : 220,
        useNativeDriver: false,
      }).start();
    };
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const s1 = Keyboard.addListener(showEvt, show);
    const s2 = Keyboard.addListener(hideEvt, hide);
    return () => { s1.remove(); s2.remove(); };
  }, []);

  // ── Presence Subscription ────────────────────────────────────────────────
  useEffect(() => {
    if (!contactId) return;
    const unsubscribe = presenceService.subscribeToUserStatus(
      contactId as string,
      (status) => setContactStatus(status)
    );
    return unsubscribe;
  }, [contactId]);

  // ── Load + real-time subscriptions ────────────────────────────────────────
  useEffect(() => {
    loadChat();
    if (!currentUser) return;

    // Mark their messages as read the moment we open chat
    messageService.markMessagesAsRead(currentUser.uid, contactId as string);

    // New incoming messages
    const inCh = messageService.subscribeToMessages(currentUser.uid, (msg) => {
      if (msg.sender_id === contactId) {
        setMessages(prev => [...prev, msg]);
        messageService.markMessagesAsRead(currentUser.uid, contactId as string);
      }
    });

    // When receiver reads MY messages → flip is_read = true in local state
    const rcCh = messageService.subscribeToReadReceipts(currentUser.uid, (updated) => {
      setMessages(prev =>
        prev.map(m => m.id === updated.id ? { ...m, is_read: true } : m)
      );
    });

    return () => {
      messageService.removeChannel(inCh);
      messageService.removeChannel(rcCh);
    };
  }, [contactId]);

  const loadChat = async () => {
    try {
      if (currentUser) {
        const history = await messageService.getChatHistory(
          currentUser.uid, contactId as string
        );
        setMessages(history);
      }
    } catch (e) { console.error(e); }
    finally     { setLoading(false); }
  };

  const handleSend = async () => {
    if (!inputText.trim() || sending || !currentUser) return;
    setSending(true);
    try {
      const msg = await messageService.sendMessage(
        currentUser.uid, contactId as string, inputText.trim()
      );
      setMessages(prev => [...prev, msg]);
      setInputText('');
    } catch (e) { console.error(e); }
    finally     { setSending(false); }
  };

  // ── Read receipt ticks ─────────────────────────────────────────────────────
  // Two single-checkmark icons side by side:
  //   • Both green  = SEEN  (receiver read it)
  //   • Both white-grey = DELIVERED (sent, not read yet)
  const Ticks = ({ isRead }: { isRead: boolean }) => {
    const color = isRead ? THEME.seenGreen : THEME.deliveredWhite;
    return (
      <View style={styles.ticksRow}>
        {/* First tick */}
        <Ionicons name="checkmark" size={13} color={color} />
        {/* Second tick — offset left to overlap like real double-tick */}
        <Ionicons name="checkmark" size={13} color={color} style={{ marginLeft: -6 }} />
      </View>
    );
  };

  // ── Render one message ─────────────────────────────────────────────────────
  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMe = item.sender_id !== contactId;
    return (
      <View style={[styles.row, isMe ? styles.rowRight : styles.rowLeft]}>
        <View style={[
          styles.bubble,
          isMe   ? styles.myBubble   : styles.theirBubble,
        ]}>
          <Text style={[
            styles.msgText,
            isMe ? styles.myMsgText : styles.theirMsgText,
          ]}>
            {item.content}
          </Text>
          <View style={styles.footer}>
            <Text style={[
              styles.ts,
              isMe ? styles.tsMe : styles.tsThem,
            ]}>
              {new Date(item.created_at).toLocaleTimeString([], {
                hour: '2-digit', minute: '2-digit',
              })}
            </Text>
            {isMe && <Ticks isRead={item.is_read} />}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

      {/* ── Dark Header ──────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </Pressable>

        {/* Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarLetter}>{String(name)?.[0]?.toUpperCase() || '?'}</Text>
          {/* Online dot */}
          <View style={[
            styles.onlineDot,
            { backgroundColor: contactStatus === 'online' ? THEME.online : '#9CA3AF' }
          ]} />
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{name}</Text>
          <Text style={[
            styles.headerSub,
            { color: contactStatus === 'online' ? THEME.statusColor : '#9CA3AF' }
          ]}>
            {contactStatus.charAt(0).toUpperCase() + contactStatus.slice(1)}
          </Text>
        </View>

        {/* Actions — no background, just icon tint */}
        <View style={styles.headerActions}>
          <Pressable hitSlop={10} style={styles.headerIcon}>
            <Ionicons name="call-outline" size={21} color={THEME.iconTint} />
          </Pressable>
          <Pressable
            hitSlop={10}
            style={styles.headerIcon}
            onPress={() => router.push({
              pathname: '/room',
              params: { contactId, mode: 'caller', name },
            })}
          >
            <Ionicons name="videocam-outline" size={23} color={THEME.iconTint} />
          </Pressable>
          <Pressable hitSlop={10} style={styles.headerIcon}>
            <Ionicons name="ellipsis-vertical" size={21} color={THEME.iconTint} />
          </Pressable>
        </View>
      </View>

      {/* ── Dark Gradient Background + Messages ─────────────────── */}
      <LinearGradient
        colors={[THEME.bgGradientTop, THEME.bgGradientMid, THEME.bgGradientBot]}
        locations={[0, 0.5, 1]}
        style={styles.gradientFill}
      >
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator color={THEME.iconTint} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={[...messages].reverse()}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            inverted
          />
        )}
      </LinearGradient>

      {/* ── Input Bar ───────────────────────────────────────────── */}
      <Animated.View style={[styles.inputWrapper, { paddingBottom: bottomPad }]}>
        <LinearGradient
          colors={[THEME.bgGradientMid, THEME.bgGradientBot]}
          style={styles.inputGrad}
        >
          <View style={[
            styles.inputInner,
            { paddingBottom: Math.max(insets.bottom, 10) },
          ]}>
            <View style={styles.inputBox}>
              <Pressable hitSlop={8} style={styles.emojiBtn}>
                <Ionicons name="happy-outline" size={22} color={THEME.inputPlaceholder} />
              </Pressable>

              <TextInput
                style={styles.textInput}
                placeholder="Message..."
                placeholderTextColor={THEME.inputPlaceholder}
                value={inputText}
                onChangeText={setInputText}
                multiline
                selectionColor={THEME.iconTint}
              />

              <Pressable
                style={[
                  styles.sendBtn,
                  !inputText.trim() && styles.sendBtnOff,
                ]}
                onPress={handleSend}
                disabled={!inputText.trim() || sending}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Ionicons name="send" size={16} color="#FFF" />
                )}
              </Pressable>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: THEME.bgGradientBot },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 14,
    backgroundColor: THEME.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: THEME.headerBorder,
    // Subtle bottom shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  backBtn: { padding: 4, marginRight: 6 },

  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#322B80',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 10,
    borderWidth: 1.5, borderColor: 'rgba(160,156,255,0.35)',
  },
  avatarLetter: { color: '#C8C4FF', fontWeight: '700', fontSize: 16 },
  onlineDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: 11, height: 11, borderRadius: 6,
    backgroundColor: THEME.online,
    borderWidth: 2, borderColor: THEME.headerBg,
  },

  headerInfo: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: '700', color: THEME.nameColor },
  headerSub:  { fontSize: 12, color: THEME.statusColor, fontWeight: '600', marginTop: 1 },

  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  headerIcon: { padding: 9 },

  // ── Gradient fill ────────────────────────────────────────────────────────────
  gradientFill: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: 14, paddingVertical: 14 },

  // ── Bubbles ──────────────────────────────────────────────────────────────────
  row:      { marginBottom: 6 },
  rowRight: { alignItems: 'flex-end' },
  rowLeft:  { alignItems: 'flex-start' },

  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14, paddingTop: 10, paddingBottom: 7,
    borderRadius: 20,
    // Shared subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  myBubble: {
    backgroundColor: THEME.myBubble,
    borderBottomRightRadius: 4,
    borderWidth: 1,
    borderColor: THEME.myBubbleBorder,
  },
  theirBubble: {
    backgroundColor: THEME.theirBubble,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: THEME.theirBubbleBdr,
  },

  msgText:    { fontSize: 15, lineHeight: 21 },
  myMsgText:  { color: THEME.myText },
  theirMsgText: { color: THEME.theirText },

  footer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end',
    marginTop: 4,
  },
  ts:     { fontSize: 10 },
  tsMe:   { color: THEME.tsMe },
  tsThem: { color: THEME.tsThem },
  // Two-tick row
  ticksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },

  // ── Input bar ────────────────────────────────────────────────────────────────
  inputWrapper:  { backgroundColor: THEME.bgGradientBot },
  inputGrad:     {},
  inputInner:    { paddingHorizontal: 12, paddingTop: 10 },
  inputBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: THEME.inputBg,
    borderRadius: 30,
    borderWidth: 1, borderColor: THEME.inputBorder,
    paddingHorizontal: 4, paddingVertical: 4,
  },
  emojiBtn: { padding: 8 },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: THEME.inputText,
    maxHeight: 120,
    paddingVertical: 6, paddingHorizontal: 4,
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: THEME.sendBtn,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 2,
    shadowColor: THEME.sendBtn,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
  sendBtnOff: {
    backgroundColor: THEME.sendBtnOff,
    shadowOpacity: 0,
    elevation: 0,
  },
});
