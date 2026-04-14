// src/screens/main/teams/CreateTeamSheet.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useColors } from '../../../theme/colors';
import { FontFamily, FontSize, LineHeight } from '../../../theme/fonts';

const sports = [
  { id: 'badminton', label: 'Badminton', emoji: '🏸' },
  { id: 'basketball', label: 'Basketball', emoji: '🏀' },
  { id: 'cricket', label: 'Cricket', emoji: '🏏' },
  { id: 'football', label: 'Football', emoji: '⚽' },
  { id: 'tabletennis', label: 'Table Tennis', emoji: '🏓' },
  { id: 'tennis', label: 'Tennis', emoji: '🎾' },
];

const MOCK_FRIENDS = [
  { id: '1', name: 'Rashmika' },
  { id: '2', name: 'Dhruva' },
  { id: '3', name: 'Rushil' },
  { id: '4', name: 'Sumedh' },
  { id: '5', name: 'Raaghav' },
  { id: '6', name: 'Aditya' },
  { id: '7', name: 'Priya' },
  { id: '8', name: 'Karan' },
  { id: '9', name: 'Meera' },
  { id: '10', name: 'Rohan' },
];

export interface CreatedTeam {
  sport: string;
  name: string;
  members: string[];
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreated: (team: CreatedTeam) => void;
}

