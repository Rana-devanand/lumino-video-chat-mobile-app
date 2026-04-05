import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authService } from '@/services/authService';
import { groupService, Group } from '@/services/groupService';

const { width } = Dimensions.get('window');

export default function GroupsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadGroups();
    }, [])
  );

  const loadGroups = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        const userGroups = await groupService.getUserGroups(user.id);
        setGroups(userGroups);
      }
    } catch (error) {
      console.error('[GroupsScreen] Error loading groups:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const renderGroupItem = (group: Group) => (
    <Pressable
      key={group.id}
      style={styles.groupItem}
      onPress={() => {
        // TODO: Navigate to group chat
        // router.push({ pathname: '/chat/group', params: { groupId: group.id, name: group.name } });
      }}
    >
      <View style={styles.groupAvatar}>
         <Ionicons name="people" size={26} color="#4440EB" />
      </View>
      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{group.name}</Text>
        <Text style={styles.groupSub}>Persistent Group</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </Pressable>
  );

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.title}>Groups</Text>
        <Pressable style={styles.addBtn} onPress={() => router.push('/')}>
           <Ionicons name="add-circle-outline" size={26} color="#4440EB" />
        </Pressable>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadGroups(true)} tintColor="#4440EB" />
        }
      >
        {loading && !refreshing ? (
          <ActivityIndicator color="#4440EB" style={{ marginTop: 40 }} />
        ) : groups.length > 0 ? (
          <View style={styles.list}>
            {groups.map(renderGroupItem)}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="people-outline" size={60} color="#E5E7EB" />
            </View>
            <Text style={styles.emptyTitle}>No groups yet</Text>
            <Text style={styles.emptySub}>Create a group from the Home screen to start collaborating!</Text>
            <Pressable style={styles.goHomeBtn} onPress={() => router.push('/')}>
              <Text style={styles.goHomeText}>Go to Home</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FA' },
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
  title: { fontSize: 24, fontWeight: '800', color: '#111827' },
  addBtn: { padding: 4 },
  content: { flex: 1 },
  list: { padding: 20 },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  groupAvatar: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  groupInfo: { flex: 1 },
  groupName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  groupSub: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 60 },
  emptyIcon: { marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#4B5563', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },
  goHomeBtn: {
    marginTop: 24,
    backgroundColor: '#4440EB',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  goHomeText: { color: '#FFF', fontWeight: '700' },
});
