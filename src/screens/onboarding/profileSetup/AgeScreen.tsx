import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useColors } from '../../../theme/colors';
import { FontFamily, FontSize } from '../../../theme/fonts';
import AuthManager from '../../../lib/AuthManager';
import ProfileManager from '../../../services/ProfileManager';

const { width } = Dimensions.get('window');
const TOTAL_STEPS = 5;
const MIN_AGE = 13;
const MAX_AGE = 60;
const ITEM_WIDTH = width / 3;
const DEFAULT_AGE = 20;

const ages = Array.from({ length: MAX_AGE - MIN_AGE + 1 }, (_, i) => MIN_AGE + i);

export default function AgeScreen({ navigation }: any) {
  const colors = useColors();
  const [selectedAge, setSelectedAge] = useState(DEFAULT_AGE);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const progress = 2 / TOTAL_STEPS;

  const initialOffset = (DEFAULT_AGE - MIN_AGE) * ITEM_WIDTH;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = event.nativeEvent.contentOffset.x;
    const index = Math.round(offset / ITEM_WIDTH);
    const age = MIN_AGE + index;
    if (age >= MIN_AGE && age <= MAX_AGE) {
      setSelectedAge(age);
    }
  };

  // ── Save Handler ─────────────────────────────────────────────────────────────

  const handleNext = async () => {
    setIsLoading(true);
    try {
      let userId = await AuthManager.getCurrentUserId();
      if (!userId) {
        const session = await AuthManager.getCurrentSession();
        userId = session?.user?.id ?? null;
      }

      if (!userId) {
        Alert.alert('Session Expired', 'Could not find your session. Please log in again.');
        return;
      }

      await ProfileManager.saveAge(userId, selectedAge);
      navigation.navigate('SportSelection');

    } catch (error: any) {
      Alert.alert('Error', error?.message ?? 'Failed to save. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
      marginBottom: 60,
    },
    agePicker: {
      height: 100,
      marginHorizontal: -24,
    },
    ageItem: {
      width: ITEM_WIDTH,
      justifyContent: 'center',
      alignItems: 'center',
    },
    ageText: {
      fontFamily: FontFamily.bold,
    },
    bottomContainer: {
      position: 'absolute',
      bottom: 48,
      left: 24,
      right: 24,
      alignItems: 'center',
    },
    nextButton: {
      height: 56,
      paddingHorizontal: 48,
      borderRadius: 50,
      backgroundColor: isLoading ? colors.systemGreen + '80' : colors.systemGreen,
      justifyContent: 'center',
      alignItems: 'center',
    },
    nextButtonText: {
      fontSize: FontSize.md,
      fontFamily: FontFamily.semiBold,
      color: colors.primaryWhite,
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle={colors.isDark ? 'light-content' : 'dark-content'} />

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar} />
      </View>

      {/* Title */}
      <Text style={styles.title}>What's your age</Text>

      {/* Age Picker */}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM_WIDTH}
        decelerationRate="fast"
        contentOffset={{ x: initialOffset, y: 0 }}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingHorizontal: ITEM_WIDTH }}
        style={styles.agePicker}
      >
        {ages.map((age) => {
          const isSelected = age === selectedAge;
          return (
            <View key={age} style={styles.ageItem}>
              <Text
                style={[
                  styles.ageText,
                  {
                    fontSize: isSelected ? 52 : 32,
                    color: isSelected ? colors.systemGreen : colors.textTertiary,
                    opacity: isSelected ? 1 : 0.5,
                  },
                ]}
              >
                {age}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Next Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          disabled={isLoading}
        >
          {isLoading
            ? <ActivityIndicator color={colors.primaryWhite} />
            : <Text style={styles.nextButtonText}>Next</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}