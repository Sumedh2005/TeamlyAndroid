import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../../lib/supabase';
import { useColors } from '../../../theme/colors';
import { FontFamily, FontSize } from '../../../theme/fonts';

// MARK: - Models
enum NotificationType {
  friendRequest = 'friend_request',
  friendRequestAccepted = 'friend_request_accepted',
  friendRequestDeclined = 'friend_request_declined',
  teamInvitation = 'team_invitation',
  teamInvitationAccepted = 'team_invitation_accepted',
  teamInvitationDeclined = 'team_invitation_declined',
}

interface Notification {
  id: number;
  senderId: string;
  receiverId: string;
  userName: string;
  message: string;
  type: string;
  createdAt: string;
  isExpanded: boolean;
}

const formatTimeAgo = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} wk ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} mo ago`;
  return `${Math.floor(days / 365)} yr ago`;
};

const parseNotificationMessage = (fullMessage: string): { name: string; msg: string } => {
  const components = fullMessage.split(' ');
  if (components.length > 1) {
    const name = components[0];
    const msg = components.slice(1).join(' ');
    return { name, msg };
  }
  return { name: '', msg: fullMessage };
};

export default function NotificationsScreen({ navigation }: any) {
  const colors = useColors();
  const isDarkMode = colors.isDark;

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentUserId();
  }, []);

  const fetchCurrentUserId = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUserId(session.user.id);
        fetchNotifications(session.user.id);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching user session:', error);
      setLoading(false);
    }
  };

  const fetchNotifications = async (userId: string) => {
    setLoading(true);
    try {
      const { data: fetchedNotifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('receiver_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformed: Notification[] = [];
      for (const notif of (fetchedNotifications || [])) {
        let typeValid = Object.values(NotificationType).includes(notif.type as NotificationType);
        if (!typeValid) continue;

        const type = notif.type;
        const msgLower = notif.message.toLowerCase();
        
        if (
          (type === NotificationType.friendRequestAccepted || type === NotificationType.teamInvitationAccepted) &&
          !msgLower.includes('accepted')
        ) {
          continue;
        }
        if (
          (type === NotificationType.friendRequestDeclined || type === NotificationType.teamInvitationDeclined) &&
          !msgLower.includes('declined')
        ) {
          continue;
        }

        const { name: parsedName, msg: parsedMsg } = parseNotificationMessage(notif.message);
        
        // Fetch sender name
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', notif.sender_id)
          .single();

        const finalName = profile?.name || parsedName;

        transformed.push({
          id: notif.id,
          senderId: notif.sender_id,
          receiverId: notif.receiver_id,
          userName: finalName,
          message: parsedMsg,
          type,
          createdAt: notif.created_at,
          isExpanded: false,
        });
      }

      setNotifications(transformed);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserName = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('name').eq('id', userId).single();
    return data?.name || 'User';
  };

  const handleFriendRequestAction = async (notificationId: number, action: 'accept' | 'decline') => {
    const notification = notifications.find(n => n.id === notificationId);
    if (!notification) return;

    try {
      const updateType = action === 'accept' ? NotificationType.friendRequestAccepted : NotificationType.friendRequestDeclined;
      const now = new Date().toISOString();

      // update notification
      await supabase
        .from('notifications')
        .update({ type: updateType, updated_at: now })
        .eq('id', notificationId);

      const receiverName = await fetchUserName(notification.receiverId);
      const newMsg = action === 'accept'
        ? `${receiverName} accepted your friend request`
        : `${receiverName} declined your friend request`;

      const newNotif = {
        sender_id: notification.receiverId,
        receiver_id: notification.senderId,
        type: updateType,
        message: newMsg,
        created_at: now,
        updated_at: now,
      };

      await supabase.from('notifications').insert(newNotif);

      if (action === 'accept') {
        await createAcceptedFriendship(notification.senderId, notification.receiverId);
      } else {
        await supabase
          .from('friends')
          .delete()
          .eq('user_id', notification.senderId)
          .eq('friend_id', notification.receiverId)
          .eq('status', 'pending');
      }

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (action === 'accept') {
        Alert.alert('Friend Request Accepted', `You and ${notification.userName} are now friends!`);
      } else {
        Alert.alert('Friend Request Declined', `You declined ${notification.userName}'s friend request.`);
      }

    } catch (err) {
      console.error('Error handling friend request:', err);
      Alert.alert('Error', 'Failed to process friend request');
    }
  };

  const createAcceptedFriendship = async (senderId: string, receiverId: string) => {
    const now = new Date().toISOString();
    const friendship1 = { user_id: senderId, friend_id: receiverId, status: 'accepted', updated_at: now };
    const friendship2 = { user_id: receiverId, friend_id: senderId, status: 'accepted', updated_at: now };

    // To prevent duplicate creation bug, only insert if not already present
    const { data: ext1 } = await supabase.from('friends').select('id, created_at').eq('user_id', senderId).eq('friend_id', receiverId).maybeSingle();
    if (ext1) {
      await supabase.from('friends').update(friendship1).eq('id', ext1.id);
    } else {
      await supabase.from('friends').insert({ ...friendship1, created_at: now });
    }

    const { data: ext2 } = await supabase.from('friends').select('id, created_at').eq('user_id', receiverId).eq('friend_id', senderId).maybeSingle();
    if (ext2) {
      await supabase.from('friends').update(friendship2).eq('id', ext2.id);
    } else {
      await supabase.from('friends').insert({ ...friendship2, created_at: now });
    }
  };

  const extractTeamName = (message: string) => {
    const anchor = 'to join their ';
    const anchorIndex = message.indexOf(anchor);
    if (anchorIndex !== -1) {
      const after = message.substring(anchorIndex + anchor.length);
      const teamIdx = after.indexOf(' team ');
      if (teamIdx !== -1) {
        const tName = after.substring(teamIdx + 6).trim();
        if (tName) return tName;
      }
    }
    const lastTeamIdx = message.lastIndexOf(' team ');
    if (lastTeamIdx !== -1) {
      const tName = message.substring(lastTeamIdx + 6).trim();
      if (tName) return tName;
    }
    return 'Unknown Team';
  };

  const handleTeamInvitationAction = async (notificationId: number, action: 'accept' | 'decline') => {
    const notification = notifications.find(n => n.id === notificationId);
    if (!notification) return;

    try {
      const updateType = action === 'accept' ? NotificationType.teamInvitationAccepted : NotificationType.teamInvitationDeclined;
      const receiverName = await fetchUserName(notification.receiverId);
      const teamName = extractTeamName(notification.message);
      const now = new Date().toISOString();

      await supabase
        .from('notifications')
        .update({ type: updateType, updated_at: now })
        .eq('id', notificationId);

      const responseMessage = action === 'accept'
        ? `${receiverName} accepted your invite to join team ${teamName}`
        : `${receiverName} declined your invite to join team ${teamName}`;

      const responseNotif = {
        sender_id: notification.receiverId,
        receiver_id: notification.senderId,
        type: updateType,
        message: responseMessage,
        created_at: now,
        updated_at: now,
      };

      await supabase.from('notifications').insert(responseNotif);

      if (action === 'accept') {
        let { data: teams } = await supabase.from('teams').select('id').eq('name', teamName).eq('captain_id', notification.senderId).limit(1);
        if (!teams || teams.length === 0) {
          const res = await supabase.from('teams').select('id').eq('name', teamName).limit(1);
          teams = res.data;
        }

        if (teams && teams.length > 0) {
          const team = teams[0];
          await supabase.from('team_members').insert({
            team_id: team.id,
            user_id: notification.receiverId,
            role: 'member',
          });
        }
      }

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (action === 'accept') {
        Alert.alert('Team Joined!', `You have joined the team ${teamName}.`);
      } else {
        Alert.alert('Invitation Declined', `You declined the invitation to join ${teamName}.`);
      }

    } catch (err) {
      console.error('Error handling team invitation:', err);
      Alert.alert('Error', 'Failed to process team invitation');
    }
  };

  const toggleExpand = (id: number) => {
    setNotifications(prev => prev.map(n => {
      const isExpandable = n.type === NotificationType.friendRequest || n.type === NotificationType.teamInvitation;
      if (n.id === id && isExpandable) {
        return { ...n, isExpanded: !n.isExpanded };
      }
      return n;
    }));
  };

  const navToProfile = (userId: string) => {
    navigation.navigate('UserProfileScreen', { userId });
  };

  const renderItem = ({ item }: { item: Notification }) => {
    const isExpandable = item.type === NotificationType.friendRequest || item.type === NotificationType.teamInvitation;
    const isExpanded = item.isExpanded && isExpandable;

    return (
      <TouchableOpacity 
        style={[styles.cellContainer, { backgroundColor: isDarkMode ? colors.backgroundSecondary : colors.backgroundSecondary }]}
        activeOpacity={0.9}
        onPress={() => toggleExpand(item.id)}
      >
        <View style={[styles.avatarView, { backgroundColor: colors.backgroundTertiary }]}>
          <Ionicons name="person" size={20} color={isDarkMode ? colors.textTertiary : colors.textSecondary} />
        </View>

        <View style={styles.textStack}>
          <View style={styles.nameTimeRow}>
            <TouchableOpacity onPress={() => navToProfile(item.senderId)}>
              <Text style={[styles.nameLabel, { color: colors.textPrimary }]}>{item.userName}</Text>
            </TouchableOpacity>
            <Text style={[styles.timeLabel, { color: colors.textTertiary }]}>{formatTimeAgo(item.createdAt)}</Text>
          </View>

          <View style={styles.messageRow}>
            <Text 
              style={[styles.messageLabel, { color: colors.textSecondary, flex: 1 }]}
              numberOfLines={(!isExpandable || isExpanded) ? 0 : 2}
            >
              {item.message}
            </Text>

            {isExpanded && (
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.circularButton, { backgroundColor: colors.backgroundTertiary }]}
                  onPress={() => {
                    if (item.type === NotificationType.friendRequest) handleFriendRequestAction(item.id, 'accept');
                    else handleTeamInvitationAction(item.id, 'accept');
                  }}
                >
                  <Ionicons name="checkmark" size={18} color={colors.systemGreen} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.circularButton, { backgroundColor: colors.backgroundTertiary }]}
                  onPress={() => {
                    if (item.type === NotificationType.friendRequest) handleFriendRequestAction(item.id, 'decline');
                    else handleTeamInvitationAction(item.id, 'decline');
                  }}
                >
                  <Ionicons name="close" size={18} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const gradientColors = isDarkMode
    ? ['rgba(0, 38, 0, 1)', 'transparent']
    : ['rgba(53, 199, 89, 0.3)', 'transparent'];

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
      <LinearGradient colors={gradientColors as any} style={styles.linearGradient} />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.glassBackButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={20} color={colors.systemGreen} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Notifications</Text>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.textPrimary} />
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.center}>
            <Text style={[styles.emptyLabel, { color: colors.textPrimary }]}>No notifications yet</Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  linearGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 300,
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  glassBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 37,
    fontFamily: FontFamily.bold,
    marginTop: 24,
    marginBottom: 24,
    paddingHorizontal: 14,
  },
  listContent: {
    paddingHorizontal: 14,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyLabel: {
    fontSize: 18,
    fontFamily: FontFamily.medium,
  },
  cellContainer: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 12,
    marginBottom: 12,
  },
  avatarView: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 6,
  },
  textStack: {
    flex: 1,
    paddingVertical: 4,
  },
  nameTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameLabel: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
  },
  timeLabel: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageLabel: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    marginRight: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  circularButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
