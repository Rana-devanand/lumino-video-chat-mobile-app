import { supabase } from '@/utils/supabase';

export interface Group {
  id: string;
  name: string;
  avatar_url: string | null;
  created_at: string;
  created_by: string;
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  profile?: {
    full_name: string;
    avatar_url: string | null;
  };
}

export const groupService = {
  /**
   * Creates a persistent group and adds initial members.
   */
  async createGroup(name: string, members: string[], createdBy: string) {
    console.log(`[groupService] Creating group "${name}" for ${createdBy}...`);
    
    // 1. Create group entry
    const { data: group, error: groupErr } = await supabase
      .from('groups')
      .insert({ name, created_by: createdBy })
      .select('id')
      .single();

    if (groupErr) throw groupErr;

    // 2. Add creator and all selected members
    const allMemberIds = Array.from(new Set([createdBy, ...members]));
    const memberEntries = allMemberIds.map(uid => ({
      group_id: group.id,
      user_id: uid,
      role: uid === createdBy ? 'admin' : 'member'
    }));

    const { error: memberErr } = await supabase
      .from('group_members')
      .insert(memberEntries);

    if (memberErr) throw memberErr;

    return group.id;
  },

  /**
   * Fetches all groups the current user belongs to.
   */
  async getUserGroups(userId: string): Promise<Group[]> {
    console.log(`[groupService] Fetching groups for user ${userId}...`);
    
    const { data, error } = await supabase
      .from('group_members')
      .select('group_id, groups(*)')
      .eq('user_id', userId);

    if (error) throw error;
    
    return (data || []).map(item => {
      const g = Array.isArray(item.groups) ? item.groups[0] : item.groups;
      return g as Group;
    });
  },

  /**
   * Fetches members of a specific group along with their profile info.
   */
  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    const { data, error } = await supabase
      .from('group_members')
      .select(`
        group_id,
        user_id,
        role,
        joined_at,
        profiles(full_name, avatar_url)
      `)
      .eq('group_id', groupId);

    if (error) throw error;
    
    return (data || []).map(item => ({
      group_id: item.group_id,
      user_id: item.user_id,
      role: item.role as 'admin' | 'member',
      joined_at: item.joined_at,
      profile: (item.profiles as any)
    }));
  }
};
