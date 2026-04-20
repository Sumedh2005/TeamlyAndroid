import { supabase } from '../lib/supabase';

export interface Profile {
  id: string;
  name: string | null;
  age: number | null;
  gender: string | null;
  college_id: number;
  profile_pic: string | null;
}

export interface Team {
  id: string;
  name: string;
  sport: string;
}

export interface SportWithSkill {
  id: number;
  name: string;
  emoji: string;
  skill_level: string | null;
}

export interface BlockStatus {
  isBlocked: boolean; // I blocked them
  isBlockedByUser: boolean; // They blocked me
}

export interface RelationshipStatus {
  isFriend: boolean;
  hasOutgoingRequest: boolean;
  hasIncomingRequest: boolean;
}

class UserProfileManager {
  async fetchProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
    return data;
  }

  async fetchTeams(userId: string): Promise<Team[]> {
    const { data: teamMembers, error: err1 } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', userId);

    if (err1 || !teamMembers) return [];

    const teamIds = teamMembers.map((tm: any) => tm.team_id);
    if (teamIds.length === 0) return [];

    const { data: teams, error: err2 } = await supabase
      .from('teams')
      .select('*')
      .in('id', teamIds);

    if (err2 || !teams) return [];
    return teams;
  }

  async fetchSports(userId: string): Promise<SportWithSkill[]> {
    const { data: preferred, error: err1 } = await supabase
      .from('user_preferred_sports')
      .select('sport_id, skill_level')
      .eq('user_id', userId);

    if (err1 || !preferred || preferred.length === 0) return [];

    const sportIds = preferred.map((p: any) => p.sport_id);
    const { data: sportsData, error: err2 } = await supabase
      .from('sports')
      .select('*')
      .in('id', sportIds);

    if (err2 || !sportsData) return [];

    const sportsWithSkills: SportWithSkill[] = preferred.map((p: any) => {
      const sport = sportsData.find((s: any) => s.id === p.sport_id);
      return {
        id: p.sport_id,
        name: sport?.name || 'Unknown',
        emoji: sport?.emoji || '🏃‍♂️',
        skill_level: p.skill_level,
      };
    });

    return sportsWithSkills;
  }

  async checkBlockStatus(currentUserId: string, targetUserId: string): Promise<BlockStatus> {
    if (currentUserId === targetUserId) {
      return { isBlocked: false, isBlockedByUser: false };
    }

    try {
      // Check if current user blocked the target user
      const { data: blockedData } = await supabase
        .from('blocked')
        .select('*')
        .eq('blocked_by_user', currentUserId)
        .eq('blocked_user', targetUserId);
      const isBlocked = !!(blockedData && blockedData.length > 0);

      // Check if target user blocked current user
      const { data: blockedByData } = await supabase
        .from('blocked')
        .select('*')
        .eq('blocked_by_user', targetUserId)
        .eq('blocked_user', currentUserId);
      const isBlockedByUser = !!(blockedByData && blockedByData.length > 0);

      return { isBlocked, isBlockedByUser };
    } catch (error) {
      console.error('Error checking block status', error);
      return { isBlocked: false, isBlockedByUser: false };
    }
  }

  async checkRelationshipStatus(currentUserId: string, targetUserId: string): Promise<RelationshipStatus> {
    if (currentUserId === targetUserId) {
      return { isFriend: false, hasOutgoingRequest: false, hasIncomingRequest: false };
    }

    try {
      // Check accepted friends
      const { data: accepted } = await supabase
        .from('friends')
        .select('*')
        .or(`and(user_id.eq.${currentUserId},friend_id.eq.${targetUserId},status.eq.accepted),and(user_id.eq.${targetUserId},friend_id.eq.${currentUserId},status.eq.accepted)`);
      
      const isFriend = !!(accepted && accepted.length > 0);

      // Check outgoing
      const { data: outgoing } = await supabase
        .from('friends')
        .select('*')
        .eq('user_id', currentUserId)
        .eq('friend_id', targetUserId)
        .eq('status', 'pending');
      
      const hasOutgoingRequest = !!(outgoing && outgoing.length > 0);

      // Check incoming
      const { data: incoming } = await supabase
        .from('friends')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('friend_id', currentUserId)
        .eq('status', 'pending');
      
      const hasIncomingRequest = !!(incoming && incoming.length > 0);

      return { isFriend, hasOutgoingRequest, hasIncomingRequest };
    } catch (error) {
      console.error('Error checking relationship status', error);
      return { isFriend: false, hasOutgoingRequest: false, hasIncomingRequest: false };
    }
  }

  async blockUser(currentUserId: string, targetUserId: string): Promise<boolean> {
    const { error } = await supabase
      .from('blocked')
      .insert({
        blocked_by_user: currentUserId,
        blocked_user: targetUserId
      });
    
    if (error) {
      console.error('Error blocking user', error);
      return false;
    }
    return true;
  }

  async unblockUser(currentUserId: string, targetUserId: string): Promise<boolean> {
    const { error } = await supabase
      .from('blocked')
      .delete()
      .eq('blocked_by_user', currentUserId)
      .eq('blocked_user', targetUserId);
    
    if (error) {
      console.error('Error unblocking user', error);
      return false;
    }
    return true;
  }

  async sendFriendRequest(currentUserId: string, targetUserId: string, currentUserName: string): Promise<boolean> {
    try {
      // 1. Check if request exists in any way
      const { data: existing } = await supabase
        .from('friends')
        .select('*')
        .or(`and(user_id.eq.${currentUserId},friend_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},friend_id.eq.${currentUserId})`);
      
      if (existing && existing.length > 0) {
        return false;
      }

      // 2. Create friend request
      const { error: friendErr } = await supabase
        .from('friends')
        .insert({
          user_id: currentUserId,
          friend_id: targetUserId,
          status: 'pending'
        });
      
      if (friendErr) {
        console.error('Error sending friend request:', friendErr);
        return false;
      }

      // 3. Send Notification
      await supabase
        .from('notifications')
        .insert({
          sender_id: currentUserId,
          receiver_id: targetUserId,
          type: 'friend_request',
          message: `${currentUserName} has sent you a friend request`
        });

      return true;
    } catch (error) {
      console.error('Exception in sendFriendRequest:', error);
      return false;
    }
  }
}

export default new UserProfileManager();
