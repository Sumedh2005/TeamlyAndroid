import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActionSheetIOS,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../../lib/supabase';
import { useColors } from '../../../theme/colors';
import ChallengeTeamScreen from './ChallengeTeamScreen';
import MatchRequestScreen from './MatchRequestScreen';
import ReportModal from '../report/ReportModal';
import { FontFamily } from '../../../theme/fonts';

interface Message {
  id: string;
  text: string;
  userName: string;
  timestamp: string;
  isOwn?: boolean;
}

export default function TeamChatScreen({ route, navigation }: any) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { teamId, team } = route.params || {};

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [showChallenge, setShowChallenge] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set());
  const senderCache = useRef<Record<string, { name: string }>>({});
  const lastMessageTimestamp = useRef<string>(new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
  const flatListRef = useRef<FlatList>(null);

  const isCaptain = team?.isCaptain ?? false;

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    const initializeChat = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const userId = session.user.id;
      setCurrentUserId(userId);
      
      await fetchBlockedUserIds(userId);
      await fetchInitialMessages(userId);
      
      intervalId = setInterval(() => {
        pollMessages(userId);
      }, 3000);
    };

    initializeChat();
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [teamId]);

  const fetchBlockedUserIds = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('blocked')
        .select('blocked_user')
        .eq('blocked_by_user', userId);
      if (data) setBlockedUsers(new Set(data.map(d => d.blocked_user)));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSenderProfiles = async (userIds: string[]) => {
    if (userIds.length === 0) return;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds);
      if (data) {
        data.forEach(profile => {
          senderCache.current[profile.id] = { name: profile.name || 'Unknown' };
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (dateString: string) => {
    const d = new Date(dateString);
    let h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m < 10 ? '0' + m : m} ${ampm}`;
  };

  const buildUIMessages = (msgsData: any[], userId: string) => {
    return msgsData
      .filter(m => !blockedUsers.has(m.user_id))
      .map(m => ({
        id: m.id,
        text: m.message,
        userName: senderCache.current[m.user_id]?.name || 'Unknown',
        timestamp: formatTime(m.created_at),
        isOwn: m.user_id === userId,
      }));
  };

  const fetchInitialMessages = async (userId: string) => {
    if (!teamId) return;
    try {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: true })
        .limit(50);
      if (error) throw error;
      if (!data || data.length === 0) return;

      lastMessageTimestamp.current = data[data.length - 1].created_at;
      const uniqueIds = [...new Set(data.map(m => m.user_id))];
      await fetchSenderProfiles(uniqueIds);
      
      setMessages(buildUIMessages(data, userId));
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 200);
    } catch (error) {
      console.error('Initial fetch Error:', error);
    }
  };

  const pollMessages = async (userId: string) => {
    if (!teamId) return;
    try {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('team_id', teamId)
        .gt('created_at', lastMessageTimestamp.current)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) return;

      lastMessageTimestamp.current = data[data.length - 1].created_at;
      const uniqueIds = [...new Set(data.map(m => m.user_id))];
      const uncached = uniqueIds.filter(id => !senderCache.current[id]);
      if (uncached.length > 0) await fetchSenderProfiles(uncached);

      const newUiMsgs = buildUIMessages(data, userId);
      if (newUiMsgs.length > 0) {
        setMessages(prev => [...prev, ...newUiMsgs]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 200);
      }
    } catch (err) {
      console.error('Polling Error:', err);
    }
  };

  const handleSendMessage = async () => {
    const textMsg = message.trim();
    if (!textMsg || !teamId || !currentUserId) return;

    setMessage(''); // optimistic clear
    try {
      const { error } = await supabase
        .from('chats')
        .insert({ team_id: teamId, user_id: currentUserId, message: textMsg });
      if (error) {
        Alert.alert('Error', 'Failed to send message.');
        console.error(error);
      }
    } catch (err) {
      console.error('Send Error:', err);
    }
  };

  const handleLongPress = (item: Message) => {
    if (Platform.OS === 'ios') {
      const options = item.isOwn ? ['Cancel', 'Copy', 'Delete'] : ['Cancel', 'Copy', 'Report'];
      const destructiveButtonIndex = 2; // Delete or Report is always index 2

      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: 0, destructiveButtonIndex },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            // Copy
            try {
              const libName = 'expo-clipboard';
              const ExpoClipboard = require(libName);
              await ExpoClipboard.setStringAsync(item.text);
              Alert.alert('Copied', 'Message copied to clipboard.');
            } catch (err) {
              Alert.alert('Notice', 'Copy feature requires expo-clipboard. Please run: npx expo install expo-clipboard');
            }
          } else if (buttonIndex === 2) {
            if (item.isOwn) {
              // Delete
              await supabase.from('chats').delete().eq('id', item.id);
              setMessages(prev => prev.filter(m => m.id !== item.id));
            } else {
              // Report
              setSelectedMessageId(item.id);
              setReportModalVisible(true);
            }
          }
        }
      );
    } else {
      // Android fallback
      const buttons = item.isOwn
        ? [
            { text: 'Copy', onPress: async () => {
              try {
                const libName = 'expo-clipboard';
                const ExpoClipboard = require(libName);
                await ExpoClipboard.setStringAsync(item.text);
                Alert.alert('Copied', 'Message copied to clipboard.');
              } catch (e) {
                Alert.alert('Notice', 'Copy feature requires expo-clipboard. Please run: npx expo install expo-clipboard');
              }
            }},
            { text: 'Delete', style: 'destructive', onPress: async () => {
                await supabase.from('chats').delete().eq('id', item.id);
                setMessages(prev => prev.filter(m => m.id !== item.id));
            }},
            { text: 'Cancel', style: 'cancel' }
          ]
        : [
            { text: 'Copy', onPress: async () => {
               try {
                 const libName = 'expo-clipboard';
                 const ExpoClipboard = require(libName);
                 await ExpoClipboard.setStringAsync(item.text);
                 Alert.alert('Copied', 'Message copied to clipboard.');
               } catch (e) {
                 Alert.alert('Notice', 'Copy feature requires expo-clipboard. Please run: npx expo install expo-clipboard');
               }
            }},
            { text: 'Report', style: 'destructive', onPress: () => {
              setSelectedMessageId(item.id);
              setReportModalVisible(true);
            }},
            { text: 'Cancel', style: 'cancel' }
          ];

      Alert.alert('Message Options', '', buttons as any);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.isOwn;
    return (
      <View style={[styles.messageRow, { justifyContent: isOwn ? 'flex-end' : 'flex-start' }]}>
        <TouchableOpacity 
          style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}
          activeOpacity={0.8}
          onLongPress={() => handleLongPress(item)}
        >
          <View style={styles.messageHeader}>
            {!isOwn && <Text style={styles.userName}>{item.userName}</Text>}
            <Text style={[styles.time, isOwn && { color: 'rgba(255,255,255,0.85)' }]}>{item.timestamp}</Text>
          </View>
          <Text style={[styles.text, { color: isOwn ? '#fff' : '#000' }]}>
            {item.text}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
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
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.systemGreen} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('TeamInfo', { teamId })} style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>{team?.name || 'Team Chat'}</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{ paddingVertical: 10 }}
          keyboardShouldPersistTaps="handled"
          style={{ flex: 1 }}
        />

        <View style={[styles.inputRow, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
          {/* Matches circle */}
          <TouchableOpacity
            style={styles.circleBtn}
            onPress={() => navigation.navigate('TeamMatches', { teamId, team })}
          >
            <Ionicons name="football-outline" size={20} color="#34C759" />
          </TouchableOpacity>

          {/* Text input bar */}
          <View style={styles.inputBarWrap}>
            <TextInput
              style={styles.input}
              placeholder="Message here"
              value={message}
              onChangeText={setMessage}
              placeholderTextColor="#8e8e93"
            />
            <TouchableOpacity onPress={handleSendMessage} style={styles.sendBtn}>
              <Ionicons
                name="send"
                size={18}
                color={message.trim() ? '#34C759' : '#8e8e93'}
              />
            </TouchableOpacity>
          </View>

          {/* Captain-only action circles */}
          {isCaptain && (
            <>
              <TouchableOpacity style={styles.circleBtn} onPress={() => setShowChallenge(true)}>
                <Ionicons name="flag-outline" size={20} color="#34C759" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.circleBtn} onPress={() => setShowRequests(true)}>
                <Ionicons name="document-outline" size={20} color="#34C759" />
              </TouchableOpacity>
            </>
          )}
        </View>

        <ChallengeTeamScreen visible={showChallenge} onClose={() => setShowChallenge(false)} team={team} teamId={teamId} />
        <MatchRequestScreen visible={showRequests} onClose={() => setShowRequests(false)} team={team} teamId={teamId} />

        <ReportModal
          visible={reportModalVisible}
          onClose={() => setReportModalVisible(false)}
          reportType={{ type: 'message', id: selectedMessageId || '' }}
          currentUserId={currentUserId || ''}
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 10,
  },
  backBtn: {
    marginRight: 8,
  },
  title: {
    fontSize: 22,
    fontFamily: FontFamily.bold,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 10,
    paddingHorizontal: 12,
  },
  bubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 18,
  },
  ownBubble: {
    backgroundColor: '#34C759',
    borderBottomRightRadius: 6,
  },
  otherBubble: {
    backgroundColor: '#E5E5EA',
    borderBottomLeftRadius: 6,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  userName: {
    fontSize: 12,
    color: '#6b6b6b',
    fontWeight: '500',
  },
  time: {
    fontSize: 11,
    color: '#8e8e93',
  },
  text: {
    fontSize: 16,
  },
  /* ── Bottom input row ── */
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 8,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f2f2f7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputBarWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E5EA',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 6,
  },
  sendBtn: {
    marginLeft: 6,
  },
});