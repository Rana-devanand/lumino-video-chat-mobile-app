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
} from 'react-native';
import * as Contacts from 'expo-contacts';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { contactService, RegisteredContact } from '@/services/contactService';

export default function ContactsScreen() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contacts.Contact[]>([]);
  const [registeredContacts, setRegisteredContacts] = useState<RegisteredContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
        }
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncWithSupabase = async (allContacts: Contacts.Contact[]) => {
    // Extract phone numbers and normalize
    const phoneNumbers = allContacts
      .flatMap((c) => c.phoneNumbers || [])
      .map((p) => p.number?.replace(/\D/g, ''))
      .filter((n): n is string => !!n);

    if (phoneNumbers.length === 0) return;

    // Call RPC to filter registered contacts
    // Normalization: Remove dots, spaces, dashes and ensure + prefix for international match
    const normalizedNumbers = phoneNumbers.map(n => {
      let num = n.replace(/\D/g, '');
      return n.startsWith('+') ? `+${num}` : `+${num}`; // Assumes international if not prefixed
    });

    try {
      const data = await contactService.getRegisteredContacts(normalizedNumbers);
      setRegisteredContacts(data);
    } catch (error) {
      console.error('[ContactsScreen] Sync failed:', error);
    }
  };

  const handleCall = (contact: RegisteredContact) => {
    // Navigate to Room screen or initiate call logic
    router.push('/room');
  };

  const filteredContacts = registeredContacts.filter((c) =>
    c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone_number?.includes(searchQuery)
  );

  const renderItem = ({ item }: { item: RegisteredContact }) => (
    <View style={styles.contactItem}>
      <View style={styles.avatarContainer}>
        {item.avatar_url ? (
          <Text>IMG</Text> // Replace with Image component if needed
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{item.full_name?.[0] || '?'}</Text>
          </View>
        )}
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.full_name}</Text>
        <Text style={styles.contactPhone}>{item.phone_number}</Text>
      </View>
      <TouchableOpacity style={styles.callButton} onPress={() => handleCall(item)}>
        <Ionicons name="videocam" size={20} color="#FFF" />
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
        </View>
      )}
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
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4440EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4440EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#4B5563', marginTop: 20 },
  emptySubtext: { fontSize: 14, color: '#9CA3AF', marginTop: 8, textAlign: 'center' },
});
