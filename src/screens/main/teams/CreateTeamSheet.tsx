import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  { id: '11', name: 'Arjun' },
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
    onCreated({ sport: selectedSport, name: teamName.trim(), members: invitedFriends });
    // Reset form
    setSelectedSport(null);
    setTeamName('');
    setInvitedFriends([]);
    setFriendSearch('');
    setSportExpanded(false);
    setFriendsExpanded(false);
    onClose();
  };

  const isCreateEnabled = !!selectedSport && teamName.trim().length > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={[styles.sheet, { backgroundColor: colors.backgroundSecondary }]}>
              <View style={[styles.handle, { backgroundColor: colors.backgroundQuaternary }]} />

              {/* Close Button */}
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={18} color={colors.textPrimary} />
              </TouchableOpacity>

              <ScrollView 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* Select Sport */}
                <TouchableOpacity
                  style={[styles.dropdown, { backgroundColor: colors.backgroundPrimary }]}
                  onPress={() => {
                    setSportExpanded(!sportExpanded);
                    setFriendsExpanded(false);
                  }}
                >
                  <Text style={[styles.dropdownText, {
                    color: selectedSportObj ? colors.textPrimary : colors.textTertiary
                  }]}>
                    {selectedSportObj
                      ? `${selectedSportObj.emoji}  ${selectedSportObj.label}`
                      : 'Select sport'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={colors.textTertiary} />
                </TouchableOpacity>

                {sportExpanded && (
                  <View style={[styles.dropdownList, { backgroundColor: colors.backgroundPrimary }]}>
                    {sports.map(sport => (
                      <TouchableOpacity
                        key={sport.id}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setSelectedSport(sport.id);
                          setSportExpanded(false);
                        }}
                      >
                        <Text style={{ fontSize: 20 }}>{sport.emoji}</Text>
                        <Text style={[styles.dropdownItemText, { color: colors.textPrimary }]}>
                          {sport.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Team Name */}
                <TextInput
                  style={[styles.input, { backgroundColor: colors.backgroundPrimary, color: colors.textPrimary }]}
                  placeholder="Team name"
                  placeholderTextColor={colors.textTertiary}
                  value={teamName}
                  onChangeText={setTeamName}
                />

                {/* Select Friends */}
                <TouchableOpacity
                  style={[styles.dropdown, { backgroundColor: colors.backgroundPrimary }]}
                  onPress={() => {
                    setFriendsExpanded(!friendsExpanded);
                    setSportExpanded(false);
                  }}
                >
                  <Text style={[styles.dropdownText, { color: colors.textPrimary }]}>
                    Select friends ({MOCK_FRIENDS.length})
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={colors.textTertiary} />
                </TouchableOpacity>

                {friendsExpanded && (
                  <View style={[styles.dropdownList, { backgroundColor: colors.backgroundPrimary }]}>
                    {/* Search Bar */}
                    <View style={[styles.searchContainer, { borderBottomColor: colors.backgroundTertiary }]}>
                      <Ionicons name="search" size={18} color={colors.textTertiary} />
                      <TextInput
                        style={[styles.searchInput, { color: colors.textPrimary }]}
                        placeholder="Search friends"
                        placeholderTextColor={colors.textTertiary}
                        value={friendSearch}
                        onChangeText={setFriendSearch}
                      />
                    </View>

                    {filteredFriends.map(friend => {
                      const invited = invitedFriends.includes(friend.id);
                      return (
                        <TouchableOpacity
                          key={friend.id}
                          style={styles.friendItem}
                          onPress={() => toggleInvite(friend.id)}
                        >
                          <View style={[styles.avatar, { backgroundColor: colors.backgroundTertiary }]}>
                            <Text style={styles.avatarText}>👤</Text>
                          </View>
                          <Text style={[styles.friendName, { color: colors.textPrimary }]}>
                            {friend.name}
                          </Text>
                          <View style={[
                            styles.inviteBadge,
                            { backgroundColor: invited ? colors.backgroundTertiary : colors.systemGreen }
                          ]}>
                            <Text style={[
                              styles.inviteText,
                              { color: invited ? colors.textSecondary : '#FFFFFF' }
                            ]}>
                              {invited ? 'Invited' : 'Invite'}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}

                    {filteredFriends.length === 0 && (
                      <View style={styles.emptyContainer}>
                        <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                          No friends found
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Create Button */}
                <TouchableOpacity
                  style={[
                    styles.createButton,
                    { backgroundColor: colors.systemGreen, opacity: isCreateEnabled ? 1 : 0.45 }
                  ]}
                  onPress={handleCreate}
                  disabled={!isCreateEnabled}
                >
                  <Text style={styles.createButtonText}>Create Team</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 48,
    paddingTop: 12,
    maxHeight: '90%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  dropdown: {
    height: 52,
    borderRadius: 50,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dropdownText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
  },
  dropdownList: {
    borderRadius: 16,
    marginTop: -4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  dropdownItemText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
  },
  input: {
    height: 52,
    borderRadius: 50,
    paddingHorizontal: 20,
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    padding: 0,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
  },
  friendName: {
    flex: 1,
    fontSize: FontSize.md,
    fontFamily: FontFamily.medium,
  },
  inviteBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  inviteText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
  },
  createButton: {
    height: 52,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  createButtonText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semiBold,
    color: '#FFFFFF',
  },
});