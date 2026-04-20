import React, { useState, useEffect, useCallback } from 'react';
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
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../theme/colors';
import { FontFamily, FontSize } from '../../../theme/fonts';
import { supabase } from '../../../lib/supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Sport {
  id: number;
  name: string;
  emoji: string;
}

interface Friend {
  id: string;       // UUID
  name: string;     // from profiles
  email: string | null;
}

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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CreateTeamSheet({ visible, onClose, onCreated }: Props) {
  const colors = useColors();
  const isDark = colors.isDark;

  // ── form state ──
  const [teamName, setTeamName] = useState('');
  const [selectedSport, setSelectedSport] = useState<Sport | null>(null);
  const [sportExpanded, setSportExpanded] = useState(false);
  const [friendsExpanded, setFriendsExpanded] = useState(false);
  const [friendSearch, setFriendSearch] = useState('');
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());

  // ── data state ──
  const [sports, setSports] = useState<Sport[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [sportsLoading, setSportsLoading] = useState(false);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const filteredFriends = friends.filter(f =>
    (f.name || f.email || '').toLowerCase().includes(friendSearch.toLowerCase()),
  );

  // ── load data when modal opens ──
  useEffect(() => {
    if (!visible) return;
    fetchSports();
    fetchFriends();
  }, [visible]);

  const fetchSports = async () => {
    setSportsLoading(true);
    try {
      const { data, error } = await supabase
        .from('sports')
        .select('id, name, emoji')
        .order('name');
      if (!error && data) setSports(data as Sport[]);
    } catch (e) {
      console.error('❌ fetchSports:', e);
    } finally {
      setSportsLoading(false);
    }
  };

  const fetchFriends = async () => {
    setFriendsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) {
        console.log('❌ fetchFriends: no session');
        return;
      }

      // Use the same RPC function as the Swift implementation
      const { data, error } = await supabase
        .rpc('get_user_friends_with_profiles', { user_uuid: userId });

      if (error) {
        console.error('❌ fetchFriends RPC error:', JSON.stringify(error));
        setFriends([]);
        return;
      }

      console.log('✅ fetchFriends RPC returned', data?.length ?? 0, 'friends');

      const seen = new Set<string>();
      const parsed: Friend[] = (data ?? []).flatMap((row: any) => {
        const id = row.id ?? row.friend_id;
        if (!id || seen.has(id)) return [];
        seen.add(id);
        return [{ id, name: row.name ?? '', email: row.email ?? null }];
      });

      setFriends(parsed);
    } catch (e) {
      console.error('❌ fetchFriends exception:', e);
      setFriends([]);
    } finally {
      setFriendsLoading(false);
    }
  };

  // ── reset on close ──
  const resetState = () => {
    setTeamName('');
    setSelectedSport(null);
    setSportExpanded(false);
    setFriendsExpanded(false);
    setFriendSearch('');
    setInvitedIds(new Set());
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // ── create team ──
  const handleCreate = async () => {
    const trimmedName = teamName.trim();
    if (!selectedSport) {
      Alert.alert('Missing Field', 'Please select a sport');
      return;
    }
    if (!trimmedName) {
      Alert.alert('Missing Field', 'Please enter a team name');
      return;
    }
    if (trimmedName.length < 3) {
      Alert.alert('Invalid Name', 'Team name must be at least 3 characters');
      return;
    }
    if (trimmedName.length > 50) {
      Alert.alert('Invalid Name', 'Team name cannot exceed 50 characters');
      return;
    }

    Keyboard.dismiss();
    setCreating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error('Not authenticated');

      // 1. Fetch creator's profile (name + college_id)
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, college_id')
        .eq('id', userId)
        .single();

      const senderName: string = profile?.name ?? 'Someone';
      const collegeId: number | null = profile?.college_id ?? null;

      // 2. Insert the team
      const { data: insertedTeams, error: teamErr } = await supabase
        .from('teams')
        .insert({
          name: trimmedName,
          sport_id: selectedSport.id,
          captain_id: userId,
          college_id: collegeId,
        })
        .select('id, name')
        .single();

      if (teamErr) throw teamErr;
      const teamId: string = insertedTeams.id;

      // 3. Add creator as captain in team_members
      const { error: memberErr } = await supabase
        .from('team_members')
        .insert({ team_id: teamId, user_id: userId, role: 'captain' });

      if (memberErr) throw memberErr;

      // 4. Send team_invitation notifications to invited friends
      if (invitedIds.size > 0) {
        const notifs = [...invitedIds].map(friendId => ({
          sender_id: userId,
          receiver_id: friendId,
          type: 'team_invitation',
          message: `${senderName} has invited you to join their ${selectedSport.name} team ${trimmedName}`,
        }));

        const { error: notifErr } = await supabase
          .from('notifications')
          .insert(notifs);

        if (notifErr) console.error('⚠️ notif insert error:', notifErr);
      }

      // 5. Notify parent & close
      onCreated({
        sport: selectedSport.name,
        name: trimmedName,
        members: [...invitedIds],
      });
      resetState();
      onClose();
    } catch (err: any) {
      console.error('❌ handleCreate:', err);
      Alert.alert('Error', err?.message ?? 'Failed to create team. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const toggleInvite = (id: string) => {
    setInvitedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const isCreateEnabled = !!selectedSport && teamName.trim().length >= 3;

  // ── colours ──
  const cardBg = isDark ? '#282828' : '#E5E5EA';
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const placeholderColor = isDark ? '#8E8E93' : '#8E8E93';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={[styles.sheet, { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' }]}>

              {/* Handle */}
              <View style={[styles.handle, { backgroundColor: isDark ? 'rgba(255,255,255,0.3)' : '#C7C7CC' }]} />

              {/* Close */}
              <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
                <Ionicons name="close" size={18} color={textColor} />
              </TouchableOpacity>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                {/* ── Sport dropdown trigger ── */}
                <TouchableOpacity
                  style={[styles.dropdown, { backgroundColor: cardBg }]}
                  onPress={() => {
                    setSportExpanded(v => !v);
                    setFriendsExpanded(false);
                  }}
                >
                  {sportsLoading ? (
                    <ActivityIndicator size="small" color={colors.systemGreen} />
                  ) : (
                    <Text style={[styles.dropdownText, { color: selectedSport ? textColor : placeholderColor }]}>
                      {selectedSport ? `${selectedSport.emoji}  ${selectedSport.name}` : 'Select sport'}
                    </Text>
                  )}
                  <Ionicons name="chevron-down" size={16} color={placeholderColor} />
                </TouchableOpacity>

                {/* Sport list */}
                {sportExpanded && (
                  <View style={[styles.dropdownList, { backgroundColor: cardBg }]}>
                    {sports.map(sport => (
                      <TouchableOpacity
                        key={sport.id}
                        style={[styles.dropdownItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}
                        onPress={() => {
                          setSelectedSport(sport);
                          setSportExpanded(false);
                        }}
                      >
                        <Text style={{ fontSize: 20 }}>{sport.emoji}</Text>
                        <Text style={[styles.dropdownItemText, { color: textColor }]}>{sport.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* ── Team name ── */}
                <TextInput
                  style={[styles.input, { backgroundColor: cardBg, color: textColor }]}
                  placeholder="Team name"
                  placeholderTextColor={placeholderColor}
                  value={teamName}
                  onChangeText={setTeamName}
                  maxLength={50}
                />

                {/* ── Friends dropdown trigger ── */}
                <TouchableOpacity
                  style={[styles.dropdown, { backgroundColor: cardBg }]}
                  onPress={() => {
                    setFriendsExpanded(v => !v);
                    setSportExpanded(false);
                  }}
                >
                  {friendsLoading ? (
                    <ActivityIndicator size="small" color={colors.systemGreen} />
                  ) : (
                    <Text style={[styles.dropdownText, { color: textColor }]}>
                      {friends.length === 0
                        ? 'No friends to invite'
                        : invitedIds.size > 0
                        ? `${invitedIds.size} friend${invitedIds.size > 1 ? 's' : ''} selected`
                        : `Select friends (${friends.length})`}
                    </Text>
                  )}
                  {friends.length > 0 && (
                    <Ionicons name="chevron-down" size={16} color={placeholderColor} />
                  )}
                </TouchableOpacity>

                {/* Friends list */}
                {friendsExpanded && friends.length > 0 && (
                  <View style={[styles.dropdownList, { backgroundColor: cardBg }]}>

                    {/* Search bar */}
                    <View style={[styles.searchRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
                      <Ionicons name="search" size={16} color={placeholderColor} />
                      <TextInput
                        style={[styles.searchInput, { color: textColor }]}
                        placeholder="Search friends"
                        placeholderTextColor={placeholderColor}
                        value={friendSearch}
                        onChangeText={setFriendSearch}
                      />
                    </View>

                    {filteredFriends.length === 0 ? (
                      <View style={styles.emptyContainer}>
                        <Text style={[styles.emptyText, { color: placeholderColor }]}>No friends found</Text>
                      </View>
                    ) : (
                      filteredFriends.map(friend => {
                        const invited = invitedIds.has(friend.id);
                        const displayName = friend.name || friend.email || 'Unknown';
                        return (
                          <TouchableOpacity
                            key={friend.id}
                            style={styles.friendItem}
                            onPress={() => toggleInvite(friend.id)}
                          >
                            <View style={[styles.avatar, { backgroundColor: isDark ? '#3A3A3C' : '#D1D1D6' }]}>
                              <Text style={{ fontSize: 18 }}>👤</Text>
                            </View>
                            <Text style={[styles.friendName, { color: textColor }]}>{displayName}</Text>
                            <View style={[
                              styles.inviteBadge,
                              { backgroundColor: invited ? (isDark ? '#3A3A3C' : '#D1D1D6') : colors.systemGreen },
                            ]}>
                              <Text style={[styles.inviteText, { color: invited ? placeholderColor : '#FFFFFF' }]}>
                                {invited ? 'Invited' : 'Invite'}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </View>
                )}

                {/* ── Create button ── */}
                <TouchableOpacity
                  style={[
                    styles.createButton,
                    { backgroundColor: colors.systemGreen, opacity: isCreateEnabled && !creating ? 1 : 0.45 },
                  ]}
                  onPress={handleCreate}
                  disabled={!isCreateEnabled || creating}
                >
                  {creating ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.createButtonText}>Create Team</Text>
                  )}
                </TouchableOpacity>

              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
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
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },

  // Dropdown trigger
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
    flex: 1,
  },

  // Dropdown list
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
  },
  dropdownItemText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
  },

  // Team name input
  input: {
    height: 52,
    borderRadius: 50,
    paddingHorizontal: 20,
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    marginBottom: 12,
  },

  // Search inside friends list
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    padding: 0,
  },

  // Friend row
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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

  // Empty state
  emptyContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
  },

  // Create button
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