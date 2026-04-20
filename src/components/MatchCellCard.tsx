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

interface MatchCellCardProps {
  venue: string;
  date: string;
  startTime: string;
  endTime: string;
  slotsLeft: number;
  totalSlots: number;
  goingCount: number;
  onPress?: () => void;
}

const getSlotColor = (slotsLeft: number, totalSlots: number): string => {
  const ratio = slotsLeft / totalSlots;
  if (ratio >= 0.75) return '#34C759'; // First 25% filled (75%-100% left) => Green
  if (ratio <= 0.25) return '#FF3B30'; // Last 25% left => Red
  return '#FFD60A'; // Middle (25% to 75% left) => Yellow
};

const getTimeIcon = (startTime: string): 'sunny' | 'moon' => {
  const hour = parseInt(startTime.split(':')[0]);
  const isPM = startTime.includes('PM');
  const hour24 = isPM && hour !== 12 ? hour + 12 : (!isPM && hour === 12 ? 0 : hour);
  return hour24 >= 6 && hour24 < 17 ? 'sunny' : 'moon';
};

const getDisplayDate = (dateStr: string): string => {
  // dateStr is in "dd/mm/yy" format
  const parts = dateStr.split('/');
  if (parts.length !== 3) return dateStr;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
  const year = 2000 + parseInt(parts[2], 10);
  const matchDate = new Date(year, month, day);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (matchDate.getTime() === today.getTime()) return 'Today';
  if (matchDate.getTime() === tomorrow.getTime()) return 'Tomorrow';
  return dateStr;
};

export default function MatchCellCard({
  venue,
  date,
  startTime,
  endTime,
  slotsLeft,
  totalSlots,
  goingCount,
  onPress,
}: MatchCellCardProps) {
  const colors = useColors();
  const slotColor = getSlotColor(slotsLeft, totalSlots);
  const timeIcon = getTimeIcon(startTime);
  const displayDate = getDisplayDate(date);

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
    slotBadge: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 50,
    },
    slotText: {
      fontSize: FontSize.sm,
      fontFamily: FontFamily.semiBold,
      color: colors.primaryWhite,
    },
    goingText: {
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
          <Text style={styles.venueName}>{venue}</Text>
        </View>

        {/* Date Row */}
        <View style={styles.infoRow}>
          <View style={styles.infoLeft}>
            <Ionicons name="calendar-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.infoText}>{displayDate}</Text>
          </View>
          <View style={[styles.slotBadge, { backgroundColor: slotColor }]}>
            <Text style={styles.slotText}>{slotsLeft} slots left</Text>
          </View>
        </View>

        {/* Time Row */}
        <View style={styles.infoRow}>
          <View style={styles.infoLeft}>
            <Ionicons
              name={timeIcon === 'sunny' ? 'sunny' : 'moon'}
              size={18}
              color={timeIcon === 'sunny' ? '#FFB800' : '#4A90D9'}
            />
            <Text style={styles.infoText}>{startTime} - {endTime}</Text>
          </View>
          <Text style={styles.goingText}>{goingCount} / {totalSlots} going</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}