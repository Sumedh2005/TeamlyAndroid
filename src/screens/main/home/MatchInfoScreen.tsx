import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../theme/colors';
import { FontFamily, FontSize } from '../../../theme/fonts';
import MatchInfoManager, { Profile, PlayerWithProfile } from '../../../services/MatchInfoManager';
import { DBMatch } from '../../../services/HomeManager';
import { supabase } from '../../../lib/supabase';
import ReportModal from '../report/ReportModal';

const SKILL_COLORS: Record<string, string> = {
  beginner: 'rgba(90, 200, 250, 0.7)',
  intermediate: 'rgba(255, 204, 0, 0.7)',
  experienced: 'rgba(255, 149, 0, 0.7)',
  advanced: 'rgba(255, 59, 48, 0.7)',
};

export default function MatchInfoScreen({ navigation, route }: any) {
  const colors = useColors();
  const { match: rawMatch } = route.params;
  const initialMatch: DBMatch = {
    ...rawMatch,
    matchDate: new Date(rawMatch.matchDate),
    matchTime: new Date(rawMatch.matchTime),
    createdAt: new Date(rawMatch.createdAt),
  };

  const [match, setMatch] = useState<DBMatch>(initialMatch);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [hostProfile, setHostProfile] = useState<Profile | null>(null);
  const [rsvpPlayers, setRsvpPlayers] = useState<PlayerWithProfile[]>([]);
  const [isHostFriend, setIsHostFriend] = useState<boolean>(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const uid = await MatchInfoManager.fetchCurrentUserId();
      setCurrentUserId(uid);
      await loadMatchData(uid);
    } catch (error) {
      console.error('Error fetching initial match info', error);
      Alert.alert('Error', 'Failed to load match information');
    } finally {
      setLoading(false);
    }
  };

  const loadMatchData = async (uid: string) => {
    try {
      // Fetch host profile
      const hProfile = await MatchInfoManager.fetchHostProfile(match);
      setHostProfile(hProfile);

      // Fetch RSVPs
      const players = await MatchInfoManager.fetchRSVPPlayers(match, uid);
      
      // Sort players: Current user first, then alphabetically
      players.sort((a, b) => {
        if (a.userId === uid) return -1;
        if (b.userId === uid) return 1;
        return a.name.localeCompare(b.name);
      });
      setRsvpPlayers(players);

      // Check host friendship
      const isFriend = await MatchInfoManager.checkFriendshipWithHost(match, uid);
      setIsHostFriend(isFriend);

      // Also refresh the RSVP count just in case it differs
      const updatedCount = await MatchInfoManager.fetchPlayersRSVPCount(match.id);
      setMatch(prev => ({ ...prev, playersRSVPed: updatedCount }));

    } catch (error) {
      console.error('Error loading full match data', error);
      Alert.alert('Error', 'Failed to load match details');
    }
  };

  const isHost = match.postedByUserId === currentUserId;
  const hasRSVPed = rsvpPlayers.some(p => p.userId === currentUserId);
  
  // Calculate if match is upcoming
  const isMatchUpcoming = () => {
    const matchDateStr = match.matchDate.toISOString().split('T')[0];
    const matchTimeStr = match.matchTime.toISOString().split('T')[1];
    const matchDateTime = new Date(`${matchDateStr}T${matchTimeStr}`);
    return matchDateTime > new Date();
  };

  const handleJoinOrLeave = async () => {
    if (isHost || !isMatchUpcoming() || actionLoading) return;

    setActionLoading(true);
    try {
      if (hasRSVPed) {
        await MatchInfoManager.leaveMatch(match.id, currentUserId);
        Alert.alert('Success', 'Successfully left the match!');
      } else {
        await MatchInfoManager.joinMatch(match.id, currentUserId);
        Alert.alert('Success', 'Successfully joined the match!');
      }
      // Refresh Data
      await loadMatchData(currentUserId);
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', `Failed to ${hasRSVPed ? 'leave' : 'join'} match: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDeleteMatch = () => {
    Alert.alert(
      'Delete Match',
      'Are you sure you want to delete this match? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: deleteMatch }
      ]
    );
  };

  const deleteMatch = async () => {
    setActionLoading(true);
    try {
      // Delete RSVPs explicitly just to be safe (supabase cascade might do it but following swift logic)
      await supabase.from('match_rsvps').delete().eq('match_id', match.id);
      // Delete Match
      await supabase.from('matches').delete().eq('id', match.id);
      
      navigation.goBack();
    } catch (error) {
      console.error('Delete error', error);
      Alert.alert('Error', 'Failed to delete match. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const showReportModal = () => {
    setReportModalVisible(true);
  };

  const handleMenuPress = () => {
    if (isHost) {
      Alert.alert(
        'Match Options',
        'Choose an action for your match',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete Match', style: 'destructive', onPress: confirmDeleteMatch }
        ]
      );
    } else {
      Alert.alert(
        'Match Options',
        'Choose an action',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Report Match', style: 'destructive', onPress: showReportModal }
        ]
      );
    }
  };

  const navigateToProfile = (userId: string) => {
    if (!userId || userId === currentUserId) return;
    navigation.navigate('UserProfileScreen', { userId });
  };

  // Helper date/time formatters
  const formatDate = (dateString: Date): string => {
    const date = new Date(dateString);
    if (new Date().toDateString() === date.toDateString()) return 'Today';
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (tomorrow.toDateString() === date.toDateString()) return 'Tomorrow';

    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear().toString().slice(-2);
    return `${d}/${m}/${y}`;
  };

  const formatTimeRange = (timeString: Date): string => {
    const startObj = new Date(timeString);
    const endObj = new Date(startObj.getTime() + 60 * 60 * 1000);

    const format = (d: Date) => {
      const h = d.getUTCHours();
      const m = d.getUTCMinutes();
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
    };

    return `${format(startObj)} - ${format(endObj)}`;
  };

  const filledRatio = Math.max(0, Math.min(1, match.playersRSVPed / match.playersNeeded));
  const progressColor = filledRatio <= 0.33 ? colors.systemGreen : (filledRatio <= 0.66 ? '#FFD60A' : '#FF3B30');

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundPrimary,
    },
    safeArea: {
      flex: 1,
    },
    // Header
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: 20,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    moreButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: 22,
      fontFamily: FontFamily.bold,
      color: colors.textPrimary,
      flex: 1,
      textAlign: 'center',
    },
    venueName: {
      fontSize: 24,
      fontFamily: FontFamily.semiBold,
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: 20,
    },

    // Info Card
    infoCard: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 35,
      marginHorizontal: 16,
      padding: 20,
      marginBottom: 30,
      gap: 16,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    infoText: {
      fontSize: 17,
      fontFamily: FontFamily.medium,
      color: colors.textPrimary,
    },
    skillBadge: {
      paddingHorizontal: 15,
      paddingVertical: 4,
      borderRadius: 12,
      minWidth: 120,
      alignItems: 'center',
      justifyContent: 'center',
    },
    skillText: {
      fontSize: 14,
      fontFamily: FontFamily.semiBold,
      color: colors.primaryWhite,
    },
    progressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    progressBarBg: {
      width: 200,
      height: 7,
      backgroundColor: colors.backgroundTertiary,
      borderRadius: 4,
    },
    progressBarFill: {
      height: 7,
      borderRadius: 4,
      backgroundColor: progressColor,
    },
    progressText: {
      fontSize: 16,
      fontFamily: FontFamily.medium,
      color: colors.textPrimary,
      marginLeft: 'auto',
    },

    // Divider
    divider: {
      height: 0.5,
      backgroundColor: colors.textTertiary,
      opacity: 0.3,
      marginHorizontal: 20,
      marginBottom: 30,
    },

    // Section
    sectionTitle: {
      fontSize: 18,
      fontFamily: FontFamily.bold,
      color: colors.textPrimary,
      paddingHorizontal: 40,
      marginBottom: 12,
    },
    
    sectionContainer: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 35,
      marginHorizontal: 16,
      paddingVertical: 16,
      paddingHorizontal: 20,
      marginBottom: 30,
    },

    // Player Row
    playerCard: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 56,
    },
    avatarCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.backgroundTertiary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    playerName: {
      fontSize: 16,
      fontFamily: FontFamily.semiBold,
      color: colors.textPrimary,
      marginLeft: 12,
    },
    friendTag: {
      fontSize: 12,
      fontFamily: FontFamily.semiBold,
      color: colors.systemGreen,
      backgroundColor: colors.backgroundPrimary,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },

    // Join Button
    joinButtonContainer: {
      paddingBottom: 40,
      paddingTop: 10,
      alignItems: 'center'
    },
    joinButton: {
      width: 110,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    joinButtonText: {
      fontSize: 17,
      fontFamily: FontFamily.semiBold,
      color: 'white',
    },
    emptyStateText: {
      textAlign: 'center',
      color: colors.textTertiary,
      fontFamily: FontFamily.medium,
      fontSize: 16,
      paddingVertical: 10,
    }
  });

  return (
    <View style={styles.container}>
      {/* Green tint gradient at top */}
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
      <SafeAreaView style={styles.safeArea}>
      
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={20} color={colors.systemGreen} />
          </TouchableOpacity>
          <Text style={styles.title}>Match Info</Text>
          <TouchableOpacity style={styles.moreButton} onPress={handleMenuPress}>
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.systemGreen} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <ActivityIndicator size="large" color={colors.textPrimary} />
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            
            {/* Venue */}
            <View style={{height: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 15}}>
              <Text style={styles.venueName}>{match.venue}</Text>
            </View>

            {/* Match Details Card */}
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="football" size={18} color={colors.textTertiary} />
                <Text style={styles.infoText}>{match.sportName}</Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="calendar" size={18} color={colors.textTertiary} />
                <Text style={styles.infoText}>{formatDate(match.matchDate)}</Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="time" size={18} color={colors.textTertiary} />
                <Text style={styles.infoText}>{formatTimeRange(match.matchTime)}</Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="speedometer" size={18} color={colors.textTertiary} />
                <View style={[
                  styles.skillBadge,
                  { backgroundColor: SKILL_COLORS[match.skillLevel?.toLowerCase() || 'beginner'] || 'gray' }
                ]}>
                  <Text style={styles.skillText}>
                    {match.skillLevel ? match.skillLevel.charAt(0).toUpperCase() + match.skillLevel.slice(1) : 'Not specified'}
                  </Text>
                </View>
              </View>

              <View style={styles.progressRow}>
                <Ionicons name="people" size={23} color={colors.textTertiary} style={{marginLeft: -2.5}} />
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${filledRatio * 100}%` }]} />
                </View>
                <Text style={styles.progressText}>{match.playersRSVPed}/{match.playersNeeded}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Hosted By */}
            <Text style={styles.sectionTitle}>Hosted by</Text>
            <View style={styles.sectionContainer}>
              <View style={[styles.playerCard, {height: 50}]}>
                <View style={styles.avatarCircle}>
                  <Ionicons name="person" size={25} color={colors.textTertiary} />
                </View>
                <TouchableOpacity style={{flex: 1, justifyContent: 'center'}} onPress={() => !isHost && navigateToProfile(match.postedByUserId)}>
                  <Text style={styles.playerName}>{isHost ? 'You' : (hostProfile?.name || match.postedByName)}</Text>
                </TouchableOpacity>
                {!isHost && isHostFriend && (
                  <Text style={styles.friendTag}>Friend</Text>
                )}
              </View>
            </View>

            <View style={styles.divider} />

            {/* Players */}
            <Text style={styles.sectionTitle}>Players</Text>
            <View style={[styles.sectionContainer, {minHeight: 100}]}>
              {rsvpPlayers.length === 0 ? (
                <Text style={styles.emptyStateText}>No Players have joined yet</Text>
              ) : (
                rsvpPlayers.map((player, index) => (
                  <View key={player.userId} style={[styles.playerCard, index !== rsvpPlayers.length - 1 && {marginBottom: 12}]}>
                    <View style={styles.avatarCircle}>
                      <Ionicons name="person" size={25} color={colors.textTertiary} />
                    </View>
                    <TouchableOpacity style={{flex: 1, justifyContent: 'center'}} onPress={() => navigateToProfile(player.userId)}>
                      <Text style={styles.playerName}>{player.userId === currentUserId ? 'You' : player.name}</Text>
                    </TouchableOpacity>
                    {player.userId !== currentUserId && player.isFriend && (
                      <Text style={styles.friendTag}>Friend</Text>
                    )}
                  </View>
                ))
              )}
            </View>

            {/* Join / Leave Button */}
            {!isHost && isMatchUpcoming() && (
              <View style={styles.joinButtonContainer}>
                <TouchableOpacity 
                  style={[
                    styles.joinButton, 
                    { backgroundColor: hasRSVPed ? '#FF3B30' : '#34C759' },
                    actionLoading && { opacity: 0.7 }
                  ]}
                  onPress={handleJoinOrLeave}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.joinButtonText}>{hasRSVPed ? 'Leave' : 'Join'}</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

          </ScrollView>
        )}

        <ReportModal
          visible={reportModalVisible}
          onClose={() => setReportModalVisible(false)}
          reportType={{ type: 'match', id: match.id }}
          currentUserId={currentUserId}
        />
      </SafeAreaView>
    </View>
  );
}