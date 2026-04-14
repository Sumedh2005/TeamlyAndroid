import { supabase } from '../lib/supabase';
import { DBMatch } from './HomeManager';

export interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  gender: string | null;
  age: number | null;
  college_id: number | null;
  profile_pic: string | null;
  created_at: string;
  updated_at: string;
}

export interface MatchRSVP {
  id: number;
  match_id: string;
  user_id: string;
  rsvp_status: string;
  rsvp_at: string;
  attended: boolean | null;
}

export interface PlayerWithProfile {
  userId: string;
  name: string;
  profile: Profile | null;
  isFriend: boolean;
}

class MatchInfoManager {
  async fetchCurrentUserId(): Promise<string> {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
      throw new Error('Failed to get current user session');
    }
    return session.user.id;
  }

  async fetchHostProfile(match: DBMatch): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', match.postedByUserId)
      .single();

    if (error) {
      console.error('Failed to fetch host profile:', error);
      return null;
    }
    return data;
  }

  async fetchRSVPPlayers(match: DBMatch, currentUserId: string): Promise<PlayerWithProfile[]> {
    // 1. Fetch all RSVPs for this match
    const { data: rsvps, error: rsvpError } = await supabase
      .from('match_rsvps')
      .select('*')
      .eq('match_id', match.id)
      .eq('rsvp_status', 'going');

    if (rsvpError || !rsvps || rsvps.length === 0) {
      return [];
    }

    // 2. Get all user IDs from RSVPs
    const userIds = rsvps.map((r: MatchRSVP) => r.user_id);

    // 3. Fetch profiles for all users
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', userIds);

    if (profilesError || !profiles) {
      return [];
    }

    // 4. Create dictionary for quick profile lookup
    const profileDict: Record<string, Profile> = {};
    for (const profile of profiles) {
      profileDict[profile.id] = profile;
    }

    // 5. Check friend status for each RSVPed user and create player objects
    const players: PlayerWithProfile[] = [];

    for (const rsvp of rsvps) {
      const userId = rsvp.user_id;
      const profile = profileDict[userId];
      
      const isFriend = await this.checkFriendshipBetweenUsers(currentUserId, userId);

      players.push({
        userId: userId,
        name: profile?.name ?? 'Unknown Player',
        profile: profile || null,
        isFriend
      });
    }

    return players;
  }

  private async checkFriendshipBetweenUsers(userId1: string, userId2: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('friends')
        .select('*')
        .or(`and(user_id.eq.${userId1},friend_id.eq.${userId2},status.eq.accepted),and(user_id.eq.${userId2},friend_id.eq.${userId1},status.eq.accepted)`);

      if (error) {
        console.error('ERROR checking friendship between users:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('ERROR checking friendship between users:', error);
      return false;
    }
  }

  async checkFriendshipWithHost(match: DBMatch, currentUserId: string): Promise<boolean> {
    return await this.checkFriendshipBetweenUsers(currentUserId, match.postedByUserId);
  }

  async checkFriendship(currentUserId: string, otherUserId: string): Promise<boolean> {
    return await this.checkFriendshipBetweenUsers(currentUserId, otherUserId);
  }

  async joinMatch(matchId: string, userId: string): Promise<void> {
    const { data: existingRSVP, error: existingError } = await supabase
      .from('match_rsvps')
      .select('*')
      .eq('match_id', matchId)
      .eq('user_id', userId);

    if (existingError) {
      throw existingError;
    }

    if (!existingRSVP || existingRSVP.length === 0) {
      // Insert new RSVP
      const rsvp = {
        match_id: matchId,
        user_id: userId,
        rsvp_status: 'going',
        rsvp_at: new Date().toISOString()
      };

      const { error: insertError } = await supabase
        .from('match_rsvps')
        .insert([rsvp]);

      if (insertError) throw insertError;
      console.log(`✅ Successfully joined match: ${matchId}`);
    } else {
      // Update existing RSVP
      const { error: updateError } = await supabase
        .from('match_rsvps')
        .update({
          rsvp_status: 'going',
          rsvp_at: new Date().toISOString()
        })
        .eq('match_id', matchId)
        .eq('user_id', userId);

      if (updateError) throw updateError;
      console.log(`✅ Successfully updated RSVP to join match: ${matchId}`);
    }
  }

  async leaveMatch(matchId: string, userId: string): Promise<void> {
    const { data: existingRSVP, error: existingError } = await supabase
      .from('match_rsvps')
      .select('*')
      .eq('match_id', matchId)
      .eq('user_id', userId);

    if (existingError) throw existingError;

    if (existingRSVP && existingRSVP.length > 0) {
      const { error: deleteError } = await supabase
        .from('match_rsvps')
        .delete()
        .eq('match_id', matchId)
        .eq('user_id', userId);

      if (deleteError) throw deleteError;
      console.log(`✅ Successfully left match: ${matchId}`);
    } else {
      console.warn(`⚠️ No RSVP found for match: ${matchId} and user: ${userId}`);
      throw new Error("No RSVP found for this match");
    }
  }

  async fetchPlayersRSVPCount(matchId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('match_rsvps')
        .select('*', { count: 'exact', head: true })
        .eq('match_id', matchId)
        .eq('rsvp_status', 'going');

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('❌ Error fetching RSVP count:', error);
      throw error;
    }
  }

  async sendFriendRequest(fromUserId: string, toUserId: string): Promise<void> {
    const friendRequest = {
      user_id: fromUserId,
      friend_id: toUserId,
      status: 'pending'
    };

    const { error } = await supabase
      .from('friends')
      .insert([friendRequest]);

    if (error) {
      throw error;
    }
  }
}

export default new MatchInfoManager();
