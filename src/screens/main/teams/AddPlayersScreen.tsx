import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '../../../theme/colors';
import { FontFamily, FontSize } from '../../../theme/fonts';
import { supabase } from '../../../lib/supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Friend {
  id: string;
  name: string;
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function AddPlayersScreen({ navigation, route }: any) {
  const colors = useColors();
  const isDark = colors.isDark;

  const { team } = route.params ?? {};

  // -------- state --------
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>('Someone');
  const [allFriends, setAllFriends] = useState<Friend[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<Friend[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  // -------- load data --------
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Get current user
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return;
      setCurrentUserId(userId);

      // 2. Get current user's name
      const { data: profileData } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', userId)
        .single();
      setCurrentUserName(profileData?.name ?? 'Someone');

      if (!team?.id) return;

      // 3. Fetch accepted friends (both directions — bidirectional friendship)
      const [{ data: sentFriends }, { data: receivedFriends }] = await Promise.all([
        supabase
          .from('friends')
          .select('friend_id')
          .eq('user_id', userId)
          .eq('status', 'accepted'),
        supabase
          .from('friends')
          .select('user_id')
          .eq('friend_id', userId)
          .eq('status', 'accepted'),
      ]);

      // Collect all friend IDs (deduplicated)
      const friendIdSet = new Set<string>();
      (sentFriends ?? []).forEach((r: any) => friendIdSet.add(r.friend_id));
      (receivedFriends ?? []).forEach((r: any) => friendIdSet.add(r.user_id));

      if (friendIdSet.size === 0) {
        setAllFriends([]);
        setFilteredFriends([]);
        return;
      }

      // 4. Get current team member IDs
      const { data: membersData } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', team.id);

      const teamMemberIdSet = new Set<string>(
        (membersData ?? []).map((m: any) => m.user_id)
      );

      // 5. Filter friends not already in the team
      const eligibleFriendIds = [...friendIdSet].filter(
        id => !teamMemberIdSet.has(id)
      );

      if (eligibleFriendIds.length === 0) {
        setAllFriends([]);
        setFilteredFriends([]);
        return;
      }

      // 6. Fetch profiles for eligible friends
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', eligibleFriendIds);

      const friends: Friend[] = (profilesData ?? []).map((p: any) => ({
        id: p.id,
        name: p.name ?? 'Unknown',
      }));

      setAllFriends(friends);
      setFilteredFriends(friends);
    } catch (err) {
      console.error('❌ AddPlayersScreen loadData:', err);
    } finally {
      setLoading(false);
    }
  }, [team?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // -------- search --------
  const handleSearch = (text: string) => {
    setSearch(text);
    if (text.trim() === '') {
      setFilteredFriends(allFriends);
    } else {
      setFilteredFriends(
        allFriends.filter(f =>
          f.name.toLowerCase().includes(text.toLowerCase())
        )
      );
    }
  };

  // -------- select / deselect --------
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // -------- send invitations --------
  const handleInvite = async () => {
    if (selectedIds.size === 0 || !team) return;
    setSending(true);
    Keyboard.dismiss();

    try {
      const selectedFriends = allFriends.filter(f => selectedIds.has(f.id));

      // Insert one notification per selected friend
      const notifications = selectedFriends.map(friend => ({
        sender_id: currentUserId,
        receiver_id: friend.id,
        type: 'team_invitation',
        message: `${currentUserName} has invited you to join their team ${team.name}`,
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) throw error;

      // Remove invited friends from list (mirror Swift behaviour)
      const invitedIds = new Set(selectedFriends.map(f => f.id));
      const remaining = allFriends.filter(f => !invitedIds.has(f.id));
      setAllFriends(remaining);
      setFilteredFriends(remaining.filter(f =>
        search.trim() === '' || f.name.toLowerCase().includes(search.toLowerCase())
      ));
      setSelectedIds(new Set());

      Alert.alert(
        'Success',
        selectedFriends.length === 1
          ? `Invitation sent to ${selectedFriends[0].name}!`
          : `Invitations sent to ${selectedFriends.length} players!`
      );
    } catch (err) {
      console.error('❌ AddPlayersScreen handleInvite:', err);
      Alert.alert('Error', 'Failed to send invitations. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // -------- derived --------
  const hasSelection = selectedIds.size > 0;

  // -------- styles --------
  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.backgroundPrimary },
    safeArea: { flex: 1 },

    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 16,
    },
    backButton: {
      marginRight: 10,
    },
    title: {
      fontSize: 22,
      fontFamily: FontFamily.bold,
      color: colors.textPrimary,
    },

    // Search
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 50,
      paddingHorizontal: 16,
      height: 48,
      gap: 10,
    },
    searchInput: {
      flex: 1,
      fontSize: FontSize.md,
      fontFamily: FontFamily.regular,
      color: colors.textPrimary,
    },

    // List
    listContainer: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 24,
      marginHorizontal: 20,
      paddingVertical: 4,
    },
    divider: {
      height: 0.5,
      backgroundColor: colors.backgroundTertiary,
      marginHorizontal: 20,
    },

    // Friend row
    friendRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 14,
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
    friendName: {
      flex: 1,
      fontSize: FontSize.md,
      fontFamily: FontFamily.medium,
      color: colors.textPrimary,
    },
    checkbox: {
      width: 26,
      height: 26,
      borderRadius: 13,
      justifyContent: 'center',
      alignItems: 'center',
    },

    // Empty / loading
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 10,
    },
    emptyText: {
      fontSize: FontSize.md,
      fontFamily: FontFamily.medium,
      color: colors.textTertiary,
      textAlign: 'center',
      paddingHorizontal: 40,
    },

    // Invite button
    bottomContainer: {
      position: 'absolute',
      bottom: 36,
      left: 0,
      right: 0,
      alignItems: 'center',
    },
    inviteBtn: {
      height: 48,
      paddingHorizontal: 52,
      borderRadius: 50,
      justifyContent: 'center',
      alignItems: 'center',
    },
    inviteBtnText: {
      fontSize: FontSize.md,
      fontFamily: FontFamily.semiBold,
      color: '#FFFFFF',
    },
  });

  // -------- render --------
  return (
    <View style={s.container}>
      <LinearGradient
        colors={['rgba(52, 199, 89, 0.18)', 'rgba(52, 199, 89, 0)']}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 150,
          zIndex: 0,
        }}
      />
      <SafeAreaView style={s.safeArea}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={colors.systemGreen} />
          </TouchableOpacity>
          <Text style={s.title}>Add Players</Text>
        </View>

        {/* Search */}
        <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
          <View style={s.searchBar}>
            <Ionicons name="search-outline" size={18} color={colors.textTertiary} />
            <TextInput
              style={s.searchInput}
              placeholder="Search friends..."
              placeholderTextColor={colors.textTertiary}
              value={search}
              onChangeText={handleSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch('')}>
                <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Content */}
        {loading ? (
          <View style={s.centered}>
            <ActivityIndicator size="large" color={colors.textPrimary} />
          </View>
        ) : filteredFriends.length === 0 ? (
          <View style={s.centered}>
            <Ionicons name="people-outline" size={48} color={colors.textTertiary} />
            <Text style={s.emptyText}>
              {search.trim() !== ''
                ? 'No friends match your search'
                : allFriends.length === 0
                ? 'No friends available to add'
                : 'No friends match your search'}
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 20, paddingBottom: 110 }}
            keyboardShouldPersistTaps="handled"
            onScrollBeginDrag={Keyboard.dismiss}
          >
            <View style={s.listContainer}>
              {filteredFriends.map((friend, index) => {
                const isSelected = selectedIds.has(friend.id);
                return (
                  <React.Fragment key={friend.id}>
                    <TouchableOpacity
                      style={s.friendRow}
                      onPress={() => toggleSelect(friend.id)}
                      activeOpacity={0.7}
                    >
                      <View style={s.avatarCircle}>
                        <Ionicons name="person" size={22} color={colors.textTertiary} />
                      </View>
                      <Text style={s.friendName}>{friend.name}</Text>
                      <View
                        style={[
                          s.checkbox,
                          {
                            backgroundColor: isSelected
                              ? colors.systemGreen
                              : colors.backgroundTertiary,
                          },
                        ]}
                      >
                        {isSelected && (
                          <Ionicons name="checkmark" size={15} color="#FFFFFF" />
                        )}
                      </View>
                    </TouchableOpacity>
                    {index < filteredFriends.length - 1 && <View style={s.divider} />}
                  </React.Fragment>
                );
              })}
            </View>
          </ScrollView>
        )}

        {/* Invite Button */}
        {!loading && (
          <View style={s.bottomContainer}>
            <TouchableOpacity
              style={[
                s.inviteBtn,
                {
                  backgroundColor: hasSelection
                    ? colors.systemGreen
                    : colors.backgroundTertiary,
                },
              ]}
              onPress={handleInvite}
              disabled={!hasSelection || sending}
              activeOpacity={0.85}
            >
              {sending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text
                  style={[
                    s.inviteBtnText,
                    { color: hasSelection ? '#FFFFFF' : colors.textTertiary },
                  ]}
                >
                  {selectedIds.size > 1 ? `Invite (${selectedIds.size})` : 'Invite'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

      </SafeAreaView>
    </View>
  );
}