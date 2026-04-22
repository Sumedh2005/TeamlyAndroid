import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '../../../theme/colors';
import { FontFamily, FontSize } from '../../../theme/fonts';
import EditTeamInfoScreen from './EditTeamInfoScreen';
import { supabase } from '../../../lib/supabase';

interface Profile {
  id: string;
  name: string | null;
  profile_pic: string | null;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
}

interface TeamMemberWithProfile {
  teamMember: TeamMember;
  profile: Profile;
  isCurrentUser: boolean;
  isCaptain: boolean;
}

export default function TeamInfoScreen({ route, navigation }: any) {
  const colors = useColors();
  const { team: initialTeam, teamId: initialTeamId } = route.params || {};

  const [team, setTeam] = useState(initialTeam);
  const [teamMembers, setTeamMembers] = useState<TeamMemberWithProfile[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);

  const isCurrentUserCaptain = team?.captain_id === currentUserId;

  const activeTeamId = initialTeam?.id || initialTeamId;

  useEffect(() => {
    loadData();
  }, [activeTeamId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setCurrentUserId(session.user.id);

      if (!activeTeamId) return;

      const { data: teamData } = await supabase
        .from('teams')
        .select('*')
        .eq('id', activeTeamId)
        .single();
        
      if (teamData) {
        setTeam(teamData);
      }

      const { data: membersData } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', activeTeamId);

      if (!membersData) {
        setTeamMembers([]);
        return;
      }

      const userIds = membersData.map((m: any) => m.user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      const combined: TeamMemberWithProfile[] = [];
      for (const member of membersData) {
        const profile = profilesData?.find((p: any) => p.id === member.user_id);
        if (profile) {
          combined.push({
            teamMember: member,
            profile,
            isCurrentUser: member.user_id === session.user.id,
            isCaptain: member.role === 'captain' || (teamData && member.user_id === teamData.captain_id),
          });
        }
      }
      setTeamMembers(combined);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSave = (updatedTeamName: string) => {
    setTeam({ ...team, name: updatedTeamName });
    setShowEdit(false);
    // Real save is simulated here, but since EditTeamInfoScreen has its own update, just refresh data
    loadData();
  };

  const removePlayer = (member: TeamMemberWithProfile) => {
    Alert.alert(
      'Remove Player',
      `Do you want to remove ${member.profile.name || 'Unknown'} from the team?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase
                .from('team_members')
                .delete()
                .eq('id', member.teamMember.id);
              loadData();
            } catch (err) {
              console.error(err);
              Alert.alert('Error', 'Failed to remove player.');
            }
          }
        }
      ]
    );
  };

  const deleteTeam = () => {
    Alert.alert(
      'Delete Team',
      'Are you sure you want to delete this team? This action cannot be undone and will remove all team members.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!team?.id) return;
              
              // Fetch matches
              const { data: matches } = await supabase
                .from('matches')
                .select('id')
                .or(`team_id.eq.${team.id},opponent_team_id.eq.${team.id}`);
                
              if (matches && matches.length > 0) {
                const matchIds = matches.map((m: any) => m.id);
                await supabase.from('match_rsvps').delete().in('match_id', matchIds);
                await supabase.from('match_requests').delete().in('match_id', matchIds);
                await supabase.from('matches').delete().in('id', matchIds);
              }
              
              await supabase
                .from('match_requests')
                .delete()
                .or(`challenging_team_id.eq.${team.id},challenged_team_id.eq.${team.id}`);
                
              await supabase.from('team_members').delete().eq('team_id', team.id);
              await supabase.from('teams').delete().eq('id', team.id);
              
              navigation.popToTop();
            } catch (err) {
              console.error(err);
              Alert.alert('Error', 'Failed to delete team.');
            }
          }
        }
      ]
    );
  };

  const leaveTeam = () => {
    Alert.alert(
      'Leave Team',
      'Do you want to leave this team?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              const currentUserMember = teamMembers.find(m => m.isCurrentUser);
              if (!currentUserMember) return;
              
              await supabase
                .from('team_members')
                .delete()
                .eq('id', currentUserMember.teamMember.id);
                
              navigation.popToTop();
            } catch (err) {
              console.error(err);
              Alert.alert('Error', 'Failed to leave team.');
            }
          }
        }
      ]
    );
  };

  // Section logic
  const captainMember = teamMembers.find(m => m.isCaptain);
  
  let captainList: TeamMemberWithProfile[] = [];
  let playersList: TeamMemberWithProfile[] = [];

  if (isCurrentUserCaptain) {
    const me = teamMembers.find(m => m.isCurrentUser);
    if (me) captainList.push(me);
    playersList = teamMembers
      .filter(m => !m.isCurrentUser)
      .sort((a, b) => (a.profile.name || '').localeCompare(b.profile.name || ''));
  } else {
    if (captainMember) captainList.push(captainMember);
    const others = teamMembers.filter(m => !m.isCaptain);
    const me = others.find(m => m.isCurrentUser);
    const theRest = others.filter(m => !m.isCurrentUser)
      .sort((a, b) => (a.profile.name || '').localeCompare(b.profile.name || ''));
    if (me) playersList.push(me);
    playersList = [...playersList, ...theRest];
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.backgroundPrimary },
    safeArea: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 12,
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
    editButton: {
      width: 60,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    editText: {
      fontSize: FontSize.md,
      fontFamily: FontFamily.medium,
      color: colors.systemGreen,
    },
    avatarSection: {
      alignItems: 'center',
      marginTop: 16,
      marginBottom: 20,
    },
    avatarCircle: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    teamName: {
      fontSize: 28,
      fontFamily: FontFamily.bold,
      color: colors.textPrimary,
      marginBottom: 6,
    },
    teamSubtitle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    teamSubtitleText: {
      fontSize: FontSize.sm,
      fontFamily: FontFamily.regular,
      color: colors.textSecondary,
    },
    dot: {
      fontSize: FontSize.sm,
      color: colors.textSecondary,
    },
    playersCount: {
      fontSize: FontSize.sm,
      fontFamily: FontFamily.regular,
      color: colors.systemGreen,
    },
    menuCard: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 20,
      marginHorizontal: 20,
      marginBottom: 24,
      overflow: 'hidden',
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 18,
    },
    menuIcon: {
      width: 32,
      marginRight: 14,
    },
    menuLabel: {
      flex: 1,
      fontSize: FontSize.md,
      fontFamily: FontFamily.regular,
      color: colors.textPrimary,
    },
    menuLabelRed: {
      flex: 1,
      fontSize: FontSize.md,
      fontFamily: FontFamily.regular,
      color: '#FF3B30',
    },
    menuDivider: {
      height: 0.5,
      backgroundColor: colors.backgroundTertiary,
      marginHorizontal: 20,
    },
    divider: {
      height: 0.5,
      backgroundColor: colors.backgroundTertiary,
      marginHorizontal: 20,
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: FontSize.lg,
      fontFamily: FontFamily.bold,
      color: colors.textPrimary,
      paddingHorizontal: 20,
      marginBottom: 12,
    },
    playerCard: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 16,
      marginHorizontal: 20,
      marginBottom: 8,
      paddingHorizontal: 16,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    playerAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.backgroundTertiary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    captainAvatar: {
      backgroundColor: colors.backgroundTertiary,
    },
    playerName: {
      flex: 1,
      fontSize: FontSize.md,
      fontFamily: FontFamily.medium,
      color: colors.textPrimary,
    },
    actionButtonWrapper: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.textPrimary} />
      </View>
    );
  }

  const renderPlayer = (member: TeamMemberWithProfile, isCaptainSection: boolean) => {
    let showDelete = false;
    let showLeave = false;

    if (isCurrentUserCaptain && !isCaptainSection) {
      showDelete = true;
    }
    if (!isCurrentUserCaptain && !isCaptainSection && member.isCurrentUser) {
      showLeave = true;
    }

    return (
      <View key={member.teamMember.id} style={styles.playerCard}>
        <View style={[styles.playerAvatar, isCaptainSection && styles.captainAvatar]}>
          <Ionicons name="person" size={22} color={colors.textTertiary} />
        </View>
        <Text style={styles.playerName}>
          {member.isCurrentUser ? 'You' : (member.profile.name || 'Unknown')}
        </Text>
        
        {showDelete && (
          <TouchableOpacity 
            style={[styles.actionButtonWrapper, { backgroundColor: `${'#FF3B30'}22` }]} 
            onPress={() => removePlayer(member)}
          >
            <Ionicons name="trash-outline" size={16} color="#FF3B30" />
          </TouchableOpacity>
        )}
        
        {showLeave && (
          <TouchableOpacity 
            style={[styles.actionButtonWrapper, { backgroundColor: `${'#FF3B30'}22` }]} 
            onPress={leaveTeam}
          >
            <Ionicons name="log-out-outline" size={16} color="#FF3B30" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
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
        <ScrollView showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={24} color={colors.systemGreen} />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>Team Info</Text>
            {isCurrentUserCaptain ? (
              <TouchableOpacity style={styles.editButton} onPress={() => setShowEdit(true)}>
                <Text style={styles.editText}>Edit</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 60 }} />
            )}
          </View>

          {/* Avatar + Name */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarCircle}>
              <Ionicons name="people-outline" size={52} color={colors.textTertiary} />
            </View>
            <Text style={styles.teamName}>{team?.name || 'Unknown Team'}</Text>
            <View style={styles.teamSubtitle}>
              <Text style={styles.teamSubtitleText}>Team</Text>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.playersCount}>{teamMembers.length} players</Text>
            </View>
          </View>

          {/* Menu Card */}
          <View style={styles.menuCard}>
            {isCurrentUserCaptain && (
              <>
                <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('AddPlayers', { team })}>
                  <View style={styles.menuIcon}>
                    <Ionicons name="person-add-outline" size={22} color={colors.textPrimary} />
                  </View>
                  <Text style={styles.menuLabel}>Add players</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                </TouchableOpacity>
                <View style={styles.menuDivider} />
              </>
            )}

            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('TeamMatches', { team })}>
              <View style={styles.menuIcon}>
                <Ionicons name="grid-outline" size={22} color={colors.textPrimary} />
              </View>
              <Text style={styles.menuLabel}>Matches</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </TouchableOpacity>

            {isCurrentUserCaptain && (
              <>
                <View style={styles.menuDivider} />
                <TouchableOpacity style={styles.menuItem} onPress={deleteTeam}>
                  <View style={styles.menuIcon}>
                    <Ionicons name="trash-outline" size={22} color="#FF3B30" />
                  </View>
                  <Text style={styles.menuLabelRed}>Delete Team</Text>
                  <Ionicons name="chevron-forward" size={18} color="#FF3B30" />
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={styles.divider} />

          {/* Captain */}
          <Text style={styles.sectionTitle}>Captain</Text>
          {captainList.map(member => renderPlayer(member, true))}

          <View style={[styles.divider, { marginTop: 12 }]} />

          {/* Players */}
          <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Players</Text>
          {playersList.map(member => renderPlayer(member, false))}

          <View style={{ height: 40 }} />
        </ScrollView>

        <EditTeamInfoScreen
  visible={showEdit}
  onClose={() => setShowEdit(false)}
  teamId={activeTeamId}        // ← use this instead of team?.id
  teamName={team?.name || ''}
  onSave={handleEditSave}
/>
      </SafeAreaView>
    </View>
  );
}