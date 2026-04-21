import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useColors } from '../../../theme/colors';
import { FontFamily, FontSize } from '../../../theme/fonts';
import MatchCellCard from '../../../components/MatchCellCard';
import PostScreen from '../post/PostScreen';
import HomeManager, { Sport, DBMatch, College } from '../../../services/HomeManager';
import { supabase } from '../../../lib/supabase';

// Helper to format date "yyyy-mm-dd" to "dd/mm/yy" or similar
const formatDate = (dateString: Date): string => {
  const date = new Date(dateString);
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear().toString().slice(-2);
  return `${d}/${m}/${y}`;
};

const formatTime = (timeString: Date): string => {
  const date = new Date(timeString);
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

const formatEndTime = (timeString: Date): string => {
  // Assuming matches are 1 hour long for now if not specified.
  const date = new Date(timeString);
  const hours = date.getUTCHours() + 1; // add 1 hour
  const minutes = date.getUTCMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

export default function HomeScreen({ navigation }: any) {
  const colors = useColors();

  // State
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [userCollege, setUserCollege] = useState<College | null>(null);
  const [sports, setSports] = useState<Sport[]>([]);
  const [preferredSports, setPreferredSports] = useState<Sport[]>([]);
  const [preferredSportsMatches, setPreferredSportsMatches] = useState<Record<string, DBMatch[]>>({});
  const [selectedSportId, setSelectedSportId] = useState<number>(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [showPost, setShowPost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [reminderMessage, setReminderMessage] = useState<string | null>(null);

  const sportsScrollRef = useRef<ScrollView>(null);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const userId = session.user.id;
      setCurrentUserId(userId);

      const userProfile = await HomeManager.fetchUserProfile(userId);
      if (!userProfile) {
        setLoading(false);
        return;
      }

      const college = await HomeManager.fetchCollege(userProfile.college_id);
      if (college) setUserCollege(college);

      const allSports = await HomeManager.fetchAllSports();
      const preferredSportsData = await HomeManager.fetchUserPreferredSports(userId);

      const userPreferredSports: Sport[] = [];
      const preferredSportIds = new Set<number>();
      for (const pref of preferredSportsData) {
        const sport = allSports.find(s => s.id === pref.sport_id);
        if (sport) {
          userPreferredSports.push(sport);
          preferredSportIds.add(sport.id);
        }
      }
      setPreferredSports(userPreferredSports);

      const sortedSports = [...allSports].sort((sport1, sport2) => {
        const isSport1Pref = preferredSportIds.has(sport1.id);
        const isSport2Pref = preferredSportIds.has(sport2.id);

        if (isSport1Pref && !isSport2Pref) return -1;
        if (!isSport1Pref && isSport2Pref) return 1;
        return sport1.id - sport2.id;
      });

      setSports(sortedSports);

      const initialSport = userPreferredSports.length > 0 ? userPreferredSports[0] : sortedSports[0];
      if (initialSport) {
        setSelectedSportId(initialSport.id);
        const dbMatches = await HomeManager.fetchMatchesForSport(
          initialSport.id,
          userProfile.college_id,
          userId
        );
        setPreferredSportsMatches(prev => ({ ...prev, [initialSport.name]: dbMatches }));
      }

      await checkForUpcomingMatches(userId);
      setLoading(false);

    } catch (error) {
      console.error('Error fetching home data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!loading && currentUserId) {
        checkForUpcomingMatches(currentUserId);
      }
    }, [loading, currentUserId])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  const checkForUpcomingMatches = async (userId: string) => {
    try {
      const upcomingMatches = await HomeManager.fetchUserUpcomingMatches(userId);
      if (upcomingMatches.length > 0) {
        const closestMatch = upcomingMatches[0];
        showReminderForMatch(closestMatch);
      } else {
        setReminderMessage(null);
      }
    } catch (err) {
      console.error('Error checking upcoming matches', err);
    }
  };

  const showReminderForMatch = (match: DBMatch) => {
    const now = new Date();

    // Parse match date and time exactly like swift logic
    const matchDateStr = match.matchDate.toISOString().split('T')[0];
    const matchTimeStr = match.matchTime.toISOString().split('T')[1];
    const matchDateTime = new Date(`${matchDateStr}T${matchTimeStr}`);

    const timeDiffMs = matchDateTime.getTime() - now.getTime();
    const hoursUntilMatch = Math.floor(timeDiffMs / (1000 * 60 * 60));
    const minutesUntilMatch = Math.floor((timeDiffMs % (1000 * 60 * 60)) / (1000 * 60));

    const timeFormatted = formatTime(match.matchTime);
    let message = '';

    if (hoursUntilMatch === 0) {
      if (minutesUntilMatch <= 5) {
        message = `Reminder - Starting now! Your ${match.sportName} match at ${timeFormatted} is about to begin!`;
      } else {
        message = `Reminder - Game on! Your ${match.sportName} match starts at ${timeFormatted}, only ${minutesUntilMatch} minutes to go.`;
      }
    } else if (hoursUntilMatch === 1) {
      message = `Reminder - Game on! Your ${match.sportName} match starts at ${timeFormatted}, only 1 hour and ${minutesUntilMatch} minutes to go.`;
    } else {
      message = `Reminder - Game on! Your ${match.sportName} match starts at ${timeFormatted}, only ${hoursUntilMatch} hours and ${minutesUntilMatch} minutes to go.`;
    }

    setReminderMessage(message);
  };

  const SPORT_ITEM_WIDTH = 88; // 76 button + 12 margin

  const onSportSelect = async (sport: Sport, index: number) => {
    setSelectedSportId(sport.id);

    // Auto-scroll so the tapped sport centers on screen
    const screenWidth = Dimensions.get('window').width;
    const targetX = 20 + index * SPORT_ITEM_WIDTH + 38 - screenWidth / 2;
    sportsScrollRef.current?.scrollTo({ x: Math.max(0, targetX), animated: true });

    if (preferredSportsMatches[sport.name]) {
      // Refresh RSVP counts
      const matches = [...preferredSportsMatches[sport.name]];
      for (let i = 0; i < matches.length; i++) {
        const count = await HomeManager.fetchRSVPCount(matches[i].id);
        matches[i] = { ...matches[i], playersRSVPed: count };
      }
      setPreferredSportsMatches(prev => ({ ...prev, [sport.name]: matches }));
    } else {
      if (userCollege && currentUserId) {
        setLoading(true); // maybe optional, to not block ui entirely, but helps.
        const matches = await HomeManager.fetchMatchesForSport(sport.id, userCollege.id, currentUserId);
        setPreferredSportsMatches(prev => ({ ...prev, [sport.name]: matches }));
        setLoading(false);
      }
    }
  };

  const selectedSportData = sports.find((s) => s.id === selectedSportId);
  const currentSportMatches = selectedSportData ? (preferredSportsMatches[selectedSportData.name] || []) : [];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundPrimary,
    },
    safeArea: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 100,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
    },
    headerTitle: {
      fontSize: 28,
      fontFamily: FontFamily.bold,
      color: colors.textPrimary,
      flex: 1,
    },
    headerButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 50,
      paddingHorizontal: 16,
      height: 48,
      marginHorizontal: 20,
      marginBottom: 20,
      gap: 10,
    },
    searchInput: {
      flex: 1,
      fontSize: FontSize.md,
      fontFamily: FontFamily.regular,
      color: colors.textPrimary,
    },
    reminderBanner: {
      marginHorizontal: 20,
      marginBottom: 20,
      borderRadius: 28,
      borderWidth: 1.5,
      borderColor: 'rgba(255, 59, 48, 0.6)',
      backgroundColor: 'rgba(255, 240, 243, 1)',
      paddingVertical: 16,
      paddingHorizontal: 20,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    reminderBannerDark: {
      borderColor: 'rgba(255, 59, 48, 1)',
      backgroundColor: 'rgba(100, 15, 25, 1)',
    },
    reminderText: {
      flex: 1,
      fontSize: FontSize.md,
      fontFamily: FontFamily.regular,
      color: 'rgba(140, 20, 30, 1)',
      marginRight: 10,
    },
    reminderTextDark: {
      color: 'rgba(255, 255, 255, 0.95)',
    },
    closeButton: {
      width: 30,
      height: 30,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: 'rgba(140, 20, 30, 0.3)',
      backgroundColor: 'white',
      justifyContent: 'center',
      alignItems: 'center',
    },
    closeButtonDark: {
      borderColor: 'rgba(255, 255, 255, 0.4)',
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    sportsScroll: {
      paddingLeft: 20,
      marginBottom: 30,
    },
    sportButton: {
      width: 76,
      height: 76,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
      borderWidth: 1,
    },
    sportEmoji: {
      fontSize: 36,
    },
    sectionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionTitle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    sectionEmoji: {
      fontSize: 20,
    },
    sectionText: {
      fontSize: FontSize.lg,
      fontFamily: FontFamily.bold,
      color: colors.textPrimary,
    },
    seeMore: {
      fontSize: FontSize.sm,
      fontFamily: FontFamily.regular,
      color: colors.textSecondary,
    },
    noMatchesLabel: {
      fontSize: FontSize.md,
      fontFamily: FontFamily.medium,
      color: colors.textTertiary,
      textAlign: 'center',
      marginTop: 40,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    }
  });

  const isDarkMode = colors.backgroundPrimary === '#000000'; // Or your theme check

  if (loading && !refreshing && sports.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.systemGreen} />
      </View>
    );
  }

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

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{userCollege?.name || 'Loading...'}</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.iconButton} onPress={() => setShowPost(true)}>
              <Ionicons name="add" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Notifications')}>
              <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        <TouchableOpacity
          style={styles.searchBar}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Search')}
        >
          <Ionicons name="search-outline" size={18} color={colors.textTertiary} />
          <Text style={[styles.searchInput, { color: colors.textTertiary }]}>
            Search players
          </Text>
        </TouchableOpacity>

        {/* Reminder Banner */}
        {reminderMessage && (
          <View style={[styles.reminderBanner, isDarkMode && styles.reminderBannerDark]}>
            <Text style={[styles.reminderText, isDarkMode && styles.reminderTextDark]}>
              {reminderMessage}
            </Text>
            <TouchableOpacity
              style={[styles.closeButton, isDarkMode && styles.closeButtonDark]}
              onPress={() => setReminderMessage(null)}
            >
              <Ionicons
                name="close"
                size={14}
                color={isDarkMode ? 'white' : 'rgba(140, 20, 30, 1)'}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Sports Filter */}
        <View>
          <ScrollView
            ref={sportsScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sportsScroll}
          >
            {sports.map((sport, index) => {
              const isSelected = selectedSportId === sport.id;
              return (
                <TouchableOpacity
                  key={sport.id}
                  style={[
                    styles.sportButton,
                    {
                      backgroundColor: isSelected
                        ? `${colors.systemGreen}15`
                        : colors.backgroundSecondary,
                      borderColor: isSelected
                        ? colors.systemGreen
                        : 'transparent',
                    },
                  ]}
                  onPress={() => onSportSelect(sport, index)}
                >
                  <Text style={styles.sportEmoji}>{sport.emoji}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Match Cards */}
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.systemGreen} />
          }
        >
          {selectedSportData && (
            <View style={styles.sectionRow}>
              <View style={styles.sectionTitle}>
                <Text style={styles.sectionEmoji}>
                  {selectedSportData.emoji}
                </Text>
                <Text style={styles.sectionText}>
                  {selectedSportData.name.charAt(0).toUpperCase() + selectedSportData.name.slice(1)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('Matches', { sport: selectedSportData.name })}
              >
                <Text style={styles.seeMore}>See more</Text>
              </TouchableOpacity>
            </View>
          )}

          {currentSportMatches.length === 0 ? (
            <Text style={styles.noMatchesLabel}>No matches available for today or tomorrow</Text>
          ) : (
            currentSportMatches.map((match) => (
              <MatchCellCard
                key={match.id}
                venue={match.venue}
                date={formatDate(match.matchDate)}
                startTime={formatTime(match.matchTime)}
                endTime={formatEndTime(match.matchTime)}
                slotsLeft={match.playersNeeded - match.playersRSVPed}
                totalSlots={match.playersNeeded}
                goingCount={match.playersRSVPed}
                onPress={() => navigation.navigate('MatchInfo', {
                  match: {
                    ...match,
                    matchDate: match.matchDate.toISOString(),
                    matchTime: match.matchTime.toISOString(),
                    createdAt: match.createdAt.toISOString()
                  }
                })}
              />
            ))
          )}
        </ScrollView>

        <PostScreen visible={showPost} onClose={() => setShowPost(false)} />
      </SafeAreaView>
    </View>
  );
}