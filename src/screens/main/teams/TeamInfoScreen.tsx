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
import EditTeamInfoScreen from './EditTeamInfoScreen';

const MOCK_PLAYERS = ['Raaghav', 'Rashmika', 'Dhruva'];

export default function TeamInfoScreen({ navigation }: any) {
  const colors = useColors();
  const [showEdit, setShowEdit] = useState(false);
  const [teamNameState, setTeamNameState] = useState('AllStarsFC');

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.backgroundPrimary },
    safeArea: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
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
    },
    headerTitle: {
      fontSize: FontSize.lg,
      fontFamily: FontFamily.bold,
      color: colors.textPrimary,
    },
    editButton: {
      width: 60,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    editText: {
      fontSize: FontSize.md,
      fontFamily: FontFamily.medium,
      color: colors.systemGreen,
    },
    avatarSection: {
      alignItems: 'center',
      marginTop: 16,
      marginBottom: 20,
    },
    avatarCircle: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    teamName: {
      fontSize: 28,
      fontFamily: FontFamily.bold,
      color: colors.textPrimary,
      marginBottom: 6,
    },
    teamSubtitle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    teamSubtitleText: {
      fontSize: FontSize.sm,
      fontFamily: FontFamily.regular,
      color: colors.textSecondary,
    },
    dot: {
      fontSize: FontSize.sm,
      color: colors.textSecondary,
    },
    playersCount: {
      fontSize: FontSize.sm,
      fontFamily: FontFamily.regular,
      color: colors.systemGreen,
    },
    menuCard: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 20,
      marginHorizontal: 20,
      marginBottom: 24,
      overflow: 'hidden',
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 18,
    },
    menuIcon: {
      width: 32,
      marginRight: 14,
    },
    menuLabel: {
      flex: 1,
      fontSize: FontSize.md,
      fontFamily: FontFamily.regular,
      color: colors.textPrimary,
    },
    menuDivider: {
      height: 0.5,
      backgroundColor: colors.backgroundTertiary,
      marginHorizontal: 20,
    },
    divider: {
      height: 0.5,
      backgroundColor: colors.backgroundTertiary,
      marginHorizontal: 20,
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: FontSize.lg,
      fontFamily: FontFamily.bold,
      color: colors.textPrimary,
      paddingHorizontal: 20,
      marginBottom: 12,
    },
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
    playerAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.backgroundTertiary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    captainAvatar: {
      backgroundColor: colors.textPrimary,
    },
    playerName: {
      flex: 1,
      fontSize: FontSize.md,
      fontFamily: FontFamily.medium,
      color: colors.textPrimary,
    },
    deleteButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: `${'#FF3B30'}22`,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={20} color={colors.systemGreen} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Team Info</Text>
            <TouchableOpacity style={styles.editButton} onPress={() => setShowEdit(true)}>
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          </View>

          {/* Avatar + Name */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarCircle}>
              <Ionicons name="people-outline" size={52} color={colors.textTertiary} />
            </View>
            <Text style={styles.teamName}>{teamNameState}</Text>
            <View style={styles.teamSubtitle}>
              <Text style={styles.teamSubtitleText}>Team</Text>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.playersCount}>4 players</Text>
            </View>
          </View>

          {/* Menu Card */}
          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('AddPlayers')}>
  <View style={styles.menuIcon}>
    <Ionicons name="person-add-outline" size={22} color={colors.textPrimary} />
  </View>
  <Text style={styles.menuLabel}>Add players</Text>
  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
</TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuIcon}>
                <Ionicons name="grid-outline" size={22} color={colors.textPrimary} />
              </View>
              <Text style={styles.menuLabel}>Matches</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuIcon}>
                <Ionicons name="trash-outline" size={22} color={colors.textPrimary} />
              </View>
              <Text style={styles.menuLabel}>Delete Team</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Captain */}
          <Text style={styles.sectionTitle}>Captain</Text>
          <View style={styles.playerCard}>
            <View style={[styles.playerAvatar, styles.captainAvatar]}>
              <Ionicons name="person" size={22} color={colors.backgroundPrimary} />
            </View>
            <Text style={styles.playerName}>You</Text>
          </View>

          <View style={[styles.divider, { marginTop: 12 }]} />

          {/* Players */}
          <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Players</Text>
          {MOCK_PLAYERS.map((player) => (
            <View key={player} style={styles.playerCard}>
              <View style={styles.playerAvatar}>
                <Ionicons name="person-outline" size={22} color={colors.textTertiary} />
              </View>
              <Text style={styles.playerName}>{player}</Text>
              <TouchableOpacity style={styles.deleteButton}>
                <Ionicons name="trash-outline" size={16} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          ))}

          <View style={{ height: 40 }} />
        </ScrollView>

        <EditTeamInfoScreen
          visible={showEdit}
          onClose={() => setShowEdit(false)}
          teamName={teamNameState}
          onSave={(name) => setTeamNameState(name)}
        />
      </SafeAreaView>
    </View>
  );
}