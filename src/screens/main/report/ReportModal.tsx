import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../theme/colors';
import { FontFamily } from '../../../theme/fonts';
import { supabase } from '../../../lib/supabase';

export type ReportType = 
  | { type: 'match'; id: string }
  | { type: 'message'; id: string }
  | { type: 'profile'; id: string };

const REPORT_REASONS = [
  { id: 'dislike', label: "I just don't like it", icon: 'thumbs-down-outline' as any },
  { id: 'bullying', label: 'Bullying or unwanted contact', icon: 'chatbubble-ellipses-outline' as any },
  { id: 'violence', label: 'Violence, hate or exploitation', icon: 'warning-outline' as any },
  { id: 'restrictedItems', label: 'Promoting restricted items', icon: 'cart-outline' as any },
  { id: 'nudity', label: 'Nudity or sexual activity', icon: 'eye-off-outline' as any },
  { id: 'scam', label: 'Scam, fraud or spam', icon: 'cash-outline' as any },
  { id: 'falseInfo', label: 'False information', icon: 'information-circle-outline' as any },
  { id: 'other', label: 'Other', icon: 'create-outline' as any },
];

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  reportType: ReportType;
  currentUserId: string;
}

export default function ReportModal({ visible, onClose, reportType, currentUserId }: ReportModalProps) {
  const colors = useColors();
  
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [otherText, setOtherText] = useState('');
  const [loading, setLoading] = useState(false);

  const getTitle = () => {
    switch (reportType.type) {
      case 'match': return 'Report Match';
      case 'message': return 'Report Message';
      case 'profile': return 'Report Profile';
    }
  };

  const submitReport = async () => {
    if (!selectedReason) {
      Alert.alert('Selection Required', 'Please select a reason for reporting');
      return;
    }

    if (selectedReason === 'other' && otherText.trim() === '') {
      Alert.alert('Details Required', 'Please describe your reason');
      return;
    }

    setLoading(true);
    try {
      const selectedReasonObj = REPORT_REASONS.find(r => r.id === selectedReason);
      const reasonText = selectedReason === 'other' ? otherText : selectedReasonObj?.label || 'Other';

      let finalReason = reasonText;
      let matchId: string | null = null;
      let chatId: string | null = null;

      if (reportType.type === 'match') {
        matchId = reportType.id;
      } else if (reportType.type === 'message') {
        chatId = reportType.id;
      } else if (reportType.type === 'profile') {
        finalReason = `[Profile Report - User ID: ${reportType.id}] ${reasonText}`;
      }

      const payload = {
        reported_by_user: currentUserId,
        reason: finalReason,
        created_at: new Date().toISOString(),
        match_id: matchId,
        chat_id: chatId,
      };

      const { error } = await supabase.from('reports').insert([payload]);

      if (error) {
        throw error;
      }

      Alert.alert('Report Submitted', 'We review reports and remove content within 24 hours', [
        { text: 'OK', onPress: handleClose }
      ]);

    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedReason(null);
    setOtherText('');
    onClose();
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    sheet: {
      backgroundColor: colors.backgroundPrimary,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '90%',
    },
    grabber: {
      width: 40,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: colors.textTertiary,
      opacity: 0.5,
      alignSelf: 'center',
      marginTop: 12,
      marginBottom: 20,
    },
    title: {
      fontSize: 22,
      fontFamily: FontFamily.bold,
      color: colors.textPrimary,
      paddingHorizontal: 24,
      marginBottom: 20,
    },
    card: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 16,
      marginHorizontal: 16,
      marginBottom: 12,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.backgroundTertiary,
    },
    rowIcon: {
      width: 24,
      alignItems: 'center',
      marginRight: 14,
    },
    rowText: {
      flex: 1,
      fontSize: 16,
      fontFamily: FontFamily.medium,
      color: colors.textPrimary,
    },
    otherInputContainer: {
      marginHorizontal: 16,
      marginBottom: 12,
      height: 100,
    },
    otherInput: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.backgroundTertiary,
      padding: 12,
      fontSize: 15,
      fontFamily: FontFamily.regular,
      color: colors.textPrimary,
      textAlignVertical: 'top',
    },
    footerActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    cancelButtonText: {
      fontSize: 17,
      fontFamily: FontFamily.medium,
      color: colors.textSecondary,
    },
    submitButton: {
      backgroundColor: colors.systemGreen,
      paddingHorizontal: 20,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      minWidth: 140,
      flexDirection: 'row',
      gap: 10,
    },
    submitButtonText: {
      fontSize: 17,
      fontFamily: FontFamily.semiBold,
      color: 'white',
    },
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
              <View style={styles.sheet}>
                <View style={styles.grabber} />
                
                <Text style={styles.title}>{getTitle()}</Text>
                
                <ScrollView style={{ maxHeight: selectedReason === 'other' ? 300 : 450 }} showsVerticalScrollIndicator={false}>
                  <View style={styles.card}>
                    {REPORT_REASONS.map((reason, index) => {
                      const isSelected = selectedReason === reason.id;
                      const isLast = index === REPORT_REASONS.length - 1;
                      return (
                        <TouchableOpacity
                          key={reason.id}
                          style={[styles.row, isLast && { borderBottomWidth: 0 }]}
                          onPress={() => setSelectedReason(reason.id)}
                        >
                          <View style={styles.rowIcon}>
                            <Ionicons name={reason.icon} size={20} color={colors.systemGreen} />
                          </View>
                          <Text style={styles.rowText}>{reason.label}</Text>
                          {isSelected && (
                            <Ionicons name="checkmark-circle" size={20} color={colors.systemGreen} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>

                {selectedReason === 'other' && (
                  <View style={styles.otherInputContainer}>
                    <TextInput
                      style={styles.otherInput}
                      placeholder="Describe your reason…"
                      placeholderTextColor={colors.textTertiary}
                      multiline
                      value={otherText}
                      onChangeText={setOtherText}
                      autoFocus
                    />
                  </View>
                )}

                <View style={styles.footerActions}>
                  <TouchableOpacity onPress={handleClose}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.submitButton, (!selectedReason || loading) && { opacity: 0.6 }]}
                    onPress={submitReport}
                    disabled={!selectedReason || loading}
                  >
                    {loading && <ActivityIndicator color="white" size="small" />}
                    <Text style={styles.submitButtonText}>Submit Report</Text>
                  </TouchableOpacity>
                </View>

              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
