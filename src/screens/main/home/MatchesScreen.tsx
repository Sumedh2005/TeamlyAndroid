import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../theme/colors';
import { FontFamily, FontSize } from '../../../theme/fonts';
import MatchCellCard from '../../../components/MatchCellCard';
import SportsPostScreen from '../post/SportsPostScreen';
import MatchesManager from '../../../services/MatchesManager';
import HomeManager, { DBMatch } from '../../../services/HomeManager';
import { supabase } from '../../../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';

const SPORT_LABELS: Record<string, string> = {
  football: 'Football games',
  basketball: 'Basketball games',
  cricket: 'Cricket games',
  tabletennis: 'Table Tennis games',
  badminton: 'Badminton games',
  tennis: 'Tennis games',
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface DateItem {
  day: string;
  label: string;
  fullDate: string;
  dbDate: string;
  dateObj: Date;
}

const getDates = (count: number = 30): DateItem[] => {
  const dates: DateItem[] = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    const dayNumber = d.getDate().toString().padStart(2, '0');
    // For label
    let label = '';
    if (i === 0) label = 'Tod';
    else if (i === 1) label = 'Tom';
    else label = DAY_LABELS[d.getDay()];

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dbDate = `${yyyy}-${mm}-${dd}`;

    // For fullDate (display format e.g. dd/MM/yy)
    const yy = d.getFullYear().toString().slice(-2);
    const fullDate = `${dd}/${mm}/${yy}`;

    dates.push({
      day: parseInt(dayNumber).toString(),
      label,
      fullDate,
      dbDate,
      dateObj: d,
    });
  }
  return dates;
};

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
  const date = new Date(timeString);
  const hours = date.getUTCHours() + 1; // assuming 1 hr duration
  const minutes = date.getUTCMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

