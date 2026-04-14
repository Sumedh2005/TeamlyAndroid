import { supabase } from '../lib/supabase';
import { DBMatch, MatchRecord } from './HomeManager';

class JoinedMatchesManager {

  async fetchUserMatches(): Promise<DBMatch[]> {
    try {
      const currentUserId = await this.getCurrentUserId();
      if (!currentUserId) {
        throw new Error("User not logged in");
      }

      console.log(`🔍 [DEBUG] Fetching matches for user: ${currentUserId}`);

      // Get matches the user has joined (RSVP'd)
      const joinedMatchIds = await this.fetchJoinedMatchIds(currentUserId);
      console.log(`✅ [DEBUG] Found ${joinedMatchIds.length} joined matches`);

      // Get matches the user has created
      const createdMatches = await this.fetchCreatedMatches(currentUserId);
      console.log(`✅ [DEBUG] Found ${createdMatches.length} created matches`);

      let allMatches: DBMatch[] = [];
      const processedIds = new Set<string>();

      // Add created matches first
      for (const match of createdMatches) {
        allMatches.push(match);
        processedIds.add(match.id);
      }

      // If we have joined match IDs that aren't already in created matches, fetch them
      if (joinedMatchIds.length > 0) {
        const matchesToFetch = joinedMatchIds.filter(id => !processedIds.has(id));

        if (matchesToFetch.length > 0) {
          console.log(`🔍 [DEBUG] Fetching details for ${matchesToFetch.length} joined matches not already in created`);
          const joinedMatches = await this.fetchMatchDetails(matchesToFetch, currentUserId);
          allMatches = allMatches.concat(joinedMatches);
        }
      }

      console.log(`✅ [DEBUG] Total unique matches: ${allMatches.length}`);
      return allMatches;

    } catch (error) {
      console.error("❌ [DEBUG] Error in fetchUserMatches:", error);
      throw error;
    }
  }

  private async fetchJoinedMatchIds(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('match_rsvps')
      .select('match_id')
      .eq('user_id', userId)
      .eq('rsvp_status', 'going');

    if (error) {
      console.error("Error fetching joined matches", error);
      return [];
    }

    return (data || []).map(row => row.match_id);
  }

  private async fetchCreatedMatches(userId: string): Promise<DBMatch[]> {
    const { data: matchData, error } = await supabase
      .from('matches')
      .select('*')
      .eq('posted_by_user_id', userId)
      .eq('match_type', 'sport_community');

    if (error || !matchData) {
      console.error("Error fetching created matches", error);
      return [];
    }

    console.log(`🔍 [DEBUG] Found ${matchData.length} matches created by user`);

    const matches: DBMatch[] = [];

    for (const matchRecord of matchData) {
      const sportName = await this.fetchSportName(matchRecord.sport_id);
      const postedByName = "You"; // Since they are created matches
      const rsvpCount = await this.fetchRSVPCount(matchRecord.id);

      const dbMatch = this.createDBMatch(
        matchRecord,
        sportName,
        postedByName,
        rsvpCount,
        false,
        true // isCreatedByUser
      );

      if (dbMatch) {
        matches.push(dbMatch);
      }
    }

    return matches;
  }

  private async fetchMatchDetails(matchIds: string[], currentUserId: string): Promise<DBMatch[]> {
    const { data: matchData, error } = await supabase
      .from('matches')
      .select('*')
      .in('id', matchIds)
      .eq('match_type', 'sport_community');

    if (error || !matchData) {
      console.error("Error fetching match details", error);
      return [];
    }

    const matches: DBMatch[] = [];

    for (const matchRecord of matchData) {
      const sportName = await this.fetchSportName(matchRecord.sport_id);
      const postedByName = await this.fetchUserName(matchRecord.posted_by_user_id);
      const rsvpCount = await this.fetchRSVPCount(matchRecord.id);

      const isCreatedByUser = matchRecord.posted_by_user_id === currentUserId;

      const dbMatch = this.createDBMatch(
        matchRecord,
        sportName,
        isCreatedByUser ? "You" : postedByName,
        rsvpCount,
        false, // For simplicity we might not need isFriend strictly for this list unless used
        isCreatedByUser
      );

      if (dbMatch) {
        matches.push(dbMatch);
      }
    }

    return matches;
  }

  // --- Caching helpers for optimization ---
  private sportNamesCache: Record<number, string> = {};
  private userNamesCache: Record<string, string> = {};

  private async fetchSportName(sportId: number): Promise<string> {
    if (this.sportNamesCache[sportId]) return this.sportNamesCache[sportId];

    const { data, error } = await supabase
      .from('sports')
      .select('name')
      .eq('id', sportId)
      .single();

    if (error || !data) {
      return "Unknown Sport";
    }

    this.sportNamesCache[sportId] = data.name;
    return data.name;
  }

  private async fetchUserName(userId: string): Promise<string> {
    if (this.userNamesCache[userId]) return this.userNamesCache[userId];

    const { data, error } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return "Unknown";
    }

    this.userNamesCache[userId] = data.name || "Unknown";
    return data.name || "Unknown";
  }

  private async fetchRSVPCount(matchId: string): Promise<number> {
    const { count, error } = await supabase
      .from('match_rsvps')
      .select('*', { count: 'exact', head: true })
      .eq('match_id', matchId)
      .eq('rsvp_status', 'going');

    if (error) {
      console.error("Error fetching RSVP count", error);
      return 0;
    }
    return count || 0;
  }

  private async getCurrentUserId(): Promise<string | null> {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) return null;
    return session.user.id;
  }

  private createDBMatch(
    record: any, // Matches db record format
    sportName: string,
    postedByName: string,
    rsvpCount: number,
    isFriend: boolean,
    isCreatedByUser: boolean
  ): DBMatch | null {
    try {
      const matchDate = new Date(`${record.match_date}T00:00:00Z`);
      
      // We assume match_time is 'HH:mm:ss' or similar. Following swift's logic and JS parsing
      const todayString = new Date().toISOString().split('T')[0];
      const matchTime = new Date(`${todayString}T${record.match_time}Z`);
      
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
        postedByName: postedByName,
        isFriend,
        isCreatedByUser // Adding this onto the object implicitly if used in the UI
      } as DBMatch;
    } catch (e) {
      console.error('❌ Failed to parse match date or time', e);
      return null;
    }
  }

}

export default new JoinedMatchesManager();
