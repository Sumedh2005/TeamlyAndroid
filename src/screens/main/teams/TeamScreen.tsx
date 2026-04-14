import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Add this import
import { useColors } from '../../../theme/colors';
import { FontFamily, FontSize, LineHeight } from '../../../theme/fonts';
import CreateTeamSheet, { CreatedTeam } from './CreateTeamSheet';

const TEAMS = [
  { id: '1', name: 'Kick Off FC', sport: 'football', emoji: '⚽' },
  { id: '2', name: 'Super FC', sport: 'football', emoji: '⚽' },
  { id: '3', name: 'Bask FC', sport: 'basketball', emoji: '🏀' },
];

export default function TeamScreen({ navigation }: any) {
  const colors = useColors();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const filtered = TEAMS.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleTeamPress = (team: typeof TEAMS[0]) => {
    // Navigate to TeamChat screen with team data
    navigation.navigate('TeamChat', { 
      teamId: team.id,
      team: {
        id: team.id,
        name: team.name,
        sport: team.sport,
        emoji: team.emoji,
        isCaptain: team.id === '1', // Example: Make first team captain for testing
        members: []
      }
    });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.backgroundPrimary }]}>
      <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Teams</Text>

        <View style={[styles.searchBar, { backgroundColor: colors.backgroundSecondary }]}>
          <Text style={[styles.searchIcon, { color: colors.textTertiary }]}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search teams"
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.teamItem, { backgroundColor: colors.backgroundSecondary }]}
              activeOpacity={0.7}
              onPress={() => handleTeamPress(item)}
            >
              <Text style={styles.teamEmoji}>{item.emoji}</Text>
              <Text style={[styles.teamName, { color: colors.textPrimary }]}>{item.name}</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        />

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: colors.systemGreen }]}
            activeOpacity={0.85}
            onPress={() => setShowCreate(true)}
          >
            <Text style={styles.createButtonText}>Create</Text>
          </TouchableOpacity>
        </View>
      </View>

      <CreateTeamSheet
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(_team: CreatedTeam) => {
          setShowCreate(false);
          // Optionally add the new team to your list here
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20 },
  title: {
    fontSize: FontSize.xxxl,
    fontFamily: FontFamily.bold,
    lineHeight: LineHeight.xxxl,
    marginTop: 16,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
  },
  searchIcon: { fontSize: FontSize.md, marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    padding: 0,
  },
  listContent: { gap: 12 },
  teamItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  teamEmoji: { fontSize: 26, marginRight: 14 },
  teamName: {
    flex: 1,
    fontSize: FontSize.lg,
    fontFamily: FontFamily.medium,
    lineHeight: LineHeight.lg,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 24,
    paddingTop: 12,
  },
  createButton: {
    borderRadius: 28,
    paddingHorizontal: 64,
    paddingVertical: 16,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semiBold,
    lineHeight: LineHeight.lg,
  },
});