export default function CreateTeamSheet({ visible, onClose, onCreated }: Props) {
  const colors = useColors();
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [teamName, setTeamName] = useState('');
  const [sportExpanded, setSportExpanded] = useState(false);
  const [friendsExpanded, setFriendsExpanded] = useState(false);
  const [friendSearch, setFriendSearch] = useState('');
  const [invitedFriends, setInvitedFriends] = useState<string[]>([]);

  const selectedSportObj = sports.find(s => s.id === selectedSport);
  const filteredFriends = MOCK_FRIENDS.filter(f =>
    f.name.toLowerCase().includes(friendSearch.toLowerCase()),
  );

  const toggleInvite = (id: string) => {
    setInvitedFriends(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id],
    );
  };

  const handleCreate = () => {
    if (!selectedSport || !teamName.trim()) return;
    const team: CreatedTeam = { sport: selectedSport, name: teamName.trim(), members: invitedFriends };
    onCreated(team);
    // Reset
    setSelectedSport(null);
    setTeamName('');
    setInvitedFriends([]);
    setFriendSearch('');
    setSportExpanded(false);
    setFriendsExpanded(false);
  };

  const handleClose = () => {
    setSportExpanded(false);
    setFriendsExpanded(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      {/* Dim backdrop */}
      <Pressable style={styles.backdrop} onPress={handleClose} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
        pointerEvents="box-none"
      >
        <View style={[styles.sheet, { backgroundColor: colors.backgroundSecondary }]}>
          {/* Drag handle */}
          <View style={[styles.handle, { backgroundColor: colors.backgroundQuaternary }]} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {/* Select Sport Dropdown */}
            <TouchableOpacity
              style={[styles.dropdown, { backgroundColor: colors.backgroundTertiary }]}
              onPress={() => {
                setSportExpanded(prev => !prev);
                setFriendsExpanded(false);
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.dropdownLabel, { color: selectedSportObj ? colors.textPrimary : colors.textTertiary }]}>
                {selectedSportObj
                  ? `${selectedSportObj.emoji}  ${selectedSportObj.label}`
                  : 'Select Sport'}
              </Text>
              <Text style={[styles.chevron, { color: colors.textTertiary }]}>
                {sportExpanded ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>

            {/* Sport Options */}
            {sportExpanded && (
              <View style={[styles.dropdownMenu, { backgroundColor: colors.backgroundTertiary }]}>
                {sports.map(sport => (
                  <TouchableOpacity
                    key={sport.id}
                    style={styles.sportOption}
                    onPress={() => {
                      setSelectedSport(sport.id);
                      setSportExpanded(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.sportEmoji}>{sport.emoji}</Text>
                    <Text style={[styles.sportLabel, { color: colors.textPrimary }]}>
                      {sport.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Team Name Input */}
            <View style={[styles.input, { backgroundColor: colors.backgroundTertiary }]}>
              <TextInput
                style={[styles.inputText, { color: colors.textPrimary }]}
                placeholder="Team name"
                placeholderTextColor={colors.textTertiary}
                value={teamName}
                onChangeText={setTeamName}
              />
            </View>

            {/* Select Friends Dropdown */}
            <TouchableOpacity
              style={[styles.dropdown, { backgroundColor: colors.backgroundTertiary }]}
              onPress={() => {
                setFriendsExpanded(prev => !prev);
                setSportExpanded(false);
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.dropdownLabel, { color: colors.textPrimary }]}>
                {`Select friends (${MOCK_FRIENDS.length})`}
              </Text>
              <Text style={[styles.chevron, { color: colors.textTertiary }]}>
                {friendsExpanded ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>

            {/* Friends List */}
            {friendsExpanded && (
              <View style={[styles.dropdownMenu, { backgroundColor: colors.backgroundTertiary }]}>
                {/* Friend Search */}
                <View style={[styles.friendSearch, { backgroundColor: colors.backgroundSecondary }]}>
                  <Text style={[styles.searchIcon, { color: colors.textTertiary }]}>🔍</Text>
                  <TextInput
                    style={[styles.friendSearchInput, { color: colors.textPrimary }]}
                    placeholder="Search friends"
                    placeholderTextColor={colors.textTertiary}
                    value={friendSearch}
                    onChangeText={setFriendSearch}
                  />
                </View>

                {filteredFriends.map(friend => {
                  const invited = invitedFriends.includes(friend.id);
                  return (
                    <View key={friend.id} style={styles.friendRow}>
                      <View style={styles.avatarCircle}>
                        <Text style={styles.avatarIcon}>👤</Text>
                      </View>
                      <Text style={[styles.friendName, { color: colors.textPrimary }]}>
                        {friend.name}
                      </Text>
                      <TouchableOpacity
                        style={[
                          styles.inviteButton,
                          {
                            backgroundColor: invited
                              ? colors.backgroundQuaternary
                              : colors.systemGreen,
                          },
                        ]}
                        onPress={() => toggleInvite(friend.id)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.inviteText,
                            { color: invited ? colors.textSecondary : '#FFFFFF' },
                          ]}
                        >
                          {invited ? 'Invited' : 'Invite'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Create Button */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[
                  styles.createButton,
                  {
                    backgroundColor: colors.systemGreen,
                    opacity: selectedSport && teamName.trim() ? 1 : 0.5,
                  },
                ]}
                onPress={handleCreate}
                activeOpacity={0.85}
                disabled={!selectedSport || !teamName.trim()}
              >
                <Text style={styles.createButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  keyboardAvoid: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    maxHeight: '85%',
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 14,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  dropdownLabel: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.medium,
    lineHeight: LineHeight.md,
  },
  chevron: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
  },
  dropdownMenu: {
    borderRadius: 14,
    overflow: 'hidden',
    paddingVertical: 8,
  },
  sportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sportEmoji: {
    fontSize: 22,
    marginRight: 16,
  },
  sportLabel: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semiBold,
    lineHeight: LineHeight.md,
  },
  input: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  inputText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    padding: 0,
  },
  friendSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginHorizontal: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  friendSearchInput: {
    flex: 1,
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    padding: 0,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF22',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarIcon: {
    fontSize: 18,
  },
  friendName: {
    flex: 1,
    fontSize: FontSize.md,
    fontFamily: FontFamily.medium,
    lineHeight: LineHeight.md,
  },
  inviteButton: {
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  inviteText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
  },
  footer: {
    alignItems: 'center',
    marginTop: 8,
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