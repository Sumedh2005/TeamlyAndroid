import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../theme/colors';
import { FontFamily, FontSize } from '../theme/fonts';

interface TeamMatchCellCardProps {
  venue: string;
  date: string;
  startTime: string;
  endTime: string;
  goingCount: number;
  isChallenge?: boolean;
  challengerTeam?: string;
  onPress?: () => void;
}

const getTimeIcon = (startTime: string): 'sunny' | 'moon' => {
  const hour = parseInt(startTime.split(':')[0]);
  const isPM = startTime.includes('PM');
  const hour24 = isPM && hour !== 12 ? hour + 12 : (!isPM && hour === 12 ? 0 : hour);
  return hour24 >= 6 && hour24 < 17 ? 'sunny' : 'moon';
};

export default function TeamMatchCellCard({
  venue,
  date,
  startTime,
  endTime,
  goingCount,
  isChallenge = false,
  challengerTeam,
  onPress,
}: TeamMatchCellCardProps) {
  const colors = useColors();
  const timeIcon = getTimeIcon(startTime);

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 25,
      padding: 16,
      marginBottom: 12,
    },
    venueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
      paddingBottom: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.backgroundTertiary,
    },
    venueName: {
      fontSize: FontSize.lg,
      fontFamily: FontFamily.bold,
      color: colors.textPrimary,
      flex: 1,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 10,
    },
    infoLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    infoText: {
      fontSize: FontSize.md,
      fontFamily: FontFamily.regular,
      color: colors.textPrimary,
    },
    goingText: {
      fontSize: FontSize.sm,
      fontFamily: FontFamily.regular,
      color: colors.textSecondary,
    },
    challengeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    challengeTeam: {
      fontSize: FontSize.sm,
      fontFamily: FontFamily.medium,
      color: colors.textSecondary,
    },
  });

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View style={styles.card}>

        {/* Venue */}
        <View style={styles.venueRow}>
          <Text style={{ fontSize: 18 }}>📍</Text>
          <Text style={styles.venueName}>{venue}</Text>
        </View>

        {/* Date Row */}
        <View style={styles.infoRow}>
          <View style={styles.infoLeft}>
            <Ionicons name="calendar-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.infoText}>{date}</Text>
          </View>
          {isChallenge && challengerTeam ? (
            <View style={styles.challengeRow}>
              <Ionicons name="flag" size={16} color={colors.textTertiary} />
              
              <Text style={styles.challengeTeam}>{challengerTeam}</Text>
            </View>
          ) : null}
        </View>

        {/* Time Row */}
        <View style={styles.infoRow}>
          <View style={styles.infoLeft}>
            <Ionicons
              name={timeIcon === 'sunny' ? 'sunny-outline' : 'moon-outline'}
              size={18}
              color={timeIcon === 'sunny' ? '#FFD60A' : colors.textPrimary}
            />
            <Text style={styles.infoText}>{startTime} - {endTime}</Text>
          </View>
          <Text style={styles.goingText}>{goingCount} going</Text>
        </View>

      </View>
    </TouchableOpacity>
  );
}