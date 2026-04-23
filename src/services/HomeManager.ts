import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  name: string | null;
  college_id: number;
  profile_pic: string | null;
}

export interface College {
  id: number;
  name: string;
  location: string | null;
}

export interface Sport {
  id: number;
  name: string;
  emoji: string;
}

export interface UserPreferredSport {
  id: number;
  user_id: string;
  sport_id: number;
  skill_level: string | null;
}

export interface SportCommunity {
  id: string;
  college_id: number;
  sport_id: number;
  name: string;
}

export interface MatchRecord {
  id: string;
  match_type: string;
  community_id: string | null;
  venue: string;
  match_date: string;
  match_time: string;
  sport_id: number;
  skill_level: string | null;
  players_needed: number;
  posted_by_user_id: string;
  created_at: string;
}

export interface DBMatch {
  id: string;
  matchType: string;
  communityId: string | null;
  venue: string;
  matchDate: Date;
  matchTime: Date;
  sportId: number;
  sportName: string;
  skillLevel: string | null;
  playersNeeded: number;
  postedByUserId: string;
  createdAt: Date;
  playersRSVPed: number;
  postedByName: string;
  isFriend: boolean;
}

class HomeManager {
  async fetchUserProfile(userId: string): Promise<UserProfile | null> {
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

  async fetchCollege(collegeId: number): Promise<College | null> {
    const { data, error } = await supabase
      .from('colleges')
      .select('*')
      .eq('id', collegeId)
      .single();

    if (error) {
      console.error('Error fetching college:', error);
      return null;
    }
    return data;
  }

  async fetchAllSports(): Promise<Sport[]> {
    const { data, error } = await supabase.from('sports').select('*');
    if (error) {
      console.error('Error fetching all sports:', error);
      return [];
    }
    return data;
  }

  async fetchUserPreferredSports(userId: string): Promise<UserPreferredSport[]> {
    const { data, error } = await supabase
      .from('user_preferred_sports')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user preferred sports:', error);
      return [];
    }
    return data;
  }

  async fetchSportCommunity(collegeId: number, sportId: number): Promise<SportCommunity | null> {
    const { data, error } = await supabase
      .from('sport_communities')
      .select('*')
      .eq('college_id', collegeId)
      .eq('sport_id', sportId)
      .single();

    if (error) {
      console.error('Error fetching sport community:', error);
      return null;
    }
    return data;
  }

  async fetchMatchesForSport(sportId: number, collegeId: number, currentUserId: string): Promise<DBMatch[]> {
    const localNow = new Date();
    const pseudoNow = new Date(Date.UTC(localNow.getFullYear(), localNow.getMonth(), localNow.getDate(), localNow.getHours(), localNow.getMinutes(), localNow.getSeconds()));
    
    const todayStr = pseudoNow.toISOString().split('T')[0];
    const tomorrowPseudo = new Date(pseudoNow);
    tomorrowPseudo.setUTCDate(tomorrowPseudo.getUTCDate() + 1);
    const tomorrowStr = tomorrowPseudo.toISOString().split('T')[0];

    const community = await this.fetchSportCommunity(collegeId, sportId);
    if (!community) return [];

    const { data: matchRecords, error } = await supabase
      .from('matches')
      .select('*')
      .eq('match_type', 'sport_community')
      .eq('community_id', community.id)
      .in('match_date', [todayStr, tomorrowStr])
      .neq('posted_by_user_id', currentUserId)
      .order('match_date', { ascending: true })
      .order('match_time', { ascending: true });

    if (error || !matchRecords) {
      console.error('Error fetching matches for sport:', error);
      return [];
    }

    const filteredMatchRecords = matchRecords.filter((record: MatchRecord) => {
      if (record.match_date === tomorrowStr) return true;
      if (record.match_date === todayStr) {
        const matchDateTime = new Date(`${record.match_date}T${record.match_time}Z`);
        return matchDateTime.getTime() > pseudoNow.getTime();
      }
      return true;
    });

    const userIds = Array.from(new Set(filteredMatchRecords.map((r: MatchRecord) => r.posted_by_user_id)));
    const userNames = await this.fetchUserNames(userIds);

    const dbMatches: DBMatch[] = [];
    for (const record of filteredMatchRecords) {
      const sportName = await this.fetchSportName(record.sport_id);
      const rsvpCount = await this.fetchRSVPCount(record.id);
      const userName = userNames[record.posted_by_user_id] || 'Unknown User';
      const isFriend = await this.checkFriendship(currentUserId, record.posted_by_user_id);
      
      const dbMatch = this.convertToDBMatch(record, sportName, rsvpCount, userName, isFriend);
      if (dbMatch) {
        dbMatches.push(dbMatch);
      }
    }

    return dbMatches;
  }

  async fetchUserNames(userIds: string[]): Promise<Record<string, string>> {
    if (userIds.length === 0) return {};
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', userIds);

    if (error || !data) return {};

    const result: Record<string, string> = {};
    for (const profile of data) {
      result[profile.id] = profile.name || 'Unknown User';
    }
    return result;
  }

  async fetchSportName(sportId: number): Promise<string> {
    const { data, error } = await supabase
      .from('sports')
      .select('name')
      .eq('id', sportId)
      .single();

    if (error || !data) return 'Unknown Sport';
    return data.name;
  }

