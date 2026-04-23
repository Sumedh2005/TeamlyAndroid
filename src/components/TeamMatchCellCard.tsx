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
  opponentTeamName?: string;
  onPress?: () => void;
}

const getTimeIcon = (startTime: string): 'sunny' | 'moon' => {
  const hour = parseInt(startTime.split(':')[0]);
  const isPM = startTime.includes('PM');
  const hour24 = isPM && hour !== 12 ? hour + 12 : (!isPM && hour === 12 ? 0 : hour);
  return hour24 >= 6 && hour24 < 18 ? 'sunny' : 'moon'; // 6 AM to 5:59 PM is sun.horizon (sunny)
};

const formatDisplayDate = (dateStr: string): string => {
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10) + 2000;

    const date = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.getTime() === today.getTime()) {
      return 'Today';
    } else if (date.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    }
  }
  return dateStr;
};

export default function TeamMatchCellCard({
  venue,
  date,
  startTime,
  endTime,
  goingCount,
  isChallenge = false,
  opponentTeamName,
  onPress,
}: TeamMatchCellCardProps) {
  const colors = useColors();
  const timeIcon = getTimeIcon(startTime);
  const displayDate = formatDisplayDate(date);

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 33,
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
      fontFamily: FontFamily.regular,
      color: colors.textSecondary,
    },
  });

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View style={styles.card}>

        {/* Venue */}
        <View style={styles.venueRow}>
          <Text style={{ fontSize: 18 }}>📍</Text>
          <Text style={styles.venueName} numberOfLines={1}>{venue}</Text>
        </View>

        {/* Date Row */}
        <View style={styles.infoRow}>
          <View style={styles.infoLeft}>
            <Ionicons name="calendar-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.infoText}>{displayDate}</Text>
          </View>
          {isChallenge && opponentTeamName ? (
            <View style={styles.challengeRow}>
              <Ionicons name="flag" size={16} color="#8E8E93" />
              <Text style={styles.challengeTeam}>{opponentTeamName}</Text>
            </View>
          ) : null}
        </View>

        {/* Time Row */}
        <View style={styles.infoRow}>
          <View style={styles.infoLeft}>
            <Ionicons
              name={timeIcon === 'sunny' ? 'partly-sunny' : 'moon'}
              size={18}
              color={timeIcon === 'sunny' ? '#FFCC00' : '#007AFF'}
            />
            <Text style={styles.infoText}>{startTime} - {endTime}</Text>
          </View>
          <Text style={styles.goingText}>{goingCount + 1} going</Text>
        </View>

      </View>
    </TouchableOpacity>
  );
}