import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../theme/colors';
import { FontFamily, FontSize } from '../../../theme/fonts';
import TeamMatchCellCard from '../../../components/TeamMatchCellCard';
import { supabase } from '../../../lib/supabase';

interface MatchData {
  id: string;
  venue: string;
  date: string;
  startTime: string;
  endTime: string;
  goingCount: number;
  isChallenge: boolean;
  challengerTeam?: string;
  originalData: any;
}

export default function TeamMatchesScreen({ navigation, route }: any) {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  
  const [upcomingMatches, setUpcomingMatches] = useState<MatchData[]>([]);
  const [pastMatches, setPastMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);

  const { team: routeTeam, teamId: routeTeamId } = route.params || {};
  const activeTeamId = routeTeam?.id || routeTeamId;

  useEffect(() => {
    fetchMatches();
  }, [activeTeamId]);

  const fetchMatches = async () => {
    if (!activeTeamId) return;
    setLoading(true);
    
    try {
      // The current backend actually natively loads this as 'teams!team_id(name)' because of foreign references
      const { data: matchesData, error } = await supabase
        .from('matches')
        .select(`
          *,
          team:teams!team_id(name),
          opponent_team:teams!opponent_team_id(name),
          sport:sports(name)
        `)
        .or(`team_id.eq.${activeTeamId},opponent_team_id.eq.${activeTeamId}`)
        .in('match_type', ['team_internal', 'team_challenge'])
        .order('match_date', { ascending: true })
        .order('match_time', { ascending: true });

      if (error) {
        throw error;
      }

      if (!matchesData || matchesData.length === 0) {
        setUpcomingMatches([]);
        setPastMatches([]);
        return;
      }

      // Concurrently query match_rsvps exactly as the Swift backend handles distinct counting
      const rsvpPromises = matchesData.map(async (m: any) => {
         const { count } = await supabase
           .from('match_rsvps')
           .select('*', { count: 'exact', head: true })
           .eq('match_id', m.id);
           
         return { ...m, players_rsvped: count || 0 };
      });

      const mappedMatches = await Promise.all(rsvpPromises);
      
      const currentDate = new Date();
      const upcoming: MatchData[] = [];
      const past: MatchData[] = [];

      mappedMatches.forEach((m) => {
        const matchDate = new Date(`${m.match_date}T${m.match_time || '00:00:00'}`);
        const isChallenge = m.match_type === 'team_challenge';
        
        // Correctly handle the opponent mapping exactly matching Swift logic
        let challengerTeam: string | undefined = undefined;
        if (isChallenge) {
           const currentTeamName = routeTeam?.name;
           if (currentTeamName) {
             if (m.opponent_team?.name === currentTeamName) {
                challengerTeam = m.team?.name;
             } else if (m.team?.name === currentTeamName) {
                // If team name matches current, the opponent name is correctly the opponent
                challengerTeam = m.opponent_team?.name;
             }
           } else {
             challengerTeam = m.opponent_team?.name;
           }
        }

        const dateStr = new Date(`${m.match_date}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '/');
        const startTimeStr = new Date(`${m.match_date}T${m.match_time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        const endTimeStr = m.end_time ? new Date(`${m.match_date}T${m.end_time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '1 hr'; 

        const formatted: MatchData = {
          id: m.id,
          venue: m.venue || 'Unknown Venue',
          date: dateStr,
          startTime: startTimeStr,
          endTime: endTimeStr,
          goingCount: m.players_rsvped,
          isChallenge,
          challengerTeam,
          originalData: m,
        };

        if (matchDate >= currentDate) {
          upcoming.push(formatted);
        } else {
          past.push(formatted);
        }
      });

      // Sort past matches exactly as Swift handles them (Most recent first temporally ascending backwards)
      past.sort((a, b) => {
         const dt1 = new Date(`${a.originalData.match_date}T${a.originalData.match_time || '00:00:00'}`);
         const dt2 = new Date(`${b.originalData.match_date}T${b.originalData.match_time || '00:00:00'}`);
         return dt2.getTime() - dt1.getTime();
      });

      setUpcomingMatches(upcoming);
      setPastMatches(past);
    } catch (err) {
       console.error("Error fetching matches:", err);
    } finally {
      setLoading(false);
    }
  };

  const currentMatches = activeTab === 'upcoming' ? upcomingMatches : pastMatches;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundPrimary,
    },
    safeArea: { flex: 1 },

    header: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 12,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 32,
      fontFamily: FontFamily.bold,
      color: colors.textPrimary,
      marginBottom: 16,
    },

    segmentContainer: {
      flexDirection: 'row',
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 50,
      padding: 4,
    },
    segmentButton: {
      flex: 1,
      height: 40,
      borderRadius: 50,
      justifyContent: 'center',
      alignItems: 'center',
    },
    segmentText: {
      fontSize: FontSize.sm,
      fontFamily: FontFamily.medium,
    },

    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 100,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 60,
    },
    emptyText: {
      fontSize: FontSize.md,
      fontFamily: FontFamily.medium,
      color: colors.textSecondary,
    }
  });

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={20} color={colors.systemGreen} />
          </TouchableOpacity>
          <Text style={styles.title}>Matches</Text>

          {/* Segmented Control */}
          <View style={styles.segmentContainer}>
            <TouchableOpacity
              style={[
                styles.segmentButton,
                {
                  backgroundColor:
                    activeTab === 'upcoming'
                      ? colors.backgroundPrimary
                      : 'transparent',
                },
              ]}
              onPress={() => setActiveTab('upcoming')}
            >
              <Text
                style={[
                  styles.segmentText,
                  {
                    color:
                      activeTab === 'upcoming'
                        ? colors.textPrimary
                        : colors.textTertiary,
                    fontFamily:
                      activeTab === 'upcoming'
                        ? FontFamily.semiBold
                        : FontFamily.regular,
                  },
                ]}
              >
                Upcoming
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segmentButton,
                {
                  backgroundColor:
                    activeTab === 'past'
                      ? colors.textPrimary
                      : 'transparent',
                },
              ]}
              onPress={() => setActiveTab('past')}
            >
              <Text
                style={[
                  styles.segmentText,
                  {
                    color:
                      activeTab === 'past'
                        ? colors.backgroundPrimary
                        : colors.textTertiary,
                    fontFamily:
                      activeTab === 'past'
                        ? FontFamily.semiBold
                        : FontFamily.regular,
                  },
                ]}
              >
                Past
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Match Cards Context Container */}
        {loading ? (
           <View style={styles.emptyState}>
             <ActivityIndicator size="large" color={colors.textPrimary} />
           </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {currentMatches.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  {activeTab === 'upcoming' ? 'No upcoming matches' : 'No past matches'}
                </Text>
              </View>
            ) : (
              currentMatches.map((match) => (
                <TeamMatchCellCard
                  key={match.id}
                  venue={match.venue}
                  date={match.date}
                  startTime={match.startTime}
                  endTime={match.endTime}
                  goingCount={match.goingCount}
                  isChallenge={match.isChallenge}
                  challengerTeam={match.challengerTeam}
                  onPress={() => navigation.navigate('TeamMatchInfo', { match: match.originalData })}
                />
              ))
            )}
          </ScrollView>
        )}

      </SafeAreaView>
    </View>
  );
}