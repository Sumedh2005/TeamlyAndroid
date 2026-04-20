import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { supabase } from '../../../lib/supabase';
import UserProfileManager, { Profile, Team, SportWithSkill } from '../../../services/UserProfileManager';
import { useColors } from '../../../theme/colors';
import { FontFamily } from '../../../theme/fonts';

export default function ProfileScreen({ navigation }: any) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isDarkMode = colors.backgroundPrimary === '#000000' || colors.backgroundPrimary === '#121212';

  // State
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [userSports, setUserSports] = useState<SportWithSkill[]>([]);

  // Function to reload data when returning to tab
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }
      
      const myId = session.user.id;
      setCurrentUserId(myId);

      // Concurrent fetch
      const [fetchedProfile, fetchedTeams, fetchedSports] = await Promise.all([
        UserProfileManager.fetchProfile(myId),
        UserProfileManager.fetchTeams(myId),
        UserProfileManager.fetchSports(myId),
      ]);

      if (fetchedProfile) setProfile(fetchedProfile);
      setUserTeams(fetchedTeams);
      setUserSports(fetchedSports);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Skill Color mappings exactly mapping Settings/Profile iOS
  const getSkillColor = (level: string | null) => {
    switch (level) {
      case 'Beginner': return '#007AFF'; // systemBlue
      case 'Intermediate': return '#FFCC00'; // systemYellow
      case 'Experienced': return '#FF9500'; // systemOrange
      case 'Advanced': return '#FF3B30'; // systemRed
      default: return '#8E8E93'; // systemGray
    }
  };

  const handleSettings = () => {
    navigation.navigate('Settings', {
      userProfile: profile,
      userSports: userSports,
      currentUserId: currentUserId,
      userTeams: userTeams
    });
  };

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
      height: 300,
    },
    scrollView: {
      flex: 1,
    },
    contentView: {
      paddingBottom: 40,
    },
    // Header
    headerContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      marginTop: insets.top > 0 ? insets.top : 20,
      height: 40,
    },
    headerTitle: {
      fontSize: 35,
      fontFamily: FontFamily.bold,
      color: colors.textPrimary,
    },
    settingsButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'flex-end',
    },
    // Profile Identity Block
    identityContainer: {
      marginTop: 16,
      paddingHorizontal: 16,
    },
    avatarWrapper: {
      width: 85,
      height: 85,
      borderRadius: 42.5,
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    },
    nameLabel: {
      fontSize: 35,
      fontFamily: FontFamily.bold,
      color: colors.textPrimary,
      marginTop: 8,
    },
    ageLabel: {
      fontSize: 16,
      fontFamily: FontFamily.regular,
      color: colors.textPrimary,
      marginTop: 4,
    },
    genderLabel: {
      fontSize: 16,
      fontFamily: FontFamily.regular,
      marginTop: 4,
    },
    // Sections
    sectionTitle: {
      fontSize: 20,
      fontFamily: FontFamily.semiBold,
      color: colors.textPrimary,
      marginTop: 32,
      paddingHorizontal: 16,
    },
    listContainer: {
      marginTop: 16,
      paddingHorizontal: 20,
      gap: 12,
    },
    emptyLabel: {
      fontSize: 16,
      fontFamily: FontFamily.regular,
      color: colors.textTertiary,
      textAlign: 'center',
      marginTop: 8,
    },
    // Team Cards
    teamCard: {
      height: 65,
      borderRadius: 33,
      borderWidth: 0.6,
      borderColor: colors.backgroundTertiary,
      backgroundColor: colors.backgroundSecondary,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
    },
    teamIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.backgroundTertiary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    teamLabel: {
      fontSize: 19,
      fontFamily: FontFamily.regular,
      color: colors.textPrimary,
      marginLeft: 12,
      flex: 1,
    },
    // Sport Rows
    sportRow: {
      height: 55,
      flexDirection: 'row',
      alignItems: 'center',
    },
    emojiContainer: {
      width: 55,
      height: 55, // Making it perfectly round proportional
      borderRadius: 27.5,
      borderWidth: 0.6,
      borderColor: isDarkMode ? '#000' : '#FFF',
      backgroundColor: isDarkMode ? '#000': '#FFF',
      justifyContent: 'center',
      alignItems: 'center',
    },
    emojiText: {
      fontSize: 32,
    },
    badgeContainer: {
      height: 30,
      borderRadius: 15,
      marginLeft: 24,
      paddingHorizontal: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    badgeText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontFamily: FontFamily.medium,
    },
    centered: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
    }
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDarkMode ? ['rgba(0, 38, 0, 1)', 'transparent'] : ['rgba(53, 199, 89, 0.3)', 'transparent']}
        style={styles.linearGradient}
      />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contentView}>
          
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>My Profile</Text>
            <TouchableOpacity hitSlop={15} style={styles.settingsButton} onPress={handleSettings}>
              <Ionicons name="settings" size={26} color={isDarkMode ? '#32D74B' : '#34C759'} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={{height: 200, justifyContent: 'center'}}>
              <ActivityIndicator size="large" color={colors.textPrimary} />
            </View>
          ) : (
            <>
              {/* Profile Top Block */}
              <View style={styles.identityContainer}>
                <View style={styles.avatarWrapper}>
                  {profile?.profile_pic ? (
                    <Image source={{ uri: profile.profile_pic }} style={styles.avatarImage} />
                  ) : (
                    <Ionicons name="person" size={40} color={colors.textTertiary} />
                  )}
                </View>
                <Text style={styles.nameLabel}>{profile?.name || 'Loading...'}</Text>
                <Text style={styles.ageLabel}>Age : {profile?.age ? profile.age : 'Not specified'}</Text>
                <Text style={[styles.genderLabel, {
                  color: profile?.gender === 'Male' ? '#007AFF' : profile?.gender === 'Female' ? '#FF2D55' : '#8E8E93'
                }]}>
                  {profile?.gender || 'Not specified'}
                </Text>
              </View>

              {/* Teams Section */}
              <Text style={styles.sectionTitle}>Teams</Text>
              <View style={styles.listContainer}>
                {userTeams.length === 0 ? (
                  <Text style={styles.emptyLabel}>Not a member of any teams</Text>
                ) : (
                  userTeams.map(team => (
                    <View key={team.id} style={styles.teamCard}>
                      <View style={styles.teamIconContainer}>
                        <Ionicons name="people" size={20} color={colors.textTertiary} />
                      </View>
                      <Text style={styles.teamLabel} numberOfLines={1}>{team.name}</Text>
                    </View>
                  ))
                )}
              </View>

              {/* Sports Section */}
              <Text style={styles.sectionTitle}>Preferred sports</Text>
              <View style={styles.listContainer}>
                {userSports.length === 0 ? (
                  <Text style={styles.emptyLabel}>No preferred sports selected</Text>
                ) : (
                  userSports.map(sport => (
                    <View key={sport.id} style={styles.sportRow}>
                      <View style={styles.emojiContainer}>
                        <Text style={styles.emojiText}>{sport.emoji || '🏃‍♂️'}</Text>
                      </View>
                      <View style={[styles.badgeContainer, { backgroundColor: getSkillColor(sport.skill_level) }]}>
                        <Text style={styles.badgeText}>{sport.skill_level || 'Unknown'}</Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}