export default function MatchesScreen({ navigation, route }: any) {
  const colors = useColors();
  const sport = route?.params?.sport ?? 'football';
  const capitalizedSport = sport.charAt(0).toUpperCase() + sport.slice(1);
  const sportLabel = SPORT_LABELS[sport.toLowerCase()] || `${capitalizedSport} games`;

  const [dates] = useState<DateItem[]>(getDates());
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);

  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [userCollegeId, setUserCollegeId] = useState<number>(0);
  const [filteredMatches, setFilteredMatches] = useState<DBMatch[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [showFilter, setShowFilter] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [isFillingFastEnabled, setIsFillingFastEnabled] = useState(false);

  const [showPost, setShowPost] = useState(false);

  useEffect(() => {
    fetchUserDataAndLoadMatches();
  }, []);

  useEffect(() => {
    if (currentUserId && userCollegeId) {
      loadMatchesForSelectedDate();
    }
  }, [selectedDateIndex, selectedSkills, selectedTimes, isFillingFastEnabled]);

  const toggleItem = (item: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  };

  const toggleFillingFast = () => {
    setIsFillingFastEnabled(!isFillingFastEnabled);
  }

  const clearAllFilters = () => {
    setSelectedSkills([]);
    setSelectedTimes([]);
    setIsFillingFastEnabled(false);
  };

  const fetchUserDataAndLoadMatches = async () => {
    try {
      setLoading(true);
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

      setUserCollegeId(userProfile.college_id);

      // Will be triggered by the use effect dependency naturally if college id changes, 
      // but let's call it manually just in case
      await loadMatchesForSelectedDate(userId, userProfile.college_id);

    } catch (error) {
      console.error('Error fetching user data', error);
      setLoading(false);
    }
  };

  const loadMatchesForSelectedDate = async (uid = currentUserId, cid = userCollegeId) => {
    if (!uid || !cid) return;

    setLoading(true);
    const selectedDate = dates[selectedDateIndex];

    try {
      let dbMatches = await MatchesManager.fetchMatchesForSportAndDate(
        sport,
        selectedDate.dbDate,
        cid,
        uid
      );

      // Filter out past matches for today
      if (selectedDateIndex === 0) {
        const now = new Date();
        dbMatches = dbMatches.filter(match => {
          const matchDateStr = match.matchDate.toISOString().split('T')[0];
          const matchTimeStr = match.matchTime.toISOString().split('T')[1];
          const matchDateTime = new Date(`${matchDateStr}T${matchTimeStr}`);
          return matchDateTime > now;
        });
      }

      // Filling Fast filter
      if (isFillingFastEnabled) {
        dbMatches = dbMatches.filter(match => {
          const fillRatio = match.playersRSVPed / Math.max(1, match.playersNeeded);
          return fillRatio >= 0.66;
        });
      }

      // Skill Level filters
      if (selectedSkills.length > 0) {
        dbMatches = dbMatches.filter(match => {
          const skill = match.skillLevel?.toLowerCase();
          if (!skill) return false;
          return selectedSkills.includes(skill);
        });
      }

      // Time filters
      if (selectedTimes.length > 0) {
        dbMatches = dbMatches.filter(match => {
          const hour = match.matchTime.getUTCHours();
          const isNightTime = hour >= 17 || hour < 6;

          if (selectedTimes.includes('day') && selectedTimes.includes('night')) {
            return true;
          } else if (selectedTimes.includes('day')) {
            return !isNightTime;
          } else if (selectedTimes.includes('night')) {
            return isNightTime;
          }
          return false;
        });
      }

      setFilteredMatches(dbMatches);
    } catch (error) {
      console.error('Error loading matches for date', error);
    } finally {
      setLoading(false);
    }
  };

  const hasActiveFilters = selectedSkills.length > 0 || selectedTimes.length > 0 || isFillingFastEnabled;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundPrimary,
    },
    safeArea: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 16,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      borderColor: colors.backgroundTertiary,
    },
    headerRight: {
      flexDirection: 'row',
      gap: 10,
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
     borderColor: colors.backgroundTertiary,
    },
    title: {
      fontSize: 32,
      fontFamily: FontFamily.bold,
      color: colors.textPrimary,
      flex: 1,
      textAlign: 'center',
    },
    dateStrip: {
      paddingLeft: 20,
      marginBottom: 28,
    },
    dateItem: {
      width: 62,
      height: 62,
      borderRadius: 31,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 15,
    },
    dateNumber: {
      fontSize: 17,
      fontFamily: FontFamily.medium,
    },
    dateDay: {
      fontSize: 10,
      fontFamily: FontFamily.medium,
      marginTop: 3,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 100,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    noMatchesLabel: {
      fontSize: 18,
      fontFamily: FontFamily.medium,
      color: colors.textTertiary,
      textAlign: 'center',
      marginTop: 40,
    },
    // Filter Modal Styles
    filterOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    filterSheet: {
      backgroundColor: colors.backgroundPrimary,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      height: '70%',
    },
    filterBottomButtons: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 16,
      marginTop: 32,
      marginBottom: 48,
    },
    filterClearButton: {
      paddingHorizontal: 24,
      paddingVertical: 10,
      borderRadius: 50,
      backgroundColor: colors.backgroundSecondary,
    },
    filterApplyButton: {
      paddingHorizontal: 24,
      paddingVertical: 10,
      borderRadius: 50,
      backgroundColor: colors.systemGreen,
    },
    filterButtonText: {
      fontSize: 15,
      fontFamily: FontFamily.semiBold,
    },
    filterContent: {
      paddingHorizontal: 24,
      paddingTop: 16,
    },
    filterSectionTitle: {
      fontSize: 18,
      fontFamily: FontFamily.medium,
      color: colors.textPrimary,
      marginBottom: 16,
    },
    filterRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 12,
    },
    filterChip: {
      flex: 1,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
      flexDirection: 'row',
      gap: 6,
    },
    filterChipText: {
      fontSize: 14,
      fontFamily: FontFamily.medium,
      color: colors.textPrimary,
    },
    separator: {
      height: 1,
      backgroundColor: colors.textTertiary,
      opacity: 0.2,
      marginVertical: 16,
    },
    filterHandle: {
      width: 40,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: colors.textTertiary,
      opacity: 0.5,
      alignSelf: 'center',
      marginTop: 8,
    }
  });

  const getSkillColor = (skill: string) => {
    switch (skill) {
      case 'beginner': return 'rgba(90, 200, 250, 0.7)'; // teal
      case 'intermediate': return 'rgba(255, 204, 0, 0.7)'; // yellow
      case 'experienced': return 'rgba(255, 149, 0, 0.7)'; // orange
      case 'advanced': return 'rgba(255, 59, 48, 0.7)'; // red
      default: return 'gray';
    }
  };

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
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={20} color={colors.systemGreen} />
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>{sportLabel}</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setShowFilter(true)}
            >
              <Ionicons
                name={hasActiveFilters ? "options" : "options-outline"}
                size={20}
                color={colors.systemGreen}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => setShowPost(true)}>
              <Ionicons name="add" size={22} color={colors.systemGreen} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>

          {/* Date Strip */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateStrip}
          >
            {dates.map((date, index) => {
              const isSelected = selectedDateIndex === index;
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dateItem,
                    {
                      backgroundColor: isSelected
                        ? colors.textPrimary
                        : colors.backgroundSecondary,
                    },
                  ]}
                  onPress={() => setSelectedDateIndex(index)}
                >
                  <Text
                    style={[
                      styles.dateNumber,
                      {
                        color: isSelected
                          ? colors.backgroundPrimary
                          : colors.textPrimary,
                      },
                    ]}
                  >
                    {date.day}
                  </Text>
                  <Text
                    style={[
                      styles.dateDay,
                      {
                        color: isSelected
                          ? colors.backgroundPrimary
                          : colors.textSecondary,
                      },
                    ]}
                  >
                    {date.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Matches Collection */}
          <View style={styles.scrollContent}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.textPrimary} />
              </View>
            ) : filteredMatches.length === 0 ? (
              <Text style={styles.noMatchesLabel}>No matches available on this day</Text>
            ) : (
              filteredMatches.map((match) => (
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
          </View>
        </ScrollView>

        <SportsPostScreen
          visible={showPost}
          onClose={() => setShowPost(false)}
          sport={sport}
        />

        {/* Filter Modal */}
        <Modal
          visible={showFilter}
          animationType="slide"
          transparent
          onRequestClose={() => setShowFilter(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowFilter(false)}>
            <View style={styles.filterOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.filterSheet}>
                  <View style={styles.filterHandle} />

                  <ScrollView style={styles.filterContent} showsVerticalScrollIndicator={false}>

                    {/* Skill */}
                    <Text style={styles.filterSectionTitle}>Skill Level</Text>
                    <View style={styles.filterRow}>
                      {['beginner', 'intermediate'].map((skill) => {
                        const isSelected = selectedSkills.includes(skill);
                        return (
                          <TouchableOpacity
                            key={skill}
                            style={[
                              styles.filterChip,
                              { backgroundColor: isSelected ? getSkillColor(skill) : colors.backgroundTertiary }
                            ]}
                            onPress={() => toggleItem(skill, selectedSkills, setSelectedSkills)}
                          >
                            <Text style={[styles.filterChipText, { color: isSelected ? 'white' : colors.textPrimary }]}>
                              {skill.charAt(0).toUpperCase() + skill.slice(1)}
                            </Text>
                          </TouchableOpacity>
                        )
                      })}
                    </View>
                    <View style={styles.filterRow}>
                      {['experienced', 'advanced'].map((skill) => {
                        const isSelected = selectedSkills.includes(skill);
                        return (
                          <TouchableOpacity
                            key={skill}
                            style={[
                              styles.filterChip,
                              { backgroundColor: isSelected ? getSkillColor(skill) : colors.backgroundTertiary }
                            ]}
                            onPress={() => toggleItem(skill, selectedSkills, setSelectedSkills)}
                          >
                            <Text style={[styles.filterChipText, { color: isSelected ? 'white' : colors.textPrimary }]}>
                              {skill.charAt(0).toUpperCase() + skill.slice(1)}
                            </Text>
                          </TouchableOpacity>
                        )
                      })}
                    </View>

                    <View style={styles.separator} />

                    {/* Time */}
                    <Text style={styles.filterSectionTitle}>Time</Text>
                    <View style={styles.filterRow}>
                      {['day', 'night'].map((time) => {
                        const isSelected = selectedTimes.includes(time);
                        const isDay = time === 'day';
                        return (
                          <TouchableOpacity
                            key={time}
                            style={[
                              styles.filterChip,
                              { backgroundColor: isSelected ? 'white' : colors.backgroundTertiary }
                            ]}
                            onPress={() => toggleItem(time, selectedTimes, setSelectedTimes)}
                          >
                            <Ionicons name={isDay ? 'sunny' : 'moon'} size={16} color={isSelected ? (isDay ? 'orange' : 'blue') : 'gray'} />
                            <Text style={[styles.filterChipText, { color: isSelected ? 'black' : colors.textPrimary }]}>
                              {time.charAt(0).toUpperCase() + time.slice(1)}
                            </Text>
                          </TouchableOpacity>
                        )
                      })}
                    </View>

                    <View style={styles.separator} />

                    {/* Availability */}
                    <Text style={styles.filterSectionTitle}>Availability</Text>
                    <View style={styles.filterRow}>
                      <TouchableOpacity
                        style={[
                          styles.filterChip,
                          { backgroundColor: isFillingFastEnabled ? 'white' : colors.backgroundTertiary, flex: 0.5 }
                        ]}
                        onPress={toggleFillingFast}
                      >
                        <Ionicons name="trending-up" size={16} color={isFillingFastEnabled || !isFillingFastEnabled ? 'red' : 'red'} />
                        <Text style={[styles.filterChipText, { color: isFillingFastEnabled ? 'black' : colors.textPrimary }]}>
                          Filling fast
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Clear & Apply Buttons */}
                    <View style={styles.filterBottomButtons}>
                      <TouchableOpacity style={styles.filterClearButton} onPress={clearAllFilters}>
                        <Text style={[styles.filterButtonText, { color: colors.textPrimary }]}>Clear</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.filterApplyButton} onPress={() => setShowFilter(false)}>
                        <Text style={[styles.filterButtonText, { color: 'white' }]}>Apply</Text>
                      </TouchableOpacity>
                    </View>

                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

      </SafeAreaView>
    </View>
  );
}