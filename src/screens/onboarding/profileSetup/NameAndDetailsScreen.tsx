import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useColors } from '../../../theme/colors';
import { FontFamily, FontSize } from '../../../theme/fonts';
import AuthManager from '../../../lib/AuthManager';
import ProfileManager from '../../../services/ProfileManager';

const TOTAL_STEPS = 5;

export default function NameAndDetailsScreen({ navigation }: any) {
  const colors = useColors();
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isNextEnabled = name.trim().length > 0 && gender !== null && !isLoading;
  const progress = 1 / TOTAL_STEPS;

  // ── Save Handler ─────────────────────────────────────────────────────────────

  const handleNext = async () => {
  if (!isNextEnabled) return;

  setIsLoading(true);
  try {
    // Try getUser first, fall back to getSession
    let userId = await AuthManager.getCurrentUserId();

    if (!userId) {
      // Fallback: grab from session directly
      const session = await AuthManager.getCurrentSession();
      userId = session?.user?.id ?? null;
    }

    console.log('userId for save:', userId); // ← check this in your terminal

    if (!userId) {
      Alert.alert('Session Expired', 'Could not find your session. Please log in again.');
      setIsLoading(false);
      return;
    }

    await ProfileManager.saveNameAndGender(userId, name.trim(), gender!);
    console.log('Saved successfully, navigating to Age');
    navigation.navigate('Age');

  } catch (error: any) {
    console.error('handleNext error:', error);
    Alert.alert('Error', error?.message ?? 'Failed to save. Please try again.');
  } finally {
    setIsLoading(false);
  }
};

  // ── Styles ───────────────────────────────────────────────────────────────────

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundPrimary,
      paddingHorizontal: 24,
    },
    progressBarContainer: {
      marginTop: 60,
      height: 4,
      backgroundColor: colors.backgroundTertiary,
      borderRadius: 2,
    },
    progressBar: {
      height: 4,
      width: `${progress * 100}%`,
      backgroundColor: colors.systemGreen,
      borderRadius: 2,
    },
    title: {
      fontSize: 28,
      fontFamily: FontFamily.bold,
      color: colors.textPrimary,
      marginTop: 40,
      marginBottom: 32,
    },
    input: {
      height: 52,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 50,
      paddingHorizontal: 20,
      fontSize: FontSize.md,
      fontFamily: FontFamily.regular,
      color: colors.textPrimary,
      marginBottom: 32,
    },
    genderContainer: {
      flexDirection: 'row',
      gap: 16,
    },
    genderButton: {
      flex: 1,
      aspectRatio: 1,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 12,
    },
    genderIcon: {
      fontSize: 56,
    },
    genderLabel: {
      fontSize: FontSize.md,
      fontFamily: FontFamily.medium,
      color: colors.textPrimary,
    },
    bottomContainer: {
      position: 'absolute',
      bottom: 48,
      left: 24,
      right: 24,
    },
    nextButton: {
      height: 56,
      borderRadius: 50,
      justifyContent: 'center',
      alignItems: 'center',
    },
    nextButtonText: {
      fontSize: FontSize.md,
      fontFamily: FontFamily.semiBold,
    },
  });

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <StatusBar barStyle={colors.isDark ? 'light-content' : 'dark-content'} />

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar} />
      </View>

      {/* Title */}
      <Text style={styles.title}>Set up your profile</Text>

      {/* Name Input */}
      <TextInput
        style={styles.input}
        placeholder="Name"
        placeholderTextColor={colors.textTertiary}
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        editable={!isLoading}
      />

      {/* Gender Selection */}
      <View style={styles.genderContainer}>
        <TouchableOpacity
          style={[
            styles.genderButton,
            {
              backgroundColor: gender === 'Male'
                ? `${colors.systemGreen}22`
                : colors.backgroundSecondary,
              borderWidth: gender === 'Male' ? 2 : 0,
              borderColor: gender === 'Male' ? colors.systemGreen : 'transparent',
            },
          ]}
          onPress={() => setGender('Male')}
          disabled={isLoading}
        >
          <Text style={[styles.genderIcon, { color: '#007AFF' }]}>♂</Text>
          <Text style={styles.genderLabel}>Male</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.genderButton,
            {
              backgroundColor: gender === 'Female'
                ? `${colors.systemGreen}22`
                : colors.backgroundSecondary,
              borderWidth: gender === 'Female' ? 2 : 0,
              borderColor: gender === 'Female' ? colors.systemGreen : 'transparent',
            },
          ]}
          onPress={() => setGender('Female')}
          disabled={isLoading}
        >
          <Text style={[styles.genderIcon, { color: '#FF2D55' }]}>♀</Text>
          <Text style={styles.genderLabel}>Female</Text>
        </TouchableOpacity>
      </View>

      {/* Next Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            {
              backgroundColor: isNextEnabled
                ? colors.systemGreen
                : colors.backgroundTertiary,
            },
          ]}
          disabled={!isNextEnabled}
          onPress={handleNext}
        >
          {isLoading
            ? <ActivityIndicator color={colors.primaryWhite} />
            : (
              <Text style={[
                styles.nextButtonText,
                { color: isNextEnabled ? colors.primaryWhite : colors.textTertiary },
              ]}>
                Next
              </Text>
            )
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}