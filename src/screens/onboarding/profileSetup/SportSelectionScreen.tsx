import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useColors } from '../../../theme/colors';
import { FontFamily, FontSize } from '../../../theme/fonts';

const { width } = Dimensions.get('window');
const TOTAL_STEPS = 5;
const ITEM_SIZE = (width - 48 - 32) / 3;

const sports = [
  { id: 'football', emoji: '⚽', label: 'Football' },
  { id: 'cricket', emoji: '🏏', label: 'Cricket' },
  { id: 'basketball', emoji: '🏀', label: 'Basketball' },
  { id: 'tabletennis', emoji: '🏓', label: 'Table Tennis' },
  { id: 'badminton', emoji: '🏸', label: 'Badminton' },
  { id: 'tennis', emoji: '🎾', label: 'Tennis' },
];

export default function SportSelectionScreen({ navigation }: any) {
  const colors = useColors();
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const progress = 3 / TOTAL_STEPS;

  const toggleSport = (id: string) => {
    setSelectedSports((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const isNextEnabled = selectedSports.length > 0;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundPrimary,
      paddingHorizontal: 24,
    },
    progressBarContainer: {
      marginTop: 60,
      height: 4,
      backgroundColor: colors.backgroundTertiary,
      borderRadius: 2,
    },
    progressBar: {
      height: 4,
      width: `${progress * 100}%`,
      backgroundColor: colors.systemGreen,
      borderRadius: 2,
    },
    title: {
      fontSize: 28,
      fontFamily: FontFamily.bold,
      color: colors.textPrimary,
      marginTop: 40,
      marginBottom: 32,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
    },
    sportButton: {
      width: ITEM_SIZE,
      height: ITEM_SIZE,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sportEmoji: {
      fontSize: 40,
    },
    bottomContainer: {
      position: 'absolute',
      bottom: 48,
      left: 24,
      right: 24,
      alignItems: 'center',
    },
    nextButton: {
      height: 56,
      paddingHorizontal: 48,
      borderRadius: 50,
      justifyContent: 'center',
      alignItems: 'center',
    },
    nextButtonText: {
      fontSize: FontSize.md,
      fontFamily: FontFamily.semiBold,
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle={colors.isDark ? 'light-content' : 'dark-content'} />

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar} />
      </View>

      {/* Title */}
      <Text style={styles.title}>Your preferred sport</Text>

      {/* Sport Grid */}
      <View style={styles.grid}>
        {sports.map((sport) => {
          const isSelected = selectedSports.includes(sport.id);
          return (
            <TouchableOpacity
              key={sport.id}
              style={[
                styles.sportButton,
                {
                  backgroundColor: isSelected
                    ? `${colors.systemGreen}22`
                    : colors.backgroundSecondary,
                  borderWidth: isSelected ? 2 : 0,
                  borderColor: isSelected ? colors.systemGreen : 'transparent',
                },
              ]}
              onPress={() => toggleSport(sport.id)}
            >
              <Text style={styles.sportEmoji}>{sport.emoji}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Next Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            {
              backgroundColor: isNextEnabled
                ? colors.systemGreen
                : colors.backgroundTertiary,
            },
          ]}
          disabled={!isNextEnabled}
          onPress={() => navigation.navigate('SkillLevel', { selectedSports })}
        >
          <Text
            style={[
              styles.nextButtonText,
              {
                color: isNextEnabled ? colors.primaryWhite : colors.textTertiary,
              },
            ]}
          >
            Next
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}