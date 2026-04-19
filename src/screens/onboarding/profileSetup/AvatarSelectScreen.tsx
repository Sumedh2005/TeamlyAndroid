import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Modal,
  Image,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useColors } from '../../../theme/colors';
import { FontFamily, FontSize } from '../../../theme/fonts';
import AuthManager from '../../../lib/AuthManager';
import ProfileManager from '../../../services/ProfileManager';

const TOTAL_STEPS = 5;

export default function AvatarSelectScreen({ navigation }: any) {
  const colors = useColors();
  const [image, setImage] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const progress = 5 / TOTAL_STEPS;

  const takePhoto = async () => {
    setShowModal(false);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const choosePhoto = async () => {
    setShowModal(false);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleNext = async () => {
    if (!image) {
      // No image selected, treat same as skip
      navigation.navigate('SearchingCommunities');
      return;
    }

    setIsLoading(true);
    try {
      let userId = await AuthManager.getCurrentUserId();
      if (!userId) {
        const session = await AuthManager.getCurrentSession();
        userId = session?.user?.id ?? null;
      }
      if (!userId) {
        Alert.alert('Session Expired', 'Please log in again.');
        return;
      }

      await ProfileManager.uploadProfilePicture(userId, image);
      navigation.navigate('SearchingCommunities');

    } catch (error: any) {
      Alert.alert('Upload Failed', error?.message ?? 'Failed to upload photo. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    navigation.navigate('SearchingCommunities');
  };

  // ── Styles ───────────────────────────────────────────────────────────────────

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundPrimary,
      paddingHorizontal: 24,
    },
    progressBarContainer: {
      marginTop: 100,
      height: 8,
      backgroundColor: colors.backgroundTertiary,
      borderRadius: 4,
      width: '60%',
      alignSelf: 'center',
    },
    progressBar: {
      height: 8,
      width: `${progress * 100}%`,
      backgroundColor: colors.systemGreen,
      borderRadius: 4,
    },
    title: {
      fontSize: 24,
      fontFamily: FontFamily.semiBold,
      color: colors.textPrimary,
      marginTop: 40,
      marginBottom: 60,
      textAlign: 'center',
    },
    avatarContainer: {
      width: '60%',
      aspectRatio: 1,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
      borderRadius: 28,
    },
    placeholder: {
      alignItems: 'center',
      gap: 12,
    },
    personIcon: {
      fontSize: 64,
      color: colors.textTertiary,
    },
    selectRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    selectText: {
      fontSize: FontSize.md,
      fontFamily: FontFamily.medium,
      color: colors.textPrimary,
    },
    chevron: {
      fontSize: FontSize.md,
      color: colors.textPrimary,
    },
    bottomContainer: {
      position: 'absolute',
      bottom: 48,
      left: 24,
      right: 24,
      alignItems: 'center',
      gap: 12,
    },
    skipButton: {
      height: 52,
      paddingHorizontal: 48,
      borderRadius: 50,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    skipText: {
      fontSize: FontSize.lg,
      fontFamily: FontFamily.medium,
      color: colors.textPrimary,
    },
    nextButton: {
      height: 52,
      paddingHorizontal: 48,
      borderRadius: 50,
      backgroundColor: isLoading
        ? colors.systemGreen + '80'
        : colors.systemGreen,
      justifyContent: 'center',
      alignItems: 'center',
    },
    nextButtonText: {
      fontSize: FontSize.lg,
      fontFamily: FontFamily.semiBold,
      color: colors.primaryWhite,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    modalContainer: {
      backgroundColor: colors.backgroundPrimary,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 24,
      paddingTop: 12,
      paddingBottom: 48,
    },
    modalHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.backgroundQuaternary,
      alignSelf: 'center',
      marginBottom: 24,
    },
    modalTitle: {
      fontSize: 22,
      fontFamily: FontFamily.bold,
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: 24,
    },
    optionContainer: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 16,
      overflow: 'hidden',
    },
    optionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 18,
    },
    optionText: {
      fontSize: FontSize.md,
      fontFamily: FontFamily.regular,
      color: colors.textPrimary,
    },
    optionIcon: {
      fontSize: 22,
      color: colors.textPrimary,
    },
    divider: {
      height: 0.5,
      backgroundColor: colors.backgroundQuaternary,
      marginHorizontal: 20,
    },
  });

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <StatusBar barStyle={colors.isDark ? 'light-content' : 'dark-content'} />

      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar} />
      </View>

      <Text style={styles.title}>Add a profile pic</Text>

      <TouchableOpacity
        style={styles.avatarContainer}
        onPress={() => setShowModal(true)}
        disabled={isLoading}
      >
        {image ? (
          <Image source={{ uri: image }} style={styles.avatarImage} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.personIcon}>👤</Text>
            <View style={styles.selectRow}>
              <Text style={styles.selectText}>Select</Text>
              <Text style={styles.chevron}>∨</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.bottomContainer}>
        {/* Skip only shown when no image selected and not loading */}
        {!image && !isLoading && (
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          disabled={isLoading}
        >
          {isLoading
            ? <ActivityIndicator color={colors.primaryWhite} />
            : <Text style={styles.nextButtonText}>
                <Text>Next</Text>
              </Text>
          }
        </TouchableOpacity>
      </View>

      {/* Photo Picker Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContainer}>
                <View style={styles.modalHandle} />
                <Text style={styles.modalTitle}>Add profile picture</Text>
                <View style={styles.optionContainer}>
                  <TouchableOpacity style={styles.optionRow} onPress={takePhoto}>
                    <Text style={styles.optionText}>Take photo</Text>
                    <Text style={styles.optionIcon}>📷</Text>
                  </TouchableOpacity>
                  <View style={styles.divider} />
                  <TouchableOpacity style={styles.optionRow} onPress={choosePhoto}>
                    <Text style={styles.optionText}>Choose photo</Text>
                    <Text style={styles.optionIcon}>🖼️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}