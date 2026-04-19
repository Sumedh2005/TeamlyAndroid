import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../theme/colors';
import { FontFamily, FontSize } from '../../../theme/fonts';

interface MatchRequest {
  id: string;
  teamName: string;
  venue: string;
  date: string;
  startTime: string;
  endTime: string;
}

const MOCK_REQUESTS: MatchRequest[] = [
  {
    id: '1',
    teamName: 'Kick Off FC',
    venue: 'R2B Turf',
    date: '11/04/26',
    startTime: '6:00 PM',
    endTime: '7:00 PM',
  },
  {
    id: '2',
    teamName: 'Super FC',
    venue: 'Moonrise Turf',
    date: '12/04/26',
    startTime: '7:00 PM',
    endTime: '8:00 PM',
  },
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function MatchRequestScreen({ visible, onClose }: Props) {
  const colors = useColors();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getTimeIcon = (startTime: string) => {
    const hour = parseInt(startTime.split(':')[0]);
    const isPM = startTime.includes('PM');
    const hour24 = isPM && hour !== 12 ? hour + 12 : (!isPM && hour === 12 ? 0 : hour);
    return hour24 >= 6 && hour24 < 17 ? 'sunny-outline' : 'moon';
  };

  const getTimeIconColor = (startTime: string) => {
    const hour = parseInt(startTime.split(':')[0]);
    const isPM = startTime.includes('PM');
    const hour24 = isPM && hour !== 12 ? hour + 12 : (!isPM && hour === 12 ? 0 : hour);
    return hour24 >= 6 && hour24 < 17 ? '#FFD60A' : '#007AFF';
  };

  const handleAccept = (id: string) => {
    console.log('Accepted:', id);
    onClose();
  };

  const handleDecline = (id: string) => {
    console.log('Declined:', id);
    onClose();
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    sheet: {
      backgroundColor: colors.backgroundPrimary,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 20,
      paddingBottom: 48,
      paddingTop: 12,
      maxHeight: '70%',
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.backgroundQuaternary,
      alignSelf: 'center',
      marginBottom: 20,
    },
    title: {
      fontSize: FontSize.lg,
      fontFamily: FontFamily.bold,
      color: colors.textPrimary,
      marginBottom: 16,
    },

    // Collapsed card
    collapsedCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 50,
      paddingHorizontal: 20,
      paddingVertical: 14,
      marginBottom: 10,
    },
    collapsedTeamName: {
      flex: 1,
      fontSize: FontSize.md,
      fontFamily: FontFamily.bold,
      color: colors.textPrimary,
    },
    collapsedButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    declineButtonSmall: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 50,
      backgroundColor: colors.backgroundTertiary,
    },
    acceptButtonSmall: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 50,
      backgroundColor: colors.backgroundTertiary,
    },
    declineTextSmall: {
      fontSize: FontSize.sm,
      fontFamily: FontFamily.semiBold,
      color: '#FF3B30',
    },
    acceptTextSmall: {
      fontSize: FontSize.sm,
      fontFamily: FontFamily.semiBold,
      color: colors.systemGreen,
    },

    // Expanded card
    expandedCard: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 24,
      padding: 20,
      marginBottom: 10,
    },
    expandedTeamName: {
      fontSize: 22,
      fontFamily: FontFamily.bold,
      color: colors.textPrimary,
      marginBottom: 16,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 12,
    },
    infoText: {
      fontSize: FontSize.md,
      fontFamily: FontFamily.regular,
      color: colors.textPrimary,
    },
    expandedButtons: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    declineButton: {
      flex: 1,
      height: 48,
      borderRadius: 50,
      backgroundColor: colors.backgroundTertiary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    acceptButton: {
      flex: 1,
      height: 48,
      borderRadius: 50,
      backgroundColor: colors.backgroundTertiary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    declineText: {
      fontSize: FontSize.md,
      fontFamily: FontFamily.semiBold,
      color: '#FF3B30',
    },
    acceptText: {
      fontSize: FontSize.md,
      fontFamily: FontFamily.semiBold,
      color: colors.systemGreen,
    },
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              <View style={styles.handle} />
              <Text style={styles.title}>Match Requests</Text>

              <ScrollView showsVerticalScrollIndicator={false}>
                {MOCK_REQUESTS.map((request) => {
                  const isExpanded = expandedId === request.id;
                  const timeIcon = getTimeIcon(request.startTime);
                  const timeIconColor = getTimeIconColor(request.startTime);

                  if (isExpanded) {
                    return (
                      <TouchableOpacity
                        key={request.id}
                        style={styles.expandedCard}
                        onPress={() => setExpandedId(null)}
                        activeOpacity={0.9}
                      >
                        <Text style={styles.expandedTeamName}>{request.teamName}</Text>

                        <View style={styles.infoRow}>
                          <Text style={{ fontSize: 18 }}>📍</Text>
                          <Text style={styles.infoText}>{request.venue}</Text>
                        </View>

                        <View style={styles.infoRow}>
                          <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
                          <Text style={styles.infoText}>{request.date}</Text>
                          <Ionicons name={timeIcon as any} size={20} color={timeIconColor} style={{ marginLeft: 16 }} />
                          <Text style={styles.infoText}>{request.startTime} - {request.endTime}</Text>
                        </View>

                        <View style={styles.expandedButtons}>
                          <TouchableOpacity
                            style={styles.declineButton}
                            onPress={() => handleDecline(request.id)}
                          >
                            <Text style={styles.declineText}>Decline</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.acceptButton}
                            onPress={() => handleAccept(request.id)}
                          >
                            <Text style={styles.acceptText}>Accept</Text>
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    );
                  }

                  return (
                    <TouchableOpacity
                      key={request.id}
                      style={styles.collapsedCard}
                      onPress={() => setExpandedId(request.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.collapsedTeamName}>{request.teamName}</Text>
                      <View style={styles.collapsedButtons}>
                        <TouchableOpacity
                          style={styles.declineButtonSmall}
                          onPress={() => handleDecline(request.id)}
                        >
                          <Text style={styles.declineTextSmall}>Decline</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.acceptButtonSmall}
                          onPress={() => handleAccept(request.id)}
                        >
                          <Text style={styles.acceptTextSmall}>Accept</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}