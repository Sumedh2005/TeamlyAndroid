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
import TeamMatchCellCard from '../../../components/TeamMatchCellCard';

const upcomingMatches = [
  {
    id: '1',
    venue: 'R2B Turf',
    date: '18/04/26',
    startTime: '10:00 AM',
    endTime: '11:00 AM',
    goingCount: 1,
    isChallenge: true,
    challengerTeam: 'Super FC',
  },
  {
    id: '2',
    venue: 'Test Venue',
    date: '16/04/26',
    startTime: '7:30 PM',
    endTime: '8:30 PM',
    goingCount: 1,
    isChallenge: false,
  },
  {
    id: '3',
    venue: 'El Classico Turf, Potheri',
    date: '09/04/26',
    startTime: '6:30 PM',
    endTime: '7:30 PM',
    goingCount: 1,
    isChallenge: true,
    challengerTeam: 'Kick Off FC',
  },
];

const pastMatches = [
  {
    id: 'p1',
    venue: 'SRM Ground',
    date: '01/04/26',
    startTime: '10:00 AM',
    endTime: '11:00 AM',
    goingCount: 5,
    isChallenge: true,
    challengerTeam: 'Kick Off FC',
  },
  {
    id: 'p2',
    venue: 'Moonrise Turf',
    date: '03/04/26',
    startTime: '6:00 PM',
    endTime: '7:00 PM',
    goingCount: 4,
    isChallenge: false,
  },
];

export default function TeamMatchesScreen({ navigation }: any) {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  const matches = activeTab === 'upcoming' ? upcomingMatches : pastMatches;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundPrimary,
    },
    safeArea: { flex: 1 },

    // Header
    header: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 12,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
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
      paddingTop: 16,
      paddingBottom: 100,
    },
  });

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={20} color={colors.systemGreen} />
          </TouchableOpacity>
          <Text style={styles.title}>Matches</Text>

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
           <TeamMatchCellCard
  key={match.id}
  venue={match.venue}
  date={match.date}
  startTime={match.startTime}
  endTime={match.endTime}
  goingCount={match.goingCount}
  isChallenge={match.isChallenge}
  challengerTeam={match.challengerTeam}
  onPress={() => navigation.navigate('TeamMatchInfo', { match })}
/>
          ))}
        </ScrollView>

      </SafeAreaView>
    </View>
  );
}