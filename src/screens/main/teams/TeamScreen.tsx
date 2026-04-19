import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../theme/colors';
import { FontFamily, FontSize, LineHeight } from '../../../theme/fonts';
import CreateTeamSheet, { CreatedTeam } from './CreateTeamSheet';

const TEAMS = [
  { id: '1', name: 'Kick Off FC', sport: 'football', emoji: '⚽' },
  { id: '2', name: 'Super FC', sport: 'football', emoji: '⚽' },
  { id: '3', name: 'Bask FC', sport: 'basketball', emoji: '🏀' },
  { id: '4', name: 'AllStars FC', sport: 'football', emoji: '⚽' },
  { id: '5', name: 'Thunder FC', sport: 'basketball', emoji: '🏀' },
];

export default function TeamScreen({ navigation }: any) {
  const colors = useColors();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const filtered = TEAMS.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleTeamPress = (team: typeof TEAMS[0]) => {
    navigation.navigate('TeamChat', {
      teamId: team.id,
      team: {
        id: team.id,
        name: team.name,
        sport: team.sport,
        emoji: team.emoji,
        isCaptain: team.id === '1',
        members: [],
      },
    });
  };

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.backgroundPrimary },
    container: { flex: 1, paddingHorizontal: 20 },

    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 16,
      marginBottom: 16,
    },
    title: {
      fontSize: FontSize.xxxl,
      fontFamily: FontFamily.bold,
      lineHeight: LineHeight.xxxl,
      color: colors.textPrimary,
    },
    addButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
    },

    // Search
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginBottom: 20,
      backgroundColor: colors.backgroundSecondary,
    },
    searchIcon: { fontSize: FontSize.md, marginRight: 8, color: colors.textTertiary },
    searchInput: {
      flex: 1,
      fontSize: FontSize.md,
      fontFamily: FontFamily.regular,
      padding: 0,
      color: colors.textPrimary,
    },

    // List
    listContent: { gap: 12, paddingBottom: 40 },
    teamItem: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 18,
      paddingHorizontal: 18,
      paddingVertical: 18,
      backgroundColor: colors.backgroundSecondary,
    },
    teamEmoji: { fontSize: 26, marginRight: 14 },
    teamName: {
      flex: 1,
      fontSize: FontSize.lg,
      fontFamily: FontFamily.medium,
      lineHeight: LineHeight.lg,
      color: colors.textPrimary,
    },
  });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Teams</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowCreate(true)}
          >
            <Ionicons name="add" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search teams"
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Team List */}
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.teamItem}
              activeOpacity={0.7}
              onPress={() => handleTeamPress(item)}
            >
              <Text style={styles.teamEmoji}>{item.emoji}</Text>
              <Text style={styles.teamName}>{item.name}</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        />

      </View>

      <CreateTeamSheet
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(_team: CreatedTeam) => {
          setShowCreate(false);
        }}
      />
    </SafeAreaView>
  );
}