import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, PanResponder, ActivityIndicator, Alert,
  Modal, ScrollView, TouchableWithoutFeedback,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '../../../theme/colors';
import { FontFamily, FontSize } from '../../../theme/fonts';
import AuthManager from '../../../lib/AuthManager';
import ProfileManager from '../../../services/ProfileManager';

const TOTAL_STEPS = 5;

const SKILL_LEVELS = [
  { label: 'Beginner',     color: '#007AFF' },
  { label: 'Intermediate', color: '#FFD60A' },
  { label: 'Experienced',  color: '#FF9500' },
  { label: 'Advanced',     color: '#FF3B30' },
];

const SPORT_EMOJIS: Record<string, string> = {
  football:    '⚽',
  cricket:     '🏏',
  basketball:  '🏀',
  tabletennis: '🏓',
  badminton:   '🏸',
  tennis:      '🎾',
};

const SKILL_INFO = [
  {
    label: 'Beginner',
    description: "You're new to the sport or have limited experience. Focused on learning basic rules, techniques, and fundamentals.",
  },
  {
    label: 'Intermediate',
    description: 'You have a good understanding of the game and basic skills. Can participate comfortably in recreational play.',
  },
  {
    label: 'Experienced',
    description: 'Regular player with solid technical skills and game understanding. Comfortable with advanced techniques and strategies.',
  },
  {
    label: 'Advanced',
    description: 'Highly skilled player with extensive experience. Competes at high levels with advanced tactical understanding and consistent performance.',
  },
];

const SLIDER_HEIGHT = 340;

