import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '../../../theme/colors';
import { FontFamily } from '../../../theme/fonts';
import { supabase } from '../../../lib/supabase';
import UserProfileManager, {
  Profile,
  Team,
  SportWithSkill,
} from '../../../services/UserProfileManager';

export default function UserProfileScreen({ navigation, route }: any) {
  const colors = useColors();
  const userId = route?.params?.userId;

  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUserName, setCurrentUserName] = useState<string>('');

  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [userSports, setUserSports] = useState<SportWithSkill[]>([]);

  // Relationship states
  const [isFriend, setIsFriend] = useState(false);
  const [hasOutgoingRequest, setHasOutgoingRequest] = useState(false);
  const [hasIncomingRequest, setHasIncomingRequest] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isBlockedByUser, setIsBlockedByUser] = useState(false);

  const isDarkMode = colors.backgroundPrimary === '#000000' || colors.backgroundPrimary === '#121212';

  useEffect(() => {
    fetchInitialData();
  }, [userId]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }
      const cUserId = session.user.id;
      setCurrentUserId(cUserId);

      // Current user name
      const { data: cUser } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', cUserId)
        .single();
      
      setCurrentUserName(cUser?.name || 'User');

      await performFullFetch(cUserId, userId);
    } catch (error) {
      console.error('Error in initial setup:', error);
    } finally {
      setLoading(false);
    }
  };

  const performFullFetch = async (cUserId: string, tUserId: string) => {
    if (!tUserId) return;

    // 1. Profile
    const profile = await UserProfileManager.fetchProfile(tUserId);
    setUserProfile(profile);

    // 2. Block Status
    const blockStatus = await UserProfileManager.checkBlockStatus(cUserId, tUserId);
    setIsBlocked(blockStatus.isBlocked);
    setIsBlockedByUser(blockStatus.isBlockedByUser);

    // If blocked by them, stop fetching other things
    if (blockStatus.isBlockedByUser) return;

    // 3. Relationships (only if not blocked by them or if you blocked them)
    if (!blockStatus.isBlocked) {
      const relStatus = await UserProfileManager.checkRelationshipStatus(cUserId, tUserId);
      setIsFriend(relStatus.isFriend);
      setHasOutgoingRequest(relStatus.hasOutgoingRequest);
      setHasIncomingRequest(relStatus.hasIncomingRequest);
    }

    // 4. Teams & Sports
    const teams = await UserProfileManager.fetchTeams(tUserId);
    setUserTeams(teams);

    const sports = await UserProfileManager.fetchSports(tUserId);
    setUserSports(sports);
  };

  const handleMenuPress = () => {
    if (isBlockedByUser) return;

    const blockTitle = isBlocked ? 'Unblock User' : 'Block User';
    
    Alert.alert(
      'User Options',
      'Choose an action for this user',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: blockTitle, 
          style: isBlocked ? 'default' : 'destructive', 
          onPress: isBlocked ? confirmUnblockUser : confirmBlockUser 
        }
      ]
    );
  };

  const confirmBlockUser = () => {
    Alert.alert(
      'Block User',
      'Are you sure you want to block this user? They will no longer be able to contact you or see your profile.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes, Block', style: 'destructive', onPress: blockUser }
      ]
    );
  };

  const confirmUnblockUser = () => {
    Alert.alert(
      'Unblock User',
      'Are you sure you want to unblock this user? They will be able to contact you and see your profile again.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes, Unblock', style: 'default', onPress: unblockUser }
      ]
    );
  };

  const blockUser = async () => {
    setActionLoading(true);
    const success = await UserProfileManager.blockUser(currentUserId, userId);
    setActionLoading(false);
    
    if (success) {
      setIsBlocked(true);
      Alert.alert('User Blocked', 'This user has been blocked. They will no longer be able to interact with you.');
      performFullFetch(currentUserId, userId);
    } else {
      Alert.alert('Error', 'Failed to block user. Please try again.');
    }
  };

  const unblockUser = async () => {
    setActionLoading(true);
    const success = await UserProfileManager.unblockUser(currentUserId, userId);
    setActionLoading(false);
    
    if (success) {
      setIsBlocked(false);
      Alert.alert('User Unblocked', 'This user has been unblocked.');
      performFullFetch(currentUserId, userId);
    } else {
      Alert.alert('Error', 'Failed to unblock user. Please try again.');
    }
  };

  const handleActionPress = async () => {
    if (isBlocked) {
      confirmUnblockUser();
      return;
    }

    if (!isFriend && !hasOutgoingRequest && !hasIncomingRequest) {
      setActionLoading(true);
      const success = await UserProfileManager.sendFriendRequest(currentUserId, userId, currentUserName);
      setActionLoading(false);

      if (success) {
        setHasOutgoingRequest(true);
        Alert.alert('Success', 'Friend request sent successfully!');
      } else {
        Alert.alert('Error', 'Failed to send friend request. Please try again.');
      }
    }
  };

  const getActionConfig = () => {
    if (isBlocked) return { title: 'Unblock User', color: '#FF3B30', bgColor: colors.backgroundSecondary, interactive: true, width: 140 };
    if (isFriend) return { title: 'Friend', color: '#34C759', bgColor: colors.backgroundSecondary, interactive: false, width: 100 };
    if (hasIncomingRequest) return { title: 'Sent you a request', color: '#8E8E93', bgColor: colors.backgroundSecondary, interactive: false, width: 170 };
    if (hasOutgoingRequest) return { title: 'Request Sent', color: '#8E8E93', bgColor: colors.backgroundSecondary, interactive: false, width: 140 };
    return { title: 'Send Request', color: '#FFFFFF', bgColor: '#34C759', interactive: true, width: 140 };
  };

  const getSkillColor = (skill: string | null) => {
    switch (skill?.toLowerCase()) {
      case 'beginner': return '#007AFF';
      case 'intermediate': return '#FFCC00';
      case 'experienced': return '#FF9500';
      case 'advanced': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const actionConfig = getActionConfig();
  const isCurrentUser = userId === currentUserId;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundPrimary,
    },
    linearGradient: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      height: 150,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 10,
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
      borderWidth: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollViewContent: {
      paddingBottom: 40,
      minHeight: '100%',
    },
    blockedMessage: {
      color: '#FF3B30',
      fontSize: 18,
      textAlign: 'center',
      fontFamily: FontFamily.medium,
      marginTop: 40,
    },
    profileSection: {
      paddingHorizontal: 20,
    },
    pageTitle: {
      fontSize: 35,
      fontFamily: FontFamily.bold,
      color: colors.textPrimary,
      marginBottom: 20,
    },
    userHeaderBlock: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    avatarPlaceholder: {
      width: 85,
      height: 85,
      borderRadius: 42.5,
      backgroundColor: colors.backgroundSecondary,
      borderColor: colors.backgroundTertiary,
      borderWidth: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
      overflow: 'hidden',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    userInfoStack: {
      flex: 1,
      paddingTop: 6,
    },
    userName: {
      fontSize: 27,
      fontFamily: FontFamily.bold,
      color: colors.textPrimary,
      marginBottom: 4,
    },
    userSubText: {
      fontSize: 16,
      fontFamily: FontFamily.regular,
      color: colors.textPrimary,
      marginBottom: 2,
    },
    actionButton: {
      marginTop: 12,
      height: 30,
      borderRadius: 15,
      justifyContent: 'center',
      alignItems: 'center',
    },
    actionButtonText: {
      fontSize: 15,
      fontFamily: FontFamily.medium,
    },
    sectionTitle: {
      fontSize: 20,
      fontFamily: FontFamily.semiBold,
      color: colors.textPrimary,
      marginTop: 32,
      marginBottom: 16,
      paddingHorizontal: 20,
    },
    teamsStack: {
      paddingHorizontal: 20,
      gap: 12,
    },
    emptyLabel: {
      fontSize: 16,
      color: colors.textTertiary,
      textAlign: 'center',
    },
    teamCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
      borderColor: colors.backgroundTertiary,
      borderWidth: 1,
      borderRadius: 33,
      height: 65,
      paddingHorizontal: 12,
    },
    teamIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.backgroundTertiary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    teamLabel: {
      fontSize: 19,
      color: colors.textPrimary,
    },
    sportsStack: {
      paddingHorizontal: 20,
      gap: 16,
    },
    sportRow: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 55,
    },
    emojiContainer: {
      width: 65,
      height: 65,
      borderRadius: 32.5,
      borderWidth: 1,
      borderColor: isDarkMode ? '#000' : '#fff',
      backgroundColor: isDarkMode ? '#000' : '#fff',
      justifyContent: 'center',
      alignItems: 'center',
    },
    emojiText: {
      fontSize: 32,
    },
    skillBadge: {
      height: 30,
      borderRadius: 15,
      paddingHorizontal: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 24,
    },
    skillBadgeText: {
      color: '#fff',
      fontSize: 15,
      fontFamily: FontFamily.medium,
    }
  });

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.textPrimary} />
      </View>
    );
  }

  // Handle defaults
  const genderColor = userProfile?.gender === 'Male' ? '#007AFF' : userProfile?.gender === 'Female' ? '#FF2D55' : colors.textSecondary;
  const showBlockedView = isBlockedByUser;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(52, 199, 89, 0.18)', 'rgba(52, 199, 89, 0)']}
        style={styles.linearGradient}
      />
      
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={18} color="#34C759" />
          </TouchableOpacity>
          {!showBlockedView && (
            <TouchableOpacity style={styles.iconButton} onPress={handleMenuPress}>
              <Ionicons name="ellipsis-horizontal" size={18} color="#34C759" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          {showBlockedView ? (
            <View style={styles.profileSection}>
              <Text style={styles.pageTitle}>Profile</Text>
              <Text style={styles.blockedMessage}>This user has blocked you</Text>
              
              <View style={[styles.userHeaderBlock, { marginTop: 30, justifyContent: 'center' }]}>
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
                  <Ionicons name="person" size={36} color={colors.textTertiary} />
                </View>
                <View style={styles.userInfoStack}>
                  <Text style={styles.userName}>{userProfile?.name || 'User'}</Text>
                </View>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.profileSection}>
                <Text style={styles.pageTitle}>Profile</Text>
                
                <View style={styles.userHeaderBlock}>
                  <View style={styles.avatarPlaceholder}>
                    {userProfile?.profile_pic ? (
                      <Image source={{ uri: userProfile.profile_pic }} style={styles.avatarImage} />
                    ) : (
                      <Ionicons name="person" size={40} color={isDarkMode ? '#D1D1D6' : '#8E8E93'} />
                    )}
                  </View>
                  
                  <View style={styles.userInfoStack}>
                    <Text style={styles.userName}>{userProfile?.name || 'Loading...'}</Text>
                    <Text style={styles.userSubText}>
                      Age : {userProfile?.age !== null ? userProfile?.age : 'Not specified'}
                    </Text>
                    <Text style={[styles.userSubText, { color: genderColor }]}>
                      {userProfile?.gender || 'Not specified'}
                    </Text>

                    {!isCurrentUser && (
                      <TouchableOpacity 
                        style={[
                          styles.actionButton, 
                          { backgroundColor: actionConfig.bgColor, width: actionConfig.width },
                          actionLoading && { opacity: 0.7 }
                        ]}
                        disabled={!actionConfig.interactive || actionLoading}
                        onPress={handleActionPress}
                      >
                        {actionLoading ? (
                          <ActivityIndicator size="small" color={actionConfig.color} />
                        ) : (
                          <Text style={[styles.actionButtonText, { color: actionConfig.color }]}>
                            {actionConfig.title}
                          </Text>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Teams</Text>
              <View style={styles.teamsStack}>
                {userTeams.length === 0 ? (
                  <Text style={styles.emptyLabel}>Not a member of any teams</Text>
                ) : (
                  userTeams.map((team, index) => (
                    <View key={index} style={styles.teamCard}>
                      <View style={styles.teamIconContainer}>
                        <Ionicons name="people" size={20} color={isDarkMode ? '#D1D1D6' : '#8E8E93'} />
                      </View>
                      <Text style={styles.teamLabel}>{team.name}</Text>
                    </View>
                  ))
                )}
              </View>

              <Text style={styles.sectionTitle}>Preferred sports</Text>
              <View style={styles.sportsStack}>
                {userSports.length === 0 ? (
                  <Text style={styles.emptyLabel}>No preferred sports selected</Text>
                ) : (
                  userSports.map((sport, index) => (
                    <View key={index} style={styles.sportRow}>
                      <View style={[styles.emojiContainer, { position: 'relative' }]}>
                        <Text style={styles.emojiText}>{sport.emoji || '🏃‍♂️'}</Text>
                      </View>
                      <View style={[styles.skillBadge, { backgroundColor: getSkillColor(sport.skill_level) }]}>
                        <Text style={styles.skillBadgeText}>
                          {sport.skill_level || 'Beginner'}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
