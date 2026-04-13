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
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../theme/colors';
import { FontFamily, FontSize } from '../../../theme/fonts';
import MatchCellCard from '../../../components/MatchCellCard';
import PostScreen from '../post/PostScreen';

const sports = [
  { id: 'football', emoji: '⚽' },
  { id: 'basketball', emoji: '🏀' },
  { id: 'cricket', emoji: '🏏' },
  { id: 'tabletennis', emoji: '🏓' },
  { id: 'badminton', emoji: '🏸' },
  { id: 'tennis', emoji: '🎾' },
];

const mockMatches = [
  {
    id: '1',
    venue: 'Kalidas Turf',
    date: '08/04/26',
    startTime: '7:00 PM',
    endTime: '8:00 PM',
    slotsLeft: 10,
    totalSlots: 10,
    goingCount: 0,
  },
  {
    id: '2',
    venue: 'El Classico Turf, Chennai',
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

export default function HomeScreen({ navigation }: any) {
  const colors = useColors();
  const [selectedSport, setSelectedSport] = useState('football');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPost, setShowPost] = useState(false);

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
    sportsScroll: {
      paddingLeft: 20,
      marginBottom: 60,
    },
    sportButton: {
      width: 64,
      height: 64,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
      borderWidth: 1,
    },
    sportEmoji: {
      fontSize: 32,
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
  });

  const selectedSportData = sports.find((s) => s.id === selectedSport);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>SRM University</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.iconButton} onPress={() => setShowPost(true)}>
              <Ionicons name="add" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search players"
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Sports Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sportsScroll}
        >
          {sports.map((sport) => (
            <TouchableOpacity
              key={sport.id}
              style={[
                styles.sportButton,
                {
                  backgroundColor:
                    selectedSport === sport.id
                      ? `${colors.systemGreen}15`
                      : colors.backgroundSecondary,
                  borderColor:
                    selectedSport === sport.id
                      ? colors.systemGreen
                      : 'transparent',
                },
              ]}
              onPress={() => setSelectedSport(sport.id)}
            >
              <Text style={styles.sportEmoji}>{sport.emoji}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Match Cards */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.sectionRow}>
            <View style={styles.sectionTitle}>
              <Text style={styles.sectionEmoji}>
                {selectedSportData?.emoji}
              </Text>
              <Text style={styles.sectionText}>
                {selectedSport.charAt(0).toUpperCase() + selectedSport.slice(1)}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Matches', { sport: selectedSport })}
            >
              <Text style={styles.seeMore}>See more</Text>
            </TouchableOpacity>
          </View>

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

        <PostScreen visible={showPost} onClose={() => setShowPost(false)} />
      </SafeAreaView>
    </View>
  );
}