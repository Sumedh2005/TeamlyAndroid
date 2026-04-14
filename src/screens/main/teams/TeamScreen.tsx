// src/screens/main/teams/TeamScreen.tsx
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
import { useColors } from '../../../theme/colors';
import { FontFamily, FontSize, LineHeight } from '../../../theme/fonts';
import CreateTeamSheet, { CreatedTeam } from './CreateTeamSheet';

const TEAMS = [
  { id: '1', name: 'Kick Off FC', sport: 'football', emoji: '⚽' },
  { id: '2', name: 'Super FC', sport: 'football', emoji: '⚽' },
  { id: '3', name: 'Bask FC', sport: 'basketball', emoji: '🏀' },
];

export default function TeamScreen() {
  const colors = useColors();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const filtered = TEAMS.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.backgroundPrimary }]}>
      <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
        {/* Header */}
        <Text style={[styles.title, { color: colors.textPrimary }]}>Teams</Text>

        {/* Search */}
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

        {/* Team List */}
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.teamItem, { backgroundColor: colors.backgroundSecondary }]}
              activeOpacity={0.7}
            >
              <Text style={styles.teamEmoji}>{item.emoji}</Text>
              <Text style={[styles.teamName, { color: colors.textPrimary }]}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />

        {/* Create Button */}
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

      {/* Create Team Modal Sheet */}
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

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
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
  searchIcon: {
    fontSize: FontSize.md,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    padding: 0,
  },
  listContent: {
    gap: 12,
  },
  separator: {
    height: 0,
  },
  teamItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  teamEmoji: {
    fontSize: 26,
    marginRight: 14,
  },
  teamName: {
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