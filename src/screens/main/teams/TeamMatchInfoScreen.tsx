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

const MOCK_PLAYERS = [
  { id: '1', name: 'Aditi Onkar', isFriend: true },
  { id: '2', name: 'Rushil', isFriend: false },
];

export default function TeamMatchInfoScreen({ navigation, route }: any) {
  const colors = useColors();
  const { match } = route.params ?? {};

  const venue = match?.venue ?? 'Match Box Turf';
  const date = match?.date ?? '15/02/26';
  const startTime = match?.startTime ?? '5:00 PM';
  const endTime = match?.endTime ?? '6:00 PM';
  const teamName = match?.challengerTeam ?? 'AllStarsFC';
  const isChallenge = match?.isChallenge ?? false;
  const goingCount = match?.goingCount ?? 1;

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.backgroundPrimary },
    safeArea: { flex: 1 },

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
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    moreButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: 35,
      fontFamily: FontFamily.bold,
      color: colors.textPrimary,
      paddingHorizontal: 20,
      marginBottom: 8,
      marginTop: 10,
    },
    venueName: {
      fontSize: 22,
      fontFamily: FontFamily.semiBold,
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: 20,
      paddingHorizontal: 20,
    },

    // Info Card
    infoCard: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 28,
      marginHorizontal: 16,
      padding: 20,
      marginBottom: 28,
      gap: 16,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    infoText: {
      fontSize: FontSize.md,
      fontFamily: FontFamily.medium,
      color: colors.textPrimary,
    },

    // Divider
    divider: {
      height: 0.5,
      backgroundColor: colors.textTertiary,
      opacity: 0.3,
      marginHorizontal: 20,
      marginBottom: 24,
    },

    // Section
    sectionTitle: {
      fontSize: FontSize.lg,
      fontFamily: FontFamily.bold,
      color: colors.textPrimary,
      paddingHorizontal: 20,
      marginBottom: 12,
    },
    sectionContainer: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 28,
      marginHorizontal: 16,
      paddingVertical: 8,
      paddingHorizontal: 20,
      marginBottom: 28,
    },

    // Player Row
    playerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
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
      fontFamily: FontFamily.semiBold,
      color: colors.textPrimary,
      marginLeft: 12,
    },
    friendTag: {
      fontSize: FontSize.xs,
      fontFamily: FontFamily.semiBold,
      color: colors.systemGreen,
      backgroundColor: colors.backgroundPrimary,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
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
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.systemGreen} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>

          {/* Title + Venue */}
          <Text style={styles.title}>Match Info</Text>
          <Text style={styles.venueName}>{venue}</Text>

          {/* Info Card */}
          <View style={styles.infoCard}>

            {/* Date */}
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color={colors.textTertiary} />
              <Text style={styles.infoText}>{date}</Text>
            </View>

            {/* Time */}
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color={colors.textTertiary} />
              <Text style={styles.infoText}>{startTime} - {endTime}</Text>
            </View>

            {/* Team (challenge only) */}
            {isChallenge && (
              <View style={styles.infoRow}>
                <Ionicons name="flag" size={20} color={colors.textTertiary} />
               
                <Text style={styles.infoText}>{teamName}</Text>
              </View>
            )}

            {/* Going */}
            <View style={styles.infoRow}>
              <Ionicons name="people-outline" size={20} color={colors.textTertiary} />
              <Text style={styles.infoText}>{goingCount} going</Text>
            </View>

          </View>

          <View style={styles.divider} />

          {/* Players */}
          <Text style={styles.sectionTitle}>Players</Text>
          <View style={styles.sectionContainer}>
            {MOCK_PLAYERS.map((player, index) => (
              <View
                key={player.id}
                style={[
                  styles.playerRow,
                  index !== MOCK_PLAYERS.length - 1 && {
                    borderBottomWidth: 0,
                    borderBottomColor: colors.backgroundTertiary,
                  },
                ]}
              >
                <View style={styles.avatarCircle}>
                  <Ionicons name="person-outline" size={22} color={colors.textTertiary} />
                </View>
                <Text style={styles.playerName}>{player.name}</Text>
                {player.isFriend && (
                  <Text style={styles.friendTag}>Friend</Text>
                )}
              </View>
            ))}
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}