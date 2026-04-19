import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../theme/colors';
import { FontFamily, FontSize } from '../../../theme/fonts';

interface Props {
  visible: boolean;
  onClose: () => void;
  teamName: string;
  onSave: (name: string) => void;
}

export default function EditTeamInfoScreen({ visible, onClose, teamName, onSave }: Props) {
  const colors = useColors();
  const [name, setName] = useState(teamName);

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    sheet: {
      backgroundColor: colors.backgroundSecondary,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 24,
      paddingBottom: 48,
      paddingTop: 16,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.backgroundQuaternary,
      alignSelf: 'center',
      marginBottom: 16,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 28,
    },
    headerTitle: {
      fontSize: FontSize.lg,
      fontFamily: FontFamily.bold,
      color: colors.textPrimary,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },

    // Avatar
    avatarSection: {
      alignItems: 'center',
      marginBottom: 28,
    },
    avatarCircle: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.backgroundTertiary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    editBadge: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.systemGreen,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.backgroundSecondary,
    },

    // Input
    inputLabel: {
      fontSize: FontSize.sm,
      fontFamily: FontFamily.regular,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 10,
    },
    input: {
      height: 52,
      borderRadius: 50,
      borderWidth: 1.5,
      borderColor: colors.systemGreen,
      paddingHorizontal: 20,
      fontSize: FontSize.md,
      fontFamily: FontFamily.regular,
      color: colors.textPrimary,
      textAlign: 'center',
      backgroundColor: colors.backgroundPrimary,
      marginBottom: 28,
    },

    // Save Button
    saveButton: {
      height: 52,
      borderRadius: 50,
      backgroundColor: colors.systemGreen,
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
      paddingHorizontal: 64,
    },
    saveText: {
      fontSize: FontSize.md,
      fontFamily: FontFamily.semiBold,
      color: colors.primaryWhite,
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
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.sheet}>
              <View style={styles.handle} />

              {/* Header */}
              <View style={styles.headerRow}>
                <View style={{ width: 32 }} />
                <Text style={styles.headerTitle}>Edit Team</Text>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <Ionicons name="close" size={22} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* Avatar */}
              <View style={styles.avatarSection}>
                <View style={styles.avatarCircle}>
                  <Ionicons name="people-outline" size={48} color={colors.textTertiary} />
                  <View style={styles.editBadge}>
                    <Ionicons name="pencil" size={14} color={colors.primaryWhite} />
                  </View>
                </View>
              </View>

              {/* Input */}
              <Text style={styles.inputLabel}>Team Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />

              {/* Save */}
              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => {
                  onSave(name);
                  onClose();
                }}
              >
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}