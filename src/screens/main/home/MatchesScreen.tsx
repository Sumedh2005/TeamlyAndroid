import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../theme/colors';
import { FontFamily, FontSize } from '../../../theme/fonts';
import MatchCellCard from '../../../components/MatchCellCard';
import SportsPostScreen from '../post/SportsPostScreen';

const mockMatches = [
  {
    id: '1',
    venue: 'Moonrise Turf',
    date: '08/04/26',
    startTime: '7:00 PM',
    endTime: '8:00 PM',
    slotsLeft: 10,
    totalSlots: 10,
    goingCount: 0,
  },
  {
    id: '2',
    venue: 'El Classico Turf, Potheri',
    date: '08/04/26',
    startTime: '6:00 PM',
    endTime: '7:00 PM',
    slotsLeft: 5,
    totalSlots: 7,
    goingCount: 2,
  },
  {
    id: '3',
    venue: 'SRM Ground, Kattankulathur',
    date: '09/04/26',
    startTime: '8:00 AM',
    endTime: '9:00 AM',
    slotsLeft: 2,
    totalSlots: 12,
    goingCount: 10,
  },
  {
    id: '4',
    venue: 'Champions Arena',
    date: '09/04/26',
    startTime: '5:00 PM',
    endTime: '6:00 PM',
    slotsLeft: 6,
    totalSlots: 10,
    goingCount: 4,
  },
  {
    id: '5',
    venue: 'Victory Sports Complex',
    date: '10/04/26',
    startTime: '10:00 AM',
    endTime: '11:00 AM',
    slotsLeft: 1,
    totalSlots: 8,
    goingCount: 7,
  },
];

const SPORT_LABELS: Record<string, string> = {
  football: 'Football games',
  basketball: 'Basketball games',
  cricket: 'Cricket games',
  tabletennis: 'Table Tennis games',
  badminton: 'Badminton games',
  tennis: 'Tennis games',
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const getDates = () => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 10; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d);
  }
  return dates;
};

