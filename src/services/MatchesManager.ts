import { supabase } from '../lib/supabase';
import { DBMatch, MatchRecord, Sport, SportCommunity } from './HomeManager';

class MatchesManager {
  async fetchMatchesForSportAndDate(
    sportName: string,
    date: string, // Format: "yyyy-MM-dd"
    collegeId: number,
    currentUserId: string
  ): Promise<DBMatch[]> {
    const sport = await this.fetchSportByName(sportName);
    if (!sport) return [];

    const community = await this.fetchSportCommunity(collegeId, sport.id);
    if (!community) return [];

    const { data: matchRecords, error } = await supabase
      .from('matches')
      .select('*')
      .eq('match_type', 'sport_community')
      .eq('community_id', community.id)
      .eq('match_date', date)
      .order('match_time', { ascending: true });

    if (error || !matchRecords) {
      console.error('Error fetching matches for sport and date:', error);
      return [];
    }

    if (matchRecords.length === 0) return [];

    const userIds = Array.from(new Set(matchRecords.map((r: MatchRecord) => r.posted_by_user_id)));
    const userNames = await this.fetchUserNames(userIds);

    const dbMatches: DBMatch[] = [];

    for (const record of matchRecords) {
      const rsvpCount = await this.fetchRSVPCount(record.id);
      const userName = userNames[record.posted_by_user_id] || 'Unknown User';
      const isFriend = await this.checkFriendship(currentUserId, record.posted_by_user_id);
      
      const dbMatch = this.convertToDBMatch(record, sport.name, rsvpCount, userName, isFriend);
      if (dbMatch) {
        dbMatches.push(dbMatch);
      }
    }

    return dbMatches;
  }

  private async fetchSportByName(name: string): Promise<Sport | null> {
    const { data, error } = await supabase
      .from('sports')
      .select('*')
      .ilike('name', name) // Using ilike for case-insensitive just in case
      .single();

    if (error) {
      console.error(`Error fetching sport by name ${name}:`, error);
      return null;
    }
    return data;
  }

  private async fetchSportCommunity(collegeId: number, sportId: number): Promise<SportCommunity | null> {
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

  private async fetchUserNames(userIds: string[]): Promise<Record<string, string>> {
    if (userIds.length === 0) return {};

    const { data, error } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', userIds);

    if (error || !data) {
      console.error('Error fetching user names:', error);
      return {};
    }

    const result: Record<string, string> = {};
    for (const profile of data) {
      result[profile.id] = profile.name || 'Unknown User';
    }
    return result;
  }

  private async fetchRSVPCount(matchId: string): Promise<number> {
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

  private async checkFriendship(currentUserId: string, friendId: string): Promise<boolean> {
    if (!currentUserId || !friendId) return false;

    const { data, error } = await supabase
      .from('friends')
      .select('*')
      .eq('user_id', currentUserId)
      .eq('friend_id', friendId)
      .eq('status', 'accepted');

    if (error || !data) {
      // Not logging the error as it might be expected if no friendship exists
      return false;
    }
    return data.length > 0;
  }

  private convertToDBMatch(
    record: MatchRecord,
    sportName: string,
    rsvpCount: number,
    userName: string,
    isFriend: boolean
  ): DBMatch | null {
    try {
      const matchDate = new Date(`${record.match_date}T00:00:00Z`);
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
        isFriend,
      };
    } catch (e) {
      console.error('Failed to parse match date or time', e);
      return null;
    }
  }
}

export default new MatchesManager();
