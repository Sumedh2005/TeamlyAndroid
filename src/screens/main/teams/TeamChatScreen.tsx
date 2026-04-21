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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../../lib/supabase';
import { useColors } from '../../../theme/colors';
import ChallengeTeamScreen from './ChallengeTeamScreen';
import MatchRequestScreen from './MatchRequestScreen';

interface Message {
  id: string;
  text: string;
  userName: string;
  timestamp: string;
  isOwn?: boolean;
}

export default function TeamChatScreen({ route, navigation }: any) {
  const colors = useColors();
  const { teamId, team } = route.params || {};

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [showChallenge, setShowChallenge] = useState(false);
  const [showRequests, setShowRequests] = useState(false);

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

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.isOwn;
    return (
      <View style={[styles.messageRow, { justifyContent: isOwn ? 'flex-end' : 'flex-start' }]}>
        <View style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
          <View style={styles.messageHeader}>
            {!isOwn && <Text style={styles.userName}>{item.userName}</Text>}
            <Text style={styles.time}>{item.timestamp}</Text>
          </View>
          <Text style={[styles.text, { color: isOwn ? '#fff' : '#000' }]}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
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
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <Ionicons name="chevron-back" size={28} color={colors.systemGreen} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('TeamInfo', { teamId })}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{team?.name || 'Team Chat'}</Text>
        </TouchableOpacity>
        <View style={{ width: 28 }} />
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={{ paddingVertical: 10 }}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputWrapper}>
          <TouchableOpacity
            style={styles.leftIcon}
            onPress={() => navigation.navigate('TeamMatches', { teamId, team })}
          >
            <Ionicons name="football-outline" size={20} color="#000" />
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Message here"
            value={message}
            onChangeText={setMessage}
            placeholderTextColor="#8e8e93"
          />

          <TouchableOpacity style={styles.iconBtn} onPress={handleSendMessage}>
            <Ionicons
              name="send"
              size={20}
              color={message.trim() ? '#34C759' : '#8e8e93'}
            />
          </TouchableOpacity>

          {isCaptain && (
            <>
              <TouchableOpacity style={styles.iconBtn} onPress={() => setShowChallenge(true)}>
                <Ionicons name="flag-outline" size={20} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => setShowRequests(true)}>
                <Ionicons name="document-outline" size={20} color="#000" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>

      <ChallengeTeamScreen visible={showChallenge} onClose={() => setShowChallenge(false)} team={team} teamId={teamId} />
      <MatchRequestScreen visible={showRequests} onClose={() => setShowRequests(false)} team={team} teamId={teamId} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 12,
    backgroundColor: '#E5E5EA',
    borderRadius: 30,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  leftIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D1D1D6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 6,
  },
  iconBtn: {
    marginLeft: 8,
  },
});