export default function SkillLevelScreen({ navigation, route }: any) {
  const colors = useColors();
  const { selectedSports, userId: passedUserId } = route.params;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sliderValue, setSliderValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [dragY, setDragY] = useState<number | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  // Accumulates skill levels as user goes through each sport
  const skillLevelsRef = useRef<Record<string, string>>({});

  const sliderRef = useRef<View>(null);
  const sliderTopY = useRef(0);
  const progress = 4 / TOTAL_STEPS;

  const currentSport = selectedSports[currentIndex];
  const isLast = currentIndex === selectedSports.length - 1;
  const currentSkill = SKILL_LEVELS[sliderValue];

  const updateSlider = (pageY: number, isDragging: boolean) => {
    const relativeY = pageY - sliderTopY.current;
    const clamped = Math.max(0, Math.min(SLIDER_HEIGHT, relativeY));
    const level = Math.round(
      ((SLIDER_HEIGHT - clamped) / SLIDER_HEIGHT) * (SKILL_LEVELS.length - 1)
    );
    if (isDragging) {
      setDragY(clamped);
    } else {
      setDragY(null);
    }
    setSliderValue(level);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => updateSlider(event.nativeEvent.pageY, true),
      onPanResponderMove: (event) => updateSlider(event.nativeEvent.pageY, true),
      onPanResponderRelease: () => setDragY(null),
      onPanResponderTerminate: () => setDragY(null),
    })
  ).current;

  // ── Save Handler ─────────────────────────────────────────────────────────────

  const handleNext = async () => {
    // Record skill level for current sport
    skillLevelsRef.current[currentSport] = currentSkill.label;

    if (!isLast) {
      setCurrentIndex((prev) => prev + 1);
      setSliderValue(0);
      return;
    }

    // Last sport — save everything and navigate
    setIsLoading(true);
    try {
      let userId = passedUserId ?? await AuthManager.getCurrentUserId();
      if (!userId) {
        const session = await AuthManager.getCurrentSession();
        userId = session?.user?.id ?? null;
      }
      if (!userId) {
        Alert.alert('Session Expired', 'Please log in again.');
        return;
      }

      await ProfileManager.saveSkillLevels(userId, skillLevelsRef.current);
      navigation.navigate('AvatarSelect');

    } catch (error: any) {
      Alert.alert('Error', error?.message ?? 'Failed to save. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const currentThumbPos = dragY !== null
    ? dragY
    : SLIDER_HEIGHT - (sliderValue / (SKILL_LEVELS.length - 1)) * SLIDER_HEIGHT;

  const thumbPosition = currentThumbPos;
  const fillHeight = SLIDER_HEIGHT - currentThumbPos;

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
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 40,
      gap: 8,
    },
    title: {
      fontSize: 24,
      fontFamily: FontFamily.semiBold,
      color: colors.textPrimary,
    },
    sportEmoji: {
      fontSize: 28,
      textAlign: 'center',
      marginTop: 8,
      marginBottom: 0
      ,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      gap: 64,
    },
    labelsContainer: {
      height: SLIDER_HEIGHT,
      justifyContent: 'space-between',
      alignItems: 'flex-end',
    },
    levelLabel: {
      fontFamily: FontFamily.bold,
    },
    sliderContainer: {
      width: 50,
      height: SLIDER_HEIGHT,
      alignItems: 'center',
    },
    sliderTrack: {
      width: 4,
      height: SLIDER_HEIGHT,
      borderRadius: 2,
      backgroundColor: colors.backgroundTertiary,
      position: 'absolute',
    },
    sliderFill: {
      width: 4,
      borderRadius: 2,
      position: 'absolute',
      bottom: 0,
    },
    sliderThumb: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.backgroundPrimary,
      position: 'absolute',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 5,
      justifyContent: 'center',
      alignItems: 'center',
    },
    thumbInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    bottomContainer: {
      paddingBottom: 48,
      alignItems: 'center',
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
    infoOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    infoSheet: {
      backgroundColor: colors.backgroundSecondary,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 24,
      paddingTop: 12,
      maxHeight: '92%',
    },
    infoHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.backgroundQuaternary,
      alignSelf: 'center',
      marginBottom: 24,
    },
    infoItem: {
      marginBottom: 28,
    },
    infoLabel: {
      fontSize: 22,
      fontFamily: FontFamily.bold,
      color: colors.systemGreen,
      marginBottom: 8,
    },
    infoDescription: {
      fontSize: FontSize.md,
      fontFamily: FontFamily.regular,
      color: colors.textPrimary,
      lineHeight: 24,
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle={colors.isDark ? 'light-content' : 'dark-content'} />

      {/* Green tint gradient at top */}
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

      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar} />
      </View>

      <View style={styles.titleRow}>
        <Text style={styles.title}>Select your skill level</Text>
        <TouchableOpacity onPress={() => setShowInfo(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={{ fontSize: 18, color: colors.textTertiary }}>ⓘ</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sportEmoji}>{SPORT_EMOJIS[currentSport]}</Text>

      <View style={styles.content}>
        <View style={styles.labelsContainer}>
          {[...SKILL_LEVELS].reverse().map((level, index) => {
            const levelIndex = SKILL_LEVELS.length - 1 - index;
            const isSelected = sliderValue === levelIndex;
            return (
              <TouchableOpacity
                key={level.label}
                onPress={() => setSliderValue(levelIndex)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.levelLabel,
                    {
                      color: isSelected ? currentSkill.color : colors.textTertiary,
                      opacity: isSelected ? 1 : 0.4,
                      fontSize: isSelected ? 28 : 24,
                    },
                  ]}
                >
                  {level.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View
          ref={sliderRef}
          style={styles.sliderContainer}
          onLayout={() => {
            sliderRef.current?.measure((_x, _y, _w, _h, _px, py) => {
              sliderTopY.current = py;
            });
          }}
          {...panResponder.panHandlers}
        >
          <View style={styles.sliderTrack} />
          <View style={[styles.sliderFill, { height: fillHeight, backgroundColor: currentSkill.color }]} />
          <View style={[styles.sliderThumb, { top: thumbPosition - 18 }]}>
            <View style={[styles.thumbInner, { backgroundColor: currentSkill.color }]} />
          </View>
        </View>
      </View>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          disabled={isLoading}
        >
          {isLoading
            ? <ActivityIndicator color={colors.primaryWhite} />
            : <Text style={styles.nextButtonText}>{isLast ? 'Next' : 'Next'}</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Skill Info Modal */}
      <Modal
        visible={showInfo}
        animationType="slide"
        transparent
        onRequestClose={() => setShowInfo(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowInfo(false)}>
          <View style={styles.infoOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.infoSheet}>
                <View style={styles.infoHandle} />
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
                  {SKILL_INFO.map((item) => (
                    <View key={item.label} style={styles.infoItem}>
                      <Text style={styles.infoLabel}>{item.label}</Text>
                      <Text style={styles.infoDescription}>{item.description}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

    </View>
  );
}