  async fetchRSVPCount(matchId: string): Promise<number> {
    const { count, error } = await supabase
      .from('match_rsvps')
      .select('*', { count: 'exact', head: true })
      .eq('match_id', matchId)
      .eq('rsvp_status', 'going');

    if (error) {
      console.error('Error fetching RSVP count:', error);
      return 0;
    }
    return count || 0;
  }

  async checkFriendship(currentUserId: string, friendId: string): Promise<boolean> {
    if (!currentUserId || !friendId) return false;
    const { data, error } = await supabase
      .from('friends')
      .select('*')
      .eq('user_id', currentUserId)
      .eq('friend_id', friendId)
      .eq('status', 'accepted');

    if (error || !data) return false;
    return data.length > 0;
  }

  private convertToDBMatch(
    record: MatchRecord,
    sportName: string,
    rsvpCount: number,
    userName: string,
    isFriend: boolean
  ): DBMatch | null {
    const matchDate = new Date(`${record.match_date}T00:00:00Z`); // use exact date
    const matchTime = new Date(`1970-01-01T${record.match_time}Z`);
    const createdAt = new Date(record.created_at);

    return {
      id: record.id,
      matchType: record.match_type,
      communityId: record.community_id,
      venue: record.venue,
      matchDate,
      matchTime,
      sportId: record.sport_id,
      sportName,
      skillLevel: record.skill_level,
      playersNeeded: record.players_needed,
      postedByUserId: record.posted_by_user_id,
      createdAt,
      playersRSVPed: rsvpCount,
      postedByName: userName,
      isFriend
    };
  }

  async fetchUserUpcomingMatches(userId: string): Promise<DBMatch[]> {
    console.log(`🔍 Fetching upcoming matches for user: ${userId}`);
    const localNow = new Date();
    const pseudoNow = new Date(Date.UTC(localNow.getFullYear(), localNow.getMonth(), localNow.getDate(), localNow.getHours(), localNow.getMinutes(), localNow.getSeconds()));
    
    const todayStr = pseudoNow.toISOString().split('T')[0];
    const tomorrowPseudo = new Date(pseudoNow);
    tomorrowPseudo.setUTCDate(tomorrowPseudo.getUTCDate() + 1);
    const tomorrowStr = tomorrowPseudo.toISOString().split('T')[0];

    const { data: createdMatchesData, error: createdError } = await supabase
      .from('matches')
      .select('*, sports!inner(name)')
      .eq('posted_by_user_id', userId)
      .eq('match_type', 'sport_community')
      .in('match_date', [todayStr, tomorrowStr])
      .order('match_date', { ascending: true })
      .order('match_time', { ascending: true });

    if (createdError) {
      console.error('Error fetching created matches:', createdError);
    }

    const { data: rsvpMatchesData, error: rsvpError } = await supabase
      .from('match_rsvps')
      .select(`
        match_id,
        matches!inner(*, sports!inner(name))
      `)
      .eq('user_id', userId)
      .eq('rsvp_status', 'going');

    if (rsvpError) {
      console.error('Error fetching RSVP matches:', rsvpError);
    }

    const allMatches: DBMatch[] = [];

    const parseMatchData = (matchData: any): DBMatch | null => {
      try {
        const sportName = matchData.sports?.name || matchData.sport_name || 'Unknown Sport';
        
        const rsvpCountResult = 0; // The original swift code does not seem to fetch RSVP count for these matches but expects 0 by default. Wait, swift does `playersRSVPed: 0` in parseMatchData.
        
        return this.convertToDBMatch(
          matchData as MatchRecord,
          sportName,
          0,
          '',
          false
        );
      } catch (e) {
        return null;
      }
    };

    if (createdMatchesData) {
      for (const item of createdMatchesData) {
        const match = parseMatchData(item);
        if (match) allMatches.push(match);
      }
    }

    if (rsvpMatchesData) {
      for (const item of rsvpMatchesData) {
        // @ts-ignore
        const matchData = item.matches;
        if (matchData && matchData.match_type === 'sport_community') {
          const match = parseMatchData(matchData);
          if (match && !allMatches.find(m => m.id === match.id)) {
            allMatches.push(match);
          }
        }
      }
    }

    // Filter matches that are starting within the next 3 hours
    const upcomingMatches = allMatches.filter(match => {
      // Combine date and time precisely via pseudoUTC 
      const matchDateTimeStr = `${match.matchDate.toISOString().split('T')[0]}T${match.matchTime.toISOString().split('T')[1]}`;
      const matchDateTime = new Date(matchDateTimeStr);

      const timeDifferenceMinutes = (matchDateTime.getTime() - pseudoNow.getTime()) / (1000 * 60);

      const isToday = match.matchDate.toISOString().split('T')[0] === pseudoNow.toISOString().split('T')[0];
      const isUpcoming = isToday && timeDifferenceMinutes > 0 && timeDifferenceMinutes <= 180;

      return isUpcoming;
    });

    upcomingMatches.sort((a, b) => {
      const dateA = new Date(`${a.matchDate.toISOString().split('T')[0]}T${a.matchTime.toISOString().split('T')[1]}`);
      const dateB = new Date(`${b.matchDate.toISOString().split('T')[0]}T${b.matchTime.toISOString().split('T')[1]}`);
      return dateA.getTime() - dateB.getTime();
    });

    return upcomingMatches;
  }
}

export default new HomeManager();