export default function MatchesScreen({ navigation, route }: any) {
  const colors = useColors();
  const sport = route?.params?.sport ?? 'football';
  const [selectedDate, setSelectedDate] = useState(0);
  const [showPost, setShowPost] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [selectedAvailability, setSelectedAvailability] = useState<string[]>([]);
  const dates = getDates();

  const toggleItem = (item: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  };

  const clearAll = () => {
    setSelectedSkills([]);
    setSelectedTimes([]);
    setSelectedAvailability([]);
  };

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
      paddingTop: 8,
      paddingBottom: 12,
    },
    backButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerRight: {
      flexDirection: 'row',
      gap: 8,
    },
    iconButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: 28,
      fontFamily: FontFamily.bold,
      color: colors.textPrimary,
      paddingHorizontal: 20,
      marginBottom: 16,
    },
    dateStrip: {
      paddingLeft: 20,
      marginBottom: 16,
    },
    dateItem: {
      width: 56,
      height: 72,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    dateNumber: {
      fontSize: 20,
      fontFamily: FontFamily.bold,
    },
    dateDay: {
      fontSize: FontSize.xs,
      fontFamily: FontFamily.regular,
      marginTop: 2,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 100,
    },

    // Filter Modal
    filterOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    filterSheet: {
      backgroundColor: colors.backgroundPrimary,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 24,
      paddingBottom: 48,
      paddingTop: 12,
    },
    filterHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.backgroundQuaternary,
      alignSelf: 'center',
      marginBottom: 20,
    },
    filterHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
    },
    filterClear: {
      fontSize: FontSize.sm,
      fontFamily: FontFamily.medium,
      color: colors.textSecondary,
    },
    filterTitle: {
      fontSize: FontSize.md,
      fontFamily: FontFamily.bold,
      color: colors.textPrimary,
    },
    filterApply: {
      fontSize: FontSize.sm,
      fontFamily: FontFamily.semiBold,
      color: colors.systemGreen,
    },
    filterSectionTitle: {
      fontSize: FontSize.md,
      fontFamily: FontFamily.bold,
      color: colors.textPrimary,
      marginBottom: 12,
    },
    filterRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 24,
    },
    filterChip: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 50,
      borderWidth: 1.5,
    },
    filterChipText: {
      fontSize: FontSize.sm,
      fontFamily: FontFamily.medium,
    },
    applyButton: {
      height: 52,
      borderRadius: 50,
      backgroundColor: colors.systemGreen,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 8,
    },
    applyButtonText: {
      fontSize: FontSize.md,
      fontFamily: FontFamily.semiBold,
      color: colors.primaryWhite,
    },
  });

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton} onPress={() => setShowFilter(true)}>
              <Ionicons name="options-outline" size={20} color={colors.systemGreen} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => setShowPost(true)}>
              <Ionicons name="add" size={22} color={colors.systemGreen} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>{SPORT_LABELS[sport]}</Text>

        {/* Date Strip */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateStrip}
        >
          {dates.map((date, index) => {
            const isSelected = selectedDate === index;
            const isToday = index === 0;
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
                onPress={() => setSelectedDate(index)}
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
                  {date.getDate()}
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
                  {isToday ? 'Tod' : DAY_LABELS[date.getDay()]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Match Cards */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {mockMatches.map((match) => (
            <MatchCellCard
              key={match.id}
              venue={match.venue}
              date={match.date}
              startTime={match.startTime}
              endTime={match.endTime}
              slotsLeft={match.slotsLeft}
              totalSlots={match.totalSlots}
              goingCount={match.goingCount}
              onPress={() => navigation.navigate('MatchInfo', { match })}
            />
          ))}
        </ScrollView>

        {/* Sports Post Modal */}
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

                  {/* Header */}
                  <View style={styles.filterHeader}>
                    <TouchableOpacity onPress={clearAll}>
                      <Text style={styles.filterClear}>Clear</Text>
                    </TouchableOpacity>
                    <Text style={styles.filterTitle}>Filters</Text>
                    <TouchableOpacity onPress={() => setShowFilter(false)}>
                      <Text style={styles.filterApply}>Apply</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Skill */}
                  <Text style={styles.filterSectionTitle}>Skill</Text>
                  <View style={styles.filterRow}>
                    {['Beginner', 'Intermediate', 'Experienced', 'Advanced'].map((skill) => {
                      const isSelected = selectedSkills.includes(skill);
                      return (
                        <TouchableOpacity
                          key={skill}
                          style={[
                            styles.filterChip,
                            {
                              backgroundColor: isSelected ? `${colors.systemGreen}22` : colors.backgroundSecondary,
                              borderColor: isSelected ? colors.systemGreen : 'transparent',
                            },
                          ]}
                          onPress={() => toggleItem(skill, selectedSkills, setSelectedSkills)}
                        >
                          <Text style={[styles.filterChipText, { color: isSelected ? colors.systemGreen : colors.textPrimary }]}>
                            {skill}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Time */}
                  <Text style={styles.filterSectionTitle}>Time</Text>
                  <View style={styles.filterRow}>
                    {[
                      { label: '☀️  Day', value: 'day' },
                      { label: '🌙  Night', value: 'night' },
                    ].map((time) => {
                      const isSelected = selectedTimes.includes(time.value);
                      return (
                        <TouchableOpacity
                          key={time.value}
                          style={[
                            styles.filterChip,
                            {
                              backgroundColor: isSelected ? `${colors.systemGreen}22` : colors.backgroundSecondary,
                              borderColor: isSelected ? colors.systemGreen : 'transparent',
                            },
                          ]}
                          onPress={() => toggleItem(time.value, selectedTimes, setSelectedTimes)}
                        >
                          <Text style={[styles.filterChipText, { color: isSelected ? colors.systemGreen : colors.textPrimary }]}>
                            {time.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Availability */}
                  <Text style={styles.filterSectionTitle}>Availability</Text>
                  <View style={styles.filterRow}>
                    {[
                      { label: '🔥  Filling fast', value: 'filling' },
                      { label: '✅  Available', value: 'available' },
                    ].map((avail) => {
                      const isSelected = selectedAvailability.includes(avail.value);
                      return (
                        <TouchableOpacity
                          key={avail.value}
                          style={[
                            styles.filterChip,
                            {
                              backgroundColor: isSelected ? `${colors.systemGreen}22` : colors.backgroundSecondary,
                              borderColor: isSelected ? colors.systemGreen : 'transparent',
                            },
                          ]}
                          onPress={() => toggleItem(avail.value, selectedAvailability, setSelectedAvailability)}
                        >
                          <Text style={[styles.filterChipText, { color: isSelected ? colors.systemGreen : colors.textPrimary }]}>
                            {avail.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Apply Button */}
                  

                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

      </SafeAreaView>
    </View>
  );
}