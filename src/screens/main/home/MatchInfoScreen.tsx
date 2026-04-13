import React from 'react';
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

const SKILL_COLORS: Record<string, string> = {
  Beginner: '#00BCD4',
  Intermediate: '#FFD60A',
  Experienced: '#FF9500',
  Advanced: '#FF3B30',
};

export default function MatchInfoScreen({ navigation, route }: any) {
  const colors = useColors();
  const { match } = route.params;

  const filledRatio = match.goingCount / match.totalSlots;

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
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 8,
    },
    backButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    moreButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: 32,
      fontFamily: FontFamily.bold,
      color: colors.textPrimary,
      paddingHorizontal: 20,
      marginBottom: 8,
    },
    venueName: {
      fontSize: FontSize.lg,
      fontFamily: FontFamily.semiBold,
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: 20,
    },

    // Info Card
    infoCard: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 20,
      marginHorizontal: 20,
      padding: 20,
      marginBottom: 24,
      gap: 16,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    infoText: {
      fontSize: FontSize.md,
      fontFamily: FontFamily.regular,
      color: colors.textPrimary,
    },
    skillBadge: {
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 50,
    },
    skillText: {
      fontSize: FontSize.sm,
      fontFamily: FontFamily.semiBold,
      color: colors.primaryWhite,
    },
    progressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    progressBarBg: {
      flex: 1,
      height: 6,
      backgroundColor: colors.backgroundTertiary,
      borderRadius: 3,
    },
    progressBarFill: {
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.systemGreen,
    },
    progressText: {
      fontSize: FontSize.sm,
      fontFamily: FontFamily.medium,
      color: colors.textSecondary,
      minWidth: 32,
      textAlign: 'right',
    },

    // Divider
    divider: {
      height: 0.5,
      backgroundColor: colors.backgroundTertiary,
      marginHorizontal: 20,
      marginBottom: 20,
    },

    // Section
    sectionTitle: {
      fontSize: FontSize.lg,
      fontFamily: FontFamily.bold,
      color: colors.textPrimary,
      paddingHorizontal: 20,
      marginBottom: 12,
    },

    // Player Row
    playerCard: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 16,
      marginHorizontal: 20,
      marginBottom: 8,
      paddingHorizontal: 16,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    avatarCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.backgroundTertiary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    playerName: {
      flex: 1,
      fontSize: FontSize.md,
      fontFamily: FontFamily.medium,
      color: colors.textPrimary,
    },
    friendTag: {
      fontSize: FontSize.sm,
      fontFamily: FontFamily.semiBold,
      color: colors.systemGreen,
    },

    // Join Button
    joinButtonContainer: {
      paddingHorizontal: 20,
      paddingBottom: 40,
      paddingTop: 16,
    },
    joinButton: {
      height: 56,
      borderRadius: 50,
      backgroundColor: colors.systemGreen,
      justifyContent: 'center',
      alignItems: 'center',
    },
    joinButtonText: {
      fontSize: FontSize.md,
      fontFamily: FontFamily.semiBold,
      color: colors.primaryWhite,
    },
  });

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.moreButton}>
              <Ionicons name="ellipsis-horizontal" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Title */}
          <Text style={styles.title}>Match Info</Text>
          <Text style={styles.venueName}>{match.venue}</Text>

          {/* Info Card */}
          <View style={styles.infoCard}>

            {/* Sport */}
            <View style={styles.infoRow}>
              <Ionicons name="football-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.infoText}>{match.sport ?? 'Football'}</Text>
            </View>

            {/* Date */}
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.infoText}>{match.date}</Text>
            </View>

            {/* Time */}
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.infoText}>{match.startTime} - {match.endTime}</Text>
            </View>

            {/* Skill */}
            <View style={styles.infoRow}>
              <Ionicons name="radio-button-on-outline" size={20} color={colors.textSecondary} />
              <View style={[
                styles.skillBadge,
                { backgroundColor: SKILL_COLORS[match.skill ?? 'Beginner'] }
              ]}>
                <Text style={styles.skillText}>{match.skill ?? 'Beginner'}</Text>
              </View>
            </View>

            {/* Players Progress */}
            <View style={styles.progressRow}>
              <Ionicons name="people-outline" size={20} color={colors.textSecondary} />
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${filledRatio * 100}%` }]} />
              </View>
              <Text style={styles.progressText}>{match.goingCount}/{match.totalSlots}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Hosted By */}
          <Text style={styles.sectionTitle}>Hosted by</Text>
          <View style={styles.playerCard}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={22} color={colors.textTertiary} />
            </View>
            <Text style={styles.playerName}>{match.hostedBy ?? 'Aditi Onkar'}</Text>
            <Text style={styles.friendTag}>Friend</Text>
          </View>

          <View style={[styles.divider, { marginTop: 12 }]} />

          {/* Players */}
          <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Players</Text>
          <View style={styles.playerCard}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={22} color={colors.textTertiary} />
            </View>
            <Text style={styles.playerName}>You</Text>
          </View>
          {(match.players ?? ['Shashidhar']).map((player: string, index: number) => (
            <View key={index} style={styles.playerCard}>
              <View style={styles.avatarCircle}>
                <Ionicons name="person" size={22} color={colors.textTertiary} />
              </View>
              <Text style={styles.playerName}>{player}</Text>
              <Text style={styles.friendTag}>Friend</Text>
            </View>
          ))}

          {/* Join Button */}
          <View style={styles.joinButtonContainer}>
            <TouchableOpacity style={styles.joinButton}>
              <Text style={styles.joinButtonText}>Join Match</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}