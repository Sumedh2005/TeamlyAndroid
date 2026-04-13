import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../theme/colors';
import { FontFamily, FontSize } from '../../../theme/fonts';
import MatchCellCard from '../../../components/MatchCellCard';

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
  const dates = getDates();

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

    // Date strip
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

    // Cards
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 100,
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
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="options-outline" size={20} color={colors.systemGreen} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
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
            />
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}