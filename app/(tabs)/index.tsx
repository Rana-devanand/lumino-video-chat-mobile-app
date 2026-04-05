import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  Modal,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { authService } from '@/services/authService';
import { contactService, RegisteredContact } from '@/services/contactService';
import { groupService, Group } from '@/services/groupService';
import { sharingService } from '@/services/sharingService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { videoCallService } from '@/services/videoCallService';
import { ContactPicker } from '@/components/ContactPicker';
import { 
  useGetProfileQuery, 
  useGetContactsQuery, 
  useGetGroupsQuery 
} from '@/services/api';
import { Image } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(false);

  // RTK Query hooks
  const { data: profile, isLoading: profileLoading } = useGetProfileQuery(userId || '', { skip: !userId });
  const { data: contactsData, isLoading: contactsLoading } = useGetContactsQuery(userId || '', { skip: !userId });
  const { data: groupsData, isLoading: groupsLoading } = useGetGroupsQuery(userId || '', { skip: !userId });

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerMode, setPickerMode] = useState<'call' | 'group'>('call');
  const [groupNameModalVisible, setGroupNameModalVisible] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedForGroup, setSelectedForGroup] = useState<string[]>([]);

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) setUserId(currentUser.id);
    };
    fetchUser();
  }, []);

  const contacts = contactsData || [];
  const groups = groupsData || [];
  const loading = profileLoading || contactsLoading || groupsLoading || !userId || localLoading;

  const handleCreateRoom = async (selectedIds: string[]) => {
    if (!userId) return;
    try {
      setLocalLoading(true);
      // Start a group call room
      await videoCallService.createGroupCall(userId, selectedIds);

      // Navigate to the first room created (or a special group room if we had one)
      // For now, we move to the room view
      router.push({
        pathname: '/room',
        params: { contactId: selectedIds[0], mode: 'caller' }
      });

      Alert.alert('Group Call', 'Initiating call with participants...');
    } catch (error) {
      Alert.alert('Error', 'Failed to start group call');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleOpenPicker = (mode: 'call' | 'group') => {
    setPickerMode(mode);
    setPickerVisible(true);
  };

  const onPickerConfirm = (selectedIds: string[]) => {
    if (pickerMode === 'call') {
      handleCreateRoom(selectedIds);
    } else {
      setSelectedForGroup(selectedIds);
      setGroupNameModalVisible(true);
    }
  };

  const handleFinalizeGroup = async () => {
    if (!newGroupName.trim() || !userId) return;
    try {
      setLocalLoading(true);
      await groupService.createGroup(newGroupName, selectedForGroup, userId);
      setGroupNameModalVisible(false);
      setNewGroupName('');
      Alert.alert('Success', `Group "${newGroupName}" created!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to create group');
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerAvatar}>
              {profile?.avatar_url ? (
                <Image 
                  source={{ uri: profile.avatar_url }} 
                  style={{ width: '100%', height: '100%', borderRadius: 18 }} 
                />
              ) : (
                <Text style={styles.headerAvatarText}>
                  {profile?.full_name?.[0] || 'L'}
                </Text>
              )}
            </View>
            <Text style={styles.brandName}>Lumino</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <Pressable onPress={() => sharingService.shareInvite()}>
              <Ionicons name="share-social-outline" size={24} color="#4440EB" />
            </Pressable>
            <Pressable onPress={() => router.push('/settings')}>
              <Ionicons name="settings-outline" size={24} color="#4440EB" />
            </Pressable>
            <Pressable>
              <Ionicons name="notifications-outline" size={24} color="#4440EB" />
            </Pressable>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9BA3AF" style={styles.searchIcon} />
          <TextInput
            placeholder="Search groups or friends..."
            style={styles.searchInput}
            placeholderTextColor="#9BA3AF"
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <Pressable style={styles.actionButton} onPress={() => handleOpenPicker('call')}>
            <View style={[styles.actionIcon, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="videocam" size={24} color="#4440EB" />
            </View>
            <Text style={styles.actionText}>Group Call</Text>
          </Pressable>

          <Pressable style={styles.actionButton} onPress={() => handleOpenPicker('group')}>
            <View style={[styles.actionIcon, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="people" size={24} color="#10B981" />
            </View>
            <Text style={styles.actionText}>New Group</Text>
          </Pressable>

          <Pressable style={styles.actionButton} onPress={() => router.push('/contacts-list')}>
            <View style={[styles.actionIcon, { backgroundColor: '#FFF7ED' }]}>
              <Ionicons name="person-add" size={24} color="#F97316" />
            </View>
            <Text style={styles.actionText}>Add Contact</Text>
          </Pressable>
        </View>

        {/* Groups Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Groups</Text>
          <Pressable onPress={() => { }}>
            <Text style={styles.viewAllText}>Show All</Text>
          </Pressable>
        </View>

        {groups.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupScroll}>
            {groups.map(group => (
              <Pressable key={group.id} style={styles.groupCard}>
                <View style={styles.groupAvatar}>
                  <Ionicons name="people" size={28} color="#4440EB" />
                </View>
                <Text style={styles.groupName} numberOfLines={1}>{group.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No groups yet. Create one to stay connected!</Text>
          </View>
        )}

        {/* Inner Circle Section */}
        <View style={[styles.sectionHeader, { marginTop: 32 }]}>
          <Text style={styles.sectionTitle}>Inner Circle</Text>
          <Pressable onPress={() => router.push('/contacts-list')}>
            <Text style={styles.viewAllText}>View All</Text>
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator color="#4440EB" style={{ marginTop: 20 }} />
        ) : contacts.length > 0 ? (
          <View style={styles.contactList}>
            {contacts.slice(0, 8).map((contact) => (
              <Pressable
                key={contact.id}
                style={styles.contactItem}
                onPress={() => router.push({
                  pathname: '/chat/[contactId]',
                  params: { contactId: contact.id, name: contact.full_name, avatar: contact.avatar_url || '' }
                })}
              >
                <View style={styles.contactAvatar}>
                  {contact.avatar_url ? (
                    <Image 
                      source={{ uri: contact.avatar_url }} 
                      style={{ width: '100%', height: '100%', borderRadius: 15 }} 
                    />
                  ) : (
                    <Text style={styles.contactAvatarText}>{contact.full_name?.[0] || '?'}</Text>
                  )}
                  <View style={styles.onlineStatus} />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{contact.full_name}</Text>
                  <Text style={styles.contactStatus}>Recently active</Text>
                </View>
                <Pressable
                  style={styles.callButton}
                  onPress={() => router.push({
                    pathname: '/room',
                    params: { contactId: contact.id, mode: 'caller', name: contact.full_name }
                  })}
                >
                  <Ionicons name="videocam" size={22} color="#4440EB" />
                </Pressable>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Keep your tight circle here. Invite a friend!</Text>
          </View>
        )}
      </ScrollView>

      {/* Global Modals */}
      <ContactPicker
        visible={pickerVisible}
        contacts={contacts}
        onClose={() => setPickerVisible(false)}
        onConfirm={onPickerConfirm}
        title={pickerMode === 'call' ? 'Start Group Call' : 'New Persistent Group'}
        buttonLabel={pickerMode === 'call' ? 'Call' : 'Next'}
      />

      <Modal visible={groupNameModalVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Enter Group Name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Family Chat, Office Room"
              value={newGroupName}
              onChangeText={setNewGroupName}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setGroupNameModalVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleFinalizeGroup} style={styles.confirmBtn}>
                <Text style={styles.confirmText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FA' },
  container: { flex: 1 },
  contentContainer: { padding: 24, paddingTop: 60, paddingBottom: 100 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerAvatarText: { color: '#4440EB', fontWeight: '700', fontSize: 14 },
  brandName: { fontSize: 34, fontWeight: '800', color: '#4440EB', letterSpacing: -0.5, fontFamily:'Poppins-Bold' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 50,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: '#111827' },

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  actionText: { fontSize: 13, fontWeight: '700', color: '#4B5563' },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  viewAllText: { fontSize: 13, fontWeight: '700', color: '#4440EB' },

  groupScroll: { marginHorizontal: -24, paddingHorizontal: 24 },
  groupCard: {
    width: 100,
    alignItems: 'center',
    marginRight: 16,
    padding: 12,
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  groupAvatar: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  groupName: { fontSize: 12, fontWeight: '700', color: '#374151', textAlign: 'center' },

  contactList: { gap: 12 },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  contactAvatar: {
    width: 54,
    height: 54,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactAvatarText: { fontSize: 20, fontWeight: '700', color: '#4440EB' },
  onlineStatus: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  contactStatus: { fontSize: 12, color: '#9CA3AF' },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyCard: {
    padding: 24,
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  emptyText: { color: '#9CA3AF', fontSize: 14, textAlign: 'center' },

  // Overlay / Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modal: { backgroundColor: '#FFF', borderRadius: 24, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 16 },
  modalInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    fontSize: 16,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  cancelText: { color: '#6B7280', fontWeight: '700' },
  confirmBtn: { backgroundColor: '#4440EB', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20 },
  confirmText: { color: '#FFF', fontWeight: '700' },
});
