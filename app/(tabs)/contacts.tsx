import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Share,
  Modal,
  Pressable,
} from 'react-native';
import * as Contacts from 'expo-contacts';
import * as Linking from 'expo-linking';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { contactService, RegisteredContact } from '@/services/contactService';
import { authService } from '@/services/authService';

export default function ContactsScreen() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contacts.Contact[]>([]);
  const [registeredContacts, setRegisteredContacts] = useState<RegisteredContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  
  // Modal State
  const [isModalVisible, setModalVisible] = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');
  const [copied, setCopied] = useState(false);


  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.Emails, Contacts.Fields.PhoneNumbers],
        });

        if (data.length > 0) {
          setContacts(data);
          // Sync with Supabase to find registered users
          await syncWithSupabase(data);
        } else {
           // No contacts on device
           setRegisteredContacts([]);
        }
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncWithSupabase = async (allContacts: Contacts.Contact[]) => {
    const user = authService.getCurrentUser();
    if (!user) return;

    // Extract phone numbers and normalize
    const phoneNumbers = allContacts
      .flatMap((c) => c.phoneNumbers || [])
      .map((p) => p.number?.replace(/\D/g, ''))
      .filter((n): n is string => !!n && n.length >= 10);

    const normalizedNumbers = phoneNumbers.flatMap(num => [
      num, 
      `+${num}`
    ]);

    try {
      const data = await contactService.getRegisteredContacts(user.uid, normalizedNumbers);
      setRegisteredContacts(data);
    } catch (error) {
      console.error('[ContactsScreen] Sync failed:', error);
    }
  };



  const handleCall = (contact: RegisteredContact) => {
    router.push({
      pathname: '/room',
      params: { contactId: contact.id, mode: 'caller', name: contact.full_name }
    });
  };

  const handleChat = (contact: RegisteredContact) => {
    router.push({
      pathname: `/chat/${contact.id}`,
      params: { name: contact.full_name, avatar: contact.avatar_url || '' }
    });
  };


  const handleInvite = () => {
    const user = authService.getCurrentUser();
    const referralId = user?.uid || 'guest';

    // Using the port where http-server is running (3000)
    const bridgeBaseUrl = 'http://10.179.164.83:3000'; 
    const url = `${bridgeBaseUrl}/?referrer=${referralId}`;

    console.log(`[ContactsScreen] Generated Invite URL: ${url}`);
    setInviteUrl(url);
    setModalVisible(true);
    setCopied(false);
  };


  const handleCopy = async () => {
    await Clipboard.setStringAsync(inviteUrl);
    setCopied(true);
    // Haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Reset "copied" state after 2 seconds
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSocialShare = async () => {
    try {
      const message = `Hey! Join me on Lumino for high-quality video calls. Use my link to get started: ${inviteUrl}`;
      await Share.share({
        message,
        url: inviteUrl,
        title: 'Invite to Lumina',
      });
    } catch (error) {
      console.error('[ContactsScreen] Social share failed:', error);
    }
  };

  const filteredContacts = registeredContacts.filter((c) =>
    c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone_number?.includes(searchQuery)
  );

  const renderItem = ({ item }: { item: RegisteredContact }) => (
    <View style={styles.contactItem}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{item.full_name?.[0]?.toUpperCase() || '?'}</Text>
        </View>
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.full_name}</Text>
        <Text style={styles.contactPhone}>{item.phone_number}</Text>
      </View>
      {/* Message button */}
      <TouchableOpacity
        style={[styles.actionBtn, styles.chatBtn]}
        onPress={() => handleChat(item)}
      >
        <Ionicons name="chatbubble-ellipses" size={18} color="#4440EB" />
      </TouchableOpacity>
      {/* Video call button */}
      <TouchableOpacity
        style={[styles.actionBtn, styles.callButton]}
        onPress={() => handleCall(item)}
      >
        <Ionicons name="videocam" size={18} color="#FFF" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Contacts</Text>
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
          <Text style={styles.emptySubtext}>Invite your friends to Lumina!</Text>
          
          <TouchableOpacity style={styles.inviteButton} onPress={handleInvite}>
            <Ionicons name="share-social" size={20} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.inviteButtonText}>Invite Friends</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Invitation Modal ── */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share Invitation</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </Pressable>
            </View>

            <Text style={styles.modalDescription}>
              Share this unique link with your friends to connect on Lumino.
            </Text>

            {/* URL Display Area */}
            <View style={styles.urlContainer}>
              <Text style={styles.urlText} numberOfLines={1}>
                {inviteUrl}
              </Text>
              <TouchableOpacity 
                style={[styles.copyIconBtn, copied && styles.copyIconBtnSuccess]} 
                onPress={handleCopy}
              >
                <Ionicons name={copied ? "checkmark" : "copy-outline"} size={20} color="#FFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.socialBtn} onPress={handleSocialShare}>
                <Ionicons name="share-social-outline" size={20} color="#4440EB" style={{ marginRight: 8 }} />
                <Text style={styles.socialBtnText}>Other Apps</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.doneBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.doneBtnText}>Done</Text>
              </TouchableOpacity>
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
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFF',
  },
  title: { fontSize: 24, fontWeight: '800', color: '#1A1A1A' },
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
    borderRadius: 25,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
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
  chatBtn: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4440EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    shadowColor: '#4440EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#4B5563', marginTop: 20 },
  emptySubtext: { fontSize: 14, color: '#9CA3AF', marginTop: 8, marginBottom: 24, textAlign: 'center' },
  inviteButton: {
    flexDirection: 'row',
    backgroundColor: '#4440EB',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#4440EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  inviteButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 30,
    paddingBottom: 50,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#1A1A1A' },
  modalDescription: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 24,
  },
  urlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 8,
    paddingLeft: 16,
    marginBottom: 30,
  },
  urlText: { flex: 1, fontSize: 14, color: '#4B5563', fontWeight: '500' },
  copyIconBtn: {
    width: 44,
    height: 44,
    backgroundColor: '#4440EB',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  copyIconBtnSuccess: { backgroundColor: '#10B981' },
  modalActions: { flexDirection: 'row', gap: 12 },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 56,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#4440EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialBtnText: { color: '#4440EB', fontSize: 16, fontWeight: '700' },
  doneBtn: {
    flex: 1,
    height: 56,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});

