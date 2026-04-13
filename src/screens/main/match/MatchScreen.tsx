import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '../../../theme/colors';
import { FontFamily, FontSize } from '../../../theme/fonts';
import MatchCellCard from '../../../components/MatchCellCard';

const upcomingMatches = [
  {
    id: '1',
    venue: 'Turf',
    date: '09/04/26',
    startTime: '7:30 PM',
    endTime: '8:30 PM',
    slotsLeft: 4,
    totalSlots: 5,
    goingCount: 1,
  },
  {
    id: '2',
    venue: 'Moonrise Turf',
    date: '08/04/26',
    startTime: '7:00 PM',
    endTime: '8:00 PM',
    slotsLeft: 10,
    totalSlots: 10,
    goingCount: 0,
  },
  {
    id: '3',
    venue: 'El Classico Turf, Potheri',
    date: '08/04/26',
    startTime: '6:00 PM',
    endTime: '7:00 PM',
    slotsLeft: 5,
    totalSlots: 7,
    goingCount: 2,
  },
  {
    id: '4',
    venue: 'SRM Ground, Kattankulathur',
    date: '09/04/26',
    startTime: '8:00 AM',
    endTime: '9:00 AM',
    slotsLeft: 2,
    totalSlots: 12,
    goingCount: 10,
  },
  {
    id: '5',
    venue: 'Champions Arena',
    date: '10/04/26',
    startTime: '5:00 PM',
    endTime: '6:00 PM',
    slotsLeft: 6,
    totalSlots: 10,
    goingCount: 4,
  },
];

const pastMatches = [
  {
    id: 'p1',
    venue: 'Victory Sports Complex',
    date: '01/04/26',
    startTime: '10:00 AM',
    endTime: '11:00 AM',
    slotsLeft: 0,
    totalSlots: 8,
    goingCount: 8,
  },
  {
    id: 'p2',
    venue: 'Moonrise Turf',
    date: '03/04/26',
    startTime: '6:00 PM',
    endTime: '7:00 PM',
    slotsLeft: 0,
    totalSlots: 10,
    goingCount: 10,
  },
  {
    id: 'p3',
    venue: 'El Classico Turf, Potheri',
    date: '05/04/26',
    startTime: '7:00 PM',
    endTime: '8:00 PM',
    slotsLeft: 0,
    totalSlots: 7,
    goingCount: 7,
  },
];

export default function MatchScreen({ navigation }: any) {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  const matches = activeTab === 'upcoming' ? upcomingMatches : pastMatches;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundPrimary,
    },
    safeArea: {
      flex: 1,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
    },
    headerTitle: {
      fontSize: 32,
      fontFamily: FontFamily.bold,
      color: colors.textPrimary,
      marginBottom: 16,
    },

    // Segmented Control
    segmentContainer: {
      flexDirection: 'row',
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 50,
      padding: 4,
    },
    segmentButton: {
      flex: 1,
      height: 40,
      borderRadius: 50,
      justifyContent: 'center',
      alignItems: 'center',
    },
    segmentText: {
      fontSize: FontSize.sm,
      fontFamily: FontFamily.medium,
    },

    // Cards
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 100,
      paddingTop: 8,
    },
  });

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Matches</Text>

          {/* Segmented Control */}
          <View style={styles.segmentContainer}>
            <TouchableOpacity
              style={[
                styles.segmentButton,
                {
                  backgroundColor:
                    activeTab === 'upcoming'
                      ? colors.backgroundPrimary
                      : 'transparent',
                },
              ]}
              onPress={() => setActiveTab('upcoming')}
            >
              <Text
                style={[
                  styles.segmentText,
                  {
                    color:
                      activeTab === 'upcoming'
                        ? colors.textPrimary
                        : colors.textTertiary,
                    fontFamily:
                      activeTab === 'upcoming'
                        ? FontFamily.semiBold
                        : FontFamily.regular,
                  },
                ]}
              >
                Upcoming
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segmentButton,
                {
                  backgroundColor:
                    activeTab === 'past'
                      ? colors.textPrimary
                      : 'transparent',
                },
              ]}
              onPress={() => setActiveTab('past')}
            >
              <Text
                style={[
                  styles.segmentText,
                  {
                    color:
                      activeTab === 'past'
                        ? colors.backgroundPrimary
                        : colors.textTertiary,
                    fontFamily:
                      activeTab === 'past'
                        ? FontFamily.semiBold
                        : FontFamily.regular,
                  },
                ]}
              >
                Past
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Match Cards */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {matches.map((match) => (
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
      </SafeAreaView>
    </View>
  );
}