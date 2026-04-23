import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '../../../theme/colors';
import { FontFamily, FontSize } from '../../../theme/fonts';
import { supabase } from '../../../lib/supabase';
import ReportModal from '../report/ReportModal';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PlayerProfile {
  id: string;
  name: string | null;
  profile_pic: string | null;
}

interface Player {
  userId: string;
  name: string;
  profile: PlayerProfile | null;
  isFriend: boolean;
  isHost: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format a raw "HH:mm:ss" time string as "h:mm AM/PM" */
function formatTimeStr(timeStr: string): string {
  // Build a fake date so we can use toLocaleTimeString
  const d = new Date(`1970-01-01T${timeStr}`);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

/** Compute end time string = start + 1 hour */
function endTimeStr(startTimeStr: string): string {
  const d = new Date(`1970-01-01T${startTimeStr}`);
  d.setHours(d.getHours() + 1);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

/** Format "yyyy-MM-dd" date string as Today / Tomorrow / dd/MM/yy */
function formatDateStr(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (d.getTime() === today.getTime()) return 'Today';
  if (d.getTime() === tomorrow.getTime()) return 'Tomorrow';

  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
}


/** Combine match_date + match_time into a JS Date for upcoming/past check */
function matchDateTime(match: any): Date {
  return new Date(`${match.match_date}T${match.match_time || '00:00:00'}`);
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function TeamMatchInfoScreen({ navigation, route }: any) {
  const colors = useColors();
  const isDark = colors.isDark;

  const { match: rawMatch, team: currentTeam, opponentTeamName: resolvedOpponentName } = route.params ?? {};

  // -------- state --------
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [rsvpUserIds, setRsvpUserIds] = useState<string[]>([]);
  const [goingCount, setGoingCount] = useState<number>(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);

  // -------- derived from rawMatch --------
  const venue: string = rawMatch?.venue ?? 'Unknown Venue';
  const dateLabel = rawMatch?.match_date ? formatDateStr(rawMatch.match_date) : '';
  const timeLabel = rawMatch?.match_time
    ? `${formatTimeStr(rawMatch.match_time)} - ${endTimeStr(rawMatch.match_time)}`
    : '';
  const isChallenge: boolean = rawMatch?.match_type === 'team_challenge';
  // Use the pre-resolved opponent name passed from TeamMatchesScreen (already accounts for
  // whether we are team_id or opponent_team_id — mirrors Swift's opponentNameForDisplay logic)
  const opponentName: string | null = isChallenge ? (resolvedOpponentName ?? null) : null;
  const isUpcoming: boolean = rawMatch ? matchDateTime(rawMatch) > new Date() : false;
  const isCaptain: boolean =
    currentTeam?.captain_id != null && currentTeam.captain_id === currentUserId;

  // -------- load data --------
  const loadData = useCallback(async () => {
    if (!rawMatch) {
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      // 1. Get current user
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id ?? null;
      setCurrentUserId(userId);

      // 2. Fetch host profile
      const hostUserId: string = rawMatch.posted_by_user_id;
      const { data: hostData } = await supabase
        .from('profiles')
        .select('id, name, profile_pic')
        .eq('id', hostUserId)
        .single();

      // 3. Fetch RSVPs (going)
      const { data: rsvpData } = await supabase
        .from('match_rsvps')
        .select('user_id')
        .eq('match_id', rawMatch.id)
        .eq('rsvp_status', 'going');

      const rsvpIds: string[] = (rsvpData ?? []).map((r: any) => r.user_id);
      setRsvpUserIds(rsvpIds);

      // going count = rsvp count + 1 (host always going)
      setGoingCount(rsvpIds.length + 1);

      // 4. Fetch profiles for RSVP players
      let rsvpProfiles: PlayerProfile[] = [];
      if (rsvpIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, name, profile_pic')
          .in('id', rsvpIds);
        rsvpProfiles = profilesData ?? [];
      }

      // 5. Check friendships in parallel
      const checkFriend = async (otherId: string): Promise<boolean> => {
        if (!userId || userId === otherId) return false;
        const { data } = await supabase
          .from('friends')
          .select('id')
          .or(
            `and(user_id.eq.${userId},friend_id.eq.${otherId},status.eq.accepted),` +
            `and(user_id.eq.${otherId},friend_id.eq.${userId},status.eq.accepted)`
          )
          .limit(1);
        return (data?.length ?? 0) > 0;
      };

      // 6. Build host player
      let hostPlayer: Player | null = null;
      if (hostData) {
        const isHostFriend = await checkFriend(hostData.id);
        hostPlayer = {
          userId: hostData.id,
          name: hostData.name ?? 'Match Host',
          profile: hostData,
          isFriend: isHostFriend,
          isHost: true,
        };
      }

      // 7. Build RSVP players (with friendship check)
      const profileMap: Record<string, PlayerProfile> = {};
      rsvpProfiles.forEach(p => { profileMap[p.id] = p; });

      const rsvpPlayers: Player[] = await Promise.all(
        rsvpIds.map(async (uid) => {
          const prof = profileMap[uid] ?? null;
          const isFriend = await checkFriend(uid);
          const isHostAlso = uid === hostUserId;
          return {
            userId: uid,
            name: prof?.name ?? 'Unknown Player',
            profile: prof,
            isFriend,
            isHost: isHostAlso,
          };
        })
      );

      // 8. Combine: host at top, avoid duplicating if host also RSVPed
      let combined: Player[] = [];
      if (hostPlayer) {
        const hostAlreadyInRsvp = rsvpIds.includes(hostPlayer.userId);
        if (!hostAlreadyInRsvp) {
          combined = [hostPlayer, ...rsvpPlayers];
        } else {
          // Mark the host entry in rsvpPlayers as isHost = true
          combined = rsvpPlayers.map(p =>
            p.userId === hostPlayer!.userId ? { ...p, isHost: true } : p
          );
        }
      } else {
        combined = rsvpPlayers;
      }

      // 9. Sort: current user first
      combined.sort((a, _b) => (a.userId === userId ? -1 : 1));

      setAllPlayers(combined);
    } catch (err) {
      console.error('❌ TeamMatchInfoScreen loadData error:', err);
    } finally {
      setLoading(false);
    }
  }, [rawMatch?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // -------- join / leave --------
  const hasRSVPed = currentUserId ? rsvpUserIds.includes(currentUserId) : false;
  const isHost = currentUserId ? rawMatch?.posted_by_user_id === currentUserId : false;

  const handleJoin = async () => {
    if (!currentUserId || !rawMatch) return;
    setActionLoading(true);
    try {
      await supabase.from('match_rsvps').insert({
        match_id: rawMatch.id,
        user_id: currentUserId,
        rsvp_status: 'going',
      });
      await loadData();
    } catch (err) {
      console.error('❌ Join error:', err);
      Alert.alert('Error', 'Failed to join match. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!currentUserId || !rawMatch) return;
    setActionLoading(true);
    try {
      await supabase
        .from('match_rsvps')
        .delete()
        .eq('match_id', rawMatch.id)
        .eq('user_id', currentUserId);
      await loadData();
    } catch (err) {
      console.error('❌ Leave error:', err);
      Alert.alert('Error', 'Failed to leave match. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // -------- delete match --------
  const handleDelete = () => {
    Alert.alert(
      'Delete Match',
      'Are you sure you want to delete this match? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await supabase.from('match_rsvps').delete().eq('match_id', rawMatch.id);
              await supabase.from('match_requests').delete().eq('match_id', rawMatch.id);
              await supabase.from('matches').delete().eq('id', rawMatch.id);
              navigation.goBack();
            } catch (err) {
              console.error('❌ Delete error:', err);
              Alert.alert('Error', 'Failed to delete match. Please try again.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  // -------- three-dot menu --------
  const handleMenu = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: isCaptain ? ['Cancel', 'Delete Match'] : ['Cancel', 'Report'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 1,
        },
        (idx) => {
          if (idx === 1) {
            if (isCaptain) handleDelete();
            else setReportModalVisible(true);
          }
        }
      );
    } else {
      Alert.alert(
        '',
        '',
        isCaptain
          ? [
              { text: 'Delete Match', style: 'destructive', onPress: handleDelete },
              { text: 'Cancel', style: 'cancel' },
            ]
          : [
              { text: 'Report', style: 'destructive', onPress: () => setReportModalVisible(true) },
              { text: 'Cancel', style: 'cancel' },
            ]
      );
    }
  };

  // -------- styles --------
  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.backgroundPrimary },
    safeArea: { flex: 1 },

    // Header row
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 4,
    },
    backButton: {
      marginRight: 10,
    },
    headerTitle: {
      flex: 1,
      fontSize: 22,
      fontFamily: FontFamily.bold,
      color: colors.textPrimary,
    },
    menuBtn: {
      padding: 4,
    },
    venueName: {
      fontSize: 22,
      fontFamily: FontFamily.semiBold,
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: 20,
      paddingHorizontal: 20,
    },

    // Info card
    infoCard: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 28,
      marginHorizontal: 16,
      padding: 20,
      marginBottom: 28,
      gap: 16,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    infoText: {
      fontSize: FontSize.md,
      fontFamily: FontFamily.medium,
      color: colors.textPrimary,
    },

    // Divider
    divider: {
      height: 0.5,
      backgroundColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
      marginHorizontal: 20,
      marginBottom: 24,
    },

    // Players section
    sectionTitle: {
      fontSize: FontSize.lg,
      fontFamily: FontFamily.bold,
      color: colors.textPrimary,
      paddingHorizontal: 20,
      marginBottom: 12,
    },
    playersCard: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 28,
      marginHorizontal: 16,
      paddingVertical: 8,
      paddingHorizontal: 20,
      marginBottom: 100, // space for floating button
    },

    // Player row
    playerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
    },
    avatarCircle: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: colors.backgroundTertiary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    playerName: {
      flex: 1,
      fontSize: FontSize.md,
      fontFamily: FontFamily.semiBold,
      color: colors.textPrimary,
      marginLeft: 12,
    },
    friendTag: {
      fontSize: 12,
      fontFamily: FontFamily.semiBold,
      color: colors.systemGreen,
    },

    // Empty / loading
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 60,
    },
    emptyText: {
      fontSize: FontSize.md,
      fontFamily: FontFamily.medium,
      color: colors.textTertiary,
    },

    // Floating action button
    fab: {
      position: 'absolute',
      bottom: 28,
      alignSelf: 'center',
      width: 130,
      height: 46,
      borderRadius: 23,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
    },
    fabText: {
      fontSize: 17,
      fontFamily: FontFamily.semiBold,
      color: '#FFFFFF',
    },
  });

  // -------- render --------
  return (
    <View style={s.container}>
      <LinearGradient
        colors={['rgba(52, 199, 89, 0.18)', 'rgba(52, 199, 89, 0)']}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 150,
          zIndex: 0,
        }}
      />
      <SafeAreaView style={s.safeArea}>
        {/* Header */}
        <View style={s.headerRow}>
          <TouchableOpacity style={s.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={colors.systemGreen} />
          </TouchableOpacity>
          <Text style={s.headerTitle} numberOfLines={1}>Match Info</Text>
          <TouchableOpacity style={s.menuBtn} onPress={handleMenu}>
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.systemGreen} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={s.centered}>
            <ActivityIndicator size="large" color={colors.textPrimary} />
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Venue */}
            <Text style={s.venueName}>{venue}</Text>

            {/* Info Card */}
            <View style={s.infoCard}>
              {/* Date */}
              <View style={s.infoRow}>
                <Ionicons name="calendar-outline" size={20} color={colors.textTertiary} />
                <Text style={s.infoText}>{dateLabel}</Text>
              </View>

              {/* Time */}
              <View style={s.infoRow}>
                <Ionicons name="time-outline" size={20} color={colors.textTertiary} />
                <Text style={s.infoText}>{timeLabel}</Text>
              </View>

              {/* Opponent (team_challenge only) */}
              {isChallenge && opponentName ? (
                <View style={s.infoRow}>
                  <Ionicons name="flag" size={20} color={colors.textTertiary} />
                  <Text style={s.infoText}>{opponentName}</Text>
                </View>
              ) : null}

              {/* Going count */}
              <View style={s.infoRow}>
                <Ionicons name="people-outline" size={20} color={colors.textTertiary} />
                <Text style={s.infoText}>{goingCount} going</Text>
              </View>
            </View>

            <View style={s.divider} />

            {/* Players */}
            <Text style={s.sectionTitle}>Players</Text>
            <View style={s.playersCard}>
              {allPlayers.length === 0 ? (
                <Text style={[s.emptyText, { textAlign: 'center', paddingVertical: 20 }]}>
                  No players have joined yet
                </Text>
              ) : (
                allPlayers.map((player) => {
                  const isMe = player.userId === currentUserId;
                  return (
                    <TouchableOpacity
                      key={player.userId}
                      style={s.playerRow}
                      onPress={() => {
                        if (!isMe) {
                          navigation.navigate('UserProfileScreen', { userId: player.userId });
                        }
                      }}
                      activeOpacity={isMe ? 1 : 0.7}
                    >
                      <View style={s.avatarCircle}>
                        <Ionicons name="person" size={22} color={colors.textTertiary} />
                      </View>
                      <Text style={s.playerName}>
                        {isMe ? 'You' : player.name}
                      </Text>
                      {!isMe && player.isFriend ? (
                        <Text style={s.friendTag}>Friend</Text>
                      ) : null}
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </ScrollView>
        )}

        {/* Floating Action Button: Join / Leave */}
        {!loading && !isHost && isUpcoming ? (
          <TouchableOpacity
            style={[s.fab, { backgroundColor: hasRSVPed ? '#FF3B30' : '#34C759' }]}
            onPress={hasRSVPed ? handleLeave : handleJoin}
            disabled={actionLoading}
            activeOpacity={0.85}
          >
            {actionLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.fabText}>{hasRSVPed ? 'Leave' : 'Join'}</Text>
            )}
          </TouchableOpacity>
        ) : null}

        {/* Report Modal */}
        <ReportModal
          visible={reportModalVisible}
          onClose={() => setReportModalVisible(false)}
          reportType={{ type: 'match', id: rawMatch?.id }}
          currentUserId={currentUserId ?? ''}
        />
      </SafeAreaView>
    </View>
  );
}