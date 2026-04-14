import { supabase } from '../../../lib/supabase';

export interface MatchPostData {
  matchType: string;
  communityId?: string | null;
  venue: string;
  matchDate: string; // 'yyyy-MM-dd'
  matchTime: string; // 'HH:mm:ss'
  sportId: number;
  skillLevel: string | null;
  playersNeeded: number;
  postedByUserId?: string; // Will be set dynamically during insert
}

class PostManager {
  
  async saveMatch(matchData: MatchPostData): Promise<void> {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error("User not authenticated");
      }
      
      const userId = session.user.id;
      
      // Calculate community id. E.g. '1.5' for sportId 5
      const communityId = `1.${matchData.sportId}`;
      
      // We create payload mapping exactly to the snake_case matches table properties
      const payload = {
        match_type: matchData.matchType,
        community_id: communityId,
        venue: matchData.venue,
        match_date: matchData.matchDate,
        match_time: matchData.matchTime,
        sport_id: matchData.sportId,
        skill_level: matchData.skillLevel,
        players_needed: matchData.playersNeeded,
        posted_by_user_id: userId
      };
      
      const { error } = await supabase
        .from('matches')
        .insert(payload);
        
      if (error) {
        throw error;
      }
      
    } catch (e: any) {
      console.error("❌ Error saving match: ", e);
      throw e;
    }
  }

  // Basic Bad Word Filter translated from BadWordFilter.shared in iOS
  containsBadWord(text: string): boolean {
    const defaultBadWords = ["fuck", "shit", "bitch", "asshole", "cunt", "nigger", "slut", "whore"];
    const lowerText = text.toLowerCase();
    
    for (const bad of defaultBadWords) {
        if (lowerText.includes(bad)) return true;
    }
    return false;
  }
}

export default new PostManager();
