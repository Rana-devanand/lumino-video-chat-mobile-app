import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import * as Contacts from 'expo-contacts';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { contactService } from '@/services/contactService';
import { authService } from '@/services/authService';
import { sharingService } from '@/services/sharingService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGetContactsQuery } from '@/services/api';
import { Image } from 'react-native';

export default function ContactsListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [userId, setUserId] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Contacts.Contact[]>([]);
  const [localLoading, setLocalLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // RTK Query hook for registered contacts
  const { data: registeredContacts = [], isLoading: contactsLoading, refetch } = useGetContactsQuery(userId || '', { skip: !userId });

  // Modal State
  const [isModalVisible, setModalVisible] = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const user = await authService.getCurrentUser();
      if (user) setUserId(user.id);
    };
    fetchUser();
    loadContacts();
  }, []);

  const loadContacts = async () => {
    setLocalLoading(true);
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.Emails, Contacts.Fields.PhoneNumbers],
        });

        if (data.length > 0) {
          setContacts(data);
          // Trigger a manual refetch via RTK Query if we found new local contacts
          // (In a full implementation, we'd have a sync mutation)
          refetch();
        }
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLocalLoading(false);
    }
  };

  const loading = contactsLoading || localLoading;


  const handleCall = (contact: any) => {
    router.push({
      pathname: '/room',
      params: { contactId: contact.id, mode: 'caller', name: contact.full_name }
    });
  };

  const handleChat = (contact: any) => {
    router.push({
      pathname: '/chat/[contactId]',
      params: { contactId: contact.id, name: contact.full_name, avatar: contact.avatar_url || '' }
    });
  };


  const handleInvite = async () => {
    try {
      const url = await sharingService.getInviteUrl();
      setInviteUrl(url);
      setModalVisible(true);
      setCopied(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to generate invite link');
    }
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(inviteUrl);
    setCopied(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSocialShare = async () => {
    try {
      await sharingService.shareInvite();
    } catch (error) {
      console.error('[ContactsScreen] Social share failed:', error);
    }
  };

  const filteredContacts = registeredContacts.filter((c) =>
    c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone_number?.includes(searchQuery)
  );

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.contactItem}>
      <View style={styles.avatarContainer}>
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{item.full_name?.[0]?.toUpperCase() || '?'}</Text>
          </View>
        )}
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.full_name}</Text>
        <Text style={styles.contactPhone}>{item.phone_number}</Text>
      </View>
      <TouchableOpacity style={[styles.actionBtn, styles.chatBtn]} onPress={() => handleChat(item)}>
        <Ionicons name="chatbubble-ellipses" size={18} color="#4440EB" />
      </TouchableOpacity>
      <TouchableOpacity style={[styles.actionBtn, styles.callButton]} onPress={() => handleCall(item)}>
        <Ionicons name="videocam" size={18} color="#FFF" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header with Back Button */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.title}>All Contacts</Text>
        </View>
        <TouchableOpacity onPress={loadContacts}>
          <Ionicons name="refresh" size={22} color="#4440EB" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9BA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search registered contacts..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4440EB" />
        </View>
      ) : filteredContacts.length > 0 ? (
        <FlatList
          data={filteredContacts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.centerContainer}>
          <Ionicons name="people-outline" size={64} color="#E5E7EB" />
          <Text style={styles.emptyText}>No registered contacts found</Text>
          <Text style={styles.emptySubtext}>Invite your friends to lumino!</Text>
          <TouchableOpacity style={styles.inviteButton} onPress={handleInvite}>
            <Ionicons name="share-social" size={20} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.inviteButtonText}>Invite Friends</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Invitation Modal ── */}
      <Modal visible={isModalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share Invitation</Text>
              <Pressable onPress={() => setModalVisible(false)}><Ionicons name="close" size={24} color="#6B7280" /></Pressable>
            </View>
            <Text style={styles.modalDescription}>Share this link with your friends to connect on Lumino.</Text>
            <View style={styles.urlContainer}>
              <Text style={styles.urlText} numberOfLines={1}>{inviteUrl}</Text>
              <TouchableOpacity style={[styles.copyIconBtn, copied && styles.copyIconBtnSuccess]} onPress={handleCopy}>
                <Ionicons name={copied ? "checkmark" : "copy-outline"} size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.socialBtn} onPress={handleSocialShare}>
                <Ionicons name="share-social-outline" size={20} color="#4440EB" style={{ marginRight: 8 }} />
                <Text style={styles.socialBtnText}>Other Apps</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.doneBtn} onPress={() => setModalVisible(false)}><Text style={styles.doneBtnText}>Done</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: 16, padding: 4 },
  title: { fontSize: 22, fontWeight: '800', color: '#1A1A1A' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    margin: 20,
    paddingHorizontal: 15,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#1A1A1A' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  avatarContainer: { marginRight: 15 },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  avatarText: { fontSize: 20, fontWeight: '700', color: '#4440EB' },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 17, fontWeight: '700', color: '#1A1A1A' },
  contactPhone: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  chatBtn: { backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#C7D2FE' },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4440EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  inviteButton: {
    flexDirection: 'row',
    backgroundColor: '#4440EB',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
  },
  inviteButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#4B5563', marginTop: 20 },
  emptySubtext: { fontSize: 14, color: '#9CA3AF', marginTop: 8, marginBottom: 24, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 30, paddingBottom: 50 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#1A1A1A' },
  modalDescription: { fontSize: 15, color: '#6B7280', lineHeight: 22, marginBottom: 24 },
  urlContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 16, padding: 8, paddingLeft: 16, marginBottom: 30 },
  urlText: { flex: 1, fontSize: 14, color: '#4B5563', fontWeight: '500' },
  copyIconBtn: { width: 44, height: 44, backgroundColor: '#4440EB', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  copyIconBtnSuccess: { backgroundColor: '#10B981' },
  modalActions: { flexDirection: 'row', gap: 12 },
  socialBtn: { flex: 1, flexDirection: 'row', height: 56, borderRadius: 16, borderWidth: 2, borderColor: '#4440EB', justifyContent: 'center', alignItems: 'center' },
  socialBtnText: { color: '#4440EB', fontSize: 16, fontWeight: '700' },
  doneBtn: { flex: 1, height: 56, backgroundColor: '#1A1A1A', borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  doneBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
