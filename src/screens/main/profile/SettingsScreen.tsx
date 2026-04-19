import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useColors } from '../../../theme/colors';
import { FontFamily } from '../../../theme/fonts';
import AuthManager from '../../../lib/AuthManager';
import { supabase } from '../../../lib/supabase';
import UserProfileManager, { Profile } from '../../../services/UserProfileManager';

// Helper component for List Cells
const ListCell = ({ icon, title, isDestructive, onPress, isDarkMode, colors, showChevron = true }: any) => (
  <TouchableOpacity
    style={[
      styles.cell,
      { backgroundColor: isDarkMode ? colors.backgroundSecondary : colors.backgroundPrimary }
    ]}
    onPress={onPress}
  >
    <View style={styles.cellLeft}>
      {icon}
      <Text style={[styles.cellTitle, { color: isDestructive ? colors.systemRed : colors.textPrimary }]}>
        {title}
      </Text>
    </View>
    {showChevron && (
      <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
    )}
  </TouchableOpacity>
);

export default function SettingsScreen({ navigation, route }: any) {
  const colors = useColors();
  const isDarkMode = colors.backgroundPrimary === '#000000' || colors.backgroundPrimary === '#121212';
  const { currentUserId } = route.params || {};

  const [userProfile, setUserProfile] = useState<Profile | null>(route.params?.userProfile || null);
  const [isDeleting, setIsDeleting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (currentUserId) {
        UserProfileManager.fetchProfile(currentUserId).then(data => setUserProfile(data));
      }
    }, [currentUserId])
  );

  const handleBack = () => {
    navigation.goBack();
  };

  const name = userProfile?.name || 'Loading...';
  const profilePic = userProfile?.profile_pic;

  // Actions
  const handleEditProfile = () => {
    navigation.navigate('EditProfile', { 
      userProfile, 
      currentUserId 
    });
  };

  const handleTerms = () => {
    Linking.openURL('https://aditionkar.github.io/Teamly-website/');
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Log Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await AuthManager.signOut();
              navigation.reset({ index: 0, routes: [{ name: 'Landing' }] });
            } catch (error) {
              Alert.alert('Error', 'Failed to log out.');
            }
          }
        }
      ]
    );
  };

  const performDeleteCascade = async () => {
    if (!currentUserId) return;
    setIsDeleting(true);
    
    try {
      // 1. Get user teams
      const { data: userTeams } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", currentUserId);
      
      const teamIds = userTeams?.map((t: any) => t.team_id) || [];

      // 2. Clear match requests where teams are involved
      for (const teamId of teamIds) {
        await supabase.from("match_requests").delete().eq("challenging_team_id", teamId);
        await supabase.from("match_requests").delete().eq("challenged_team_id", teamId);
      }

      // 3-10: Bulk cascade deletes
      await Promise.all([
        supabase.from("team_members").delete().eq("user_id", currentUserId),
        supabase.from("user_preferred_sports").delete().eq("user_id", currentUserId),
        supabase.from("friends").delete().or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`),
        supabase.from("match_rsvps").delete().eq("user_id", currentUserId),
        supabase.from("notifications").delete().or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`),
        supabase.from("matches").delete().eq("posted_by_user_id", currentUserId),
        supabase.from("teams").delete().eq("captain_id", currentUserId),
      ]);

      for (const teamId of teamIds) {
         await supabase.from("team_match_participants").delete().eq("team_id", teamId);
      }

      // 11. Core deletes
      await supabase.from("profiles").delete().eq("id", currentUserId);
      await supabase.rpc('delete_user');

      Alert.alert('Account Deleted', 'Your account has been permanently deleted.', [
        {
          text: 'OK',
          onPress: async () => {
            await AuthManager.signOut();
            navigation.reset({ index: 0, routes: [{ name: 'Landing' }] });
          }
        }
      ]);
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', 'Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: () => {
            // Second confirmation loop simulating the strict check
            Alert.alert(
              'Final Confirmation',
              'This is absolutely irreversible. Are you 100% sure you want to destroy your account?',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Yes, Delete',
                  style: 'destructive',
                  onPress: performDeleteCascade
                }
              ]
            );
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDarkMode ? ['rgba(0, 38, 0, 1)', 'transparent'] : ['rgba(53, 199, 89, 0.3)', 'transparent']}
        style={styles.linearGradient}
      />
      <SafeAreaView style={styles.safeArea}>
        
        {/* Top Header Row with Glass Back */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack} disabled={isDeleting}>
            <Ionicons name="chevron-back" size={20} color={isDarkMode ? '#34C759' : '#34C759'} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          
          {/* Settings Identity Info */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarWrapper}>
              {profilePic ? (
                <Image source={{ uri: profilePic }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person" size={50} color={colors.textTertiary} />
              )}
            </View>
            <Text style={styles.profileName}>{name}</Text>
          </View>

          {/* Account Section */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Account</Text>
            <View style={styles.sectionGroup}>
              <ListCell 
                title="Edit Profile"
                icon={<Ionicons name="id-card" size={22} color="#007AFF" style={styles.cellIcon} />}
                onPress={handleEditProfile}
                isDarkMode={isDarkMode}
                colors={colors}
              />
            </View>
          </View>

          {/* Support Section */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Support</Text>
            <View style={styles.sectionGroup}>
              <ListCell 
                title="Terms & Privacy"
                icon={<Ionicons name="document-text" size={22} color="#8E8E93" style={styles.cellIcon} />}
                onPress={handleTerms}
                isDarkMode={isDarkMode}
                colors={colors}
              />
            </View>
          </View>

          {/* Actions Section */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Actions</Text>
            <View style={styles.sectionGroup}>
              <ListCell 
                title="Logout"
                icon={<Ionicons name="log-out" size={22} color="#FF3B30" style={styles.cellIcon} />}
                isDestructive={true}
                onPress={handleLogout}
                isDarkMode={isDarkMode}
                colors={colors}
              />
              <View style={styles.separator} />
              <ListCell 
                title="Delete Account"
                icon={<Ionicons name="trash" size={22} color="#FF3B30" style={styles.cellIcon} />}
                isDestructive={true}
                onPress={handleDeleteAccount}
                isDarkMode={isDarkMode}
                colors={colors}
              />
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>

      {isDeleting && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={{color: '#FFF', marginTop: 12, fontFamily: FontFamily.semiBold}}>Deleting...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  linearGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 300,
  },
  safeArea: {
    flex: 1,
  },
  headerRow: {
    paddingHorizontal: 20,
    paddingTop: 8,
    alignItems: 'flex-start',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(0,0,0,0.1)',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 12,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  profileName: {
    fontSize: 22,
    fontFamily: FontFamily.bold,
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    fontSize: 18,
    fontFamily: FontFamily.semiBold,
    marginBottom: 8,
    marginLeft: 16,
    color: '#8E8E93',
  },
  sectionGroup: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  cell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  cellLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cellIcon: {
    marginRight: 12,
  },
  cellTitle: {
    fontSize: 16,
    fontFamily: FontFamily.medium,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginLeft: 50, // aligns after icon
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  }
});
