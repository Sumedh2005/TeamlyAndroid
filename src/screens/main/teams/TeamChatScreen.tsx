import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../theme/colors';
import ChallengeTeamScreen from './ChallengeTeamScreen';

interface Message {
  id: string;
  text: string;
  userName: string;
  timestamp: string;
  isOwn?: boolean;
}

const MOCK_MESSAGES: Message[] = [
  { id: '1', text: 'Supp team!!', userName: 'Sumedh', timestamp: '8:41 AM', isOwn: true },
  { id: '2', text: 'Great match yesterday', userName: 'Sumedh', timestamp: '9:03 AM', isOwn: true },
  { id: '3', text: 'Hi team', userName: 'Sumedh', timestamp: '11:28 AM', isOwn: true },
  { id: '4', text: 'Yeah lets play tomorrow', userName: 'Rashmika', timestamp: '4:36 PM' },
  { id: '5', text: 'Is everyone free', userName: 'Rashmika', timestamp: '4:36 PM' },
  { id: '6', text: 'Sure Thing', userName: 'Sumedh', timestamp: '4:37 PM', isOwn: true },
  { id: '7', text: 'Satyajit are you free tom?', userName: 'Sumedh', timestamp: '4:37 PM', isOwn: true },
];

export default function TeamChatScreen({ navigation }: any) {
  const colors = useColors();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [showChallenge, setShowChallenge] = useState(false);

  const isCaptain = true; // 🔥 toggle this

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: message,
      userName: 'Sumedh',
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      isOwn: true,
    };

    setMessages([...messages, newMessage]);
    setMessage('');
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.isOwn;

    return (
      <View
        style={[
          styles.messageRow,
          { justifyContent: isOwn ? 'flex-end' : 'flex-start' },
        ]}
      >
        <View
          style={[
            styles.bubble,
            isOwn ? styles.ownBubble : styles.otherBubble,
          ]}
        >
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
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <Ionicons name="chevron-back" size={28} color={colors.systemGreen} />
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.textPrimary }]}>
          AllStarsFC
        </Text>

        <View style={{ width: 28 }} />
      </View>

      {/* CHAT */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={{ paddingVertical: 10 }}
      />

      {/* INPUT */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.inputWrapper}>
          
          {/* Left Icon */}
          <TouchableOpacity style={styles.leftIcon}>
            <Ionicons name="football-outline" size={20} color="#000" />
          </TouchableOpacity>

          {/* Input */}
          <TextInput
            style={styles.input}
            placeholder="Message here"
            value={message}
            onChangeText={setMessage}
            placeholderTextColor="#8e8e93"
          />

          {/* Send */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={handleSendMessage}
          >
            <Ionicons
              name="send"
              size={20}
              color={message.trim() ? '#34C759' : '#8e8e93'}
            />
          </TouchableOpacity>

          {/* Captain Actions */}
          {isCaptain && (
            <>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => setShowChallenge(true)}
              >
                <Ionicons name="flag-outline" size={20} color="#000" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => console.log('Requisition')}
              >
                <Ionicons name="document-outline" size={20} color="#000" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* 🔥 CHALLENGE MODAL */}
      <ChallengeTeamScreen
        visible={showChallenge}
        onClose={() => setShowChallenge(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  /* HEADER */
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

  /* CHAT */
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

  /* INPUT */
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