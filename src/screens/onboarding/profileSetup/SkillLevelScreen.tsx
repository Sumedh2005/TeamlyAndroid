import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  PanResponder,
} from 'react-native';
import { useColors } from '../../../theme/colors';
import { FontFamily, FontSize } from '../../../theme/fonts';

const TOTAL_STEPS = 5;

const SKILL_LEVELS = [
  { label: 'Beginner', color: '#007AFF' },
  { label: 'Intermediate', color: '#FFD60A' },
  { label: 'Experienced', color: '#FF9500' },
  { label: 'Advanced', color: '#FF3B30' },
];

const SPORT_EMOJIS: Record<string, string> = {
  football: '⚽',
  cricket: '🏏',
  basketball: '🏀',
  tabletennis: '🏓',
  badminton: '🏸',
  tennis: '🎾',
};

const SLIDER_HEIGHT = 280;

export default function SkillLevelScreen({ navigation, route }: any) {
  const colors = useColors();
  const { selectedSports } = route.params;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sliderValue, setSliderValue] = useState(0);
  const sliderRef = useRef<View>(null);
  const sliderTopY = useRef(0);
  const progress = 4 / TOTAL_STEPS;

  const currentSport = selectedSports[currentIndex];
  const isLast = currentIndex === selectedSports.length - 1;
  const currentSkill = SKILL_LEVELS[sliderValue];

  const updateSlider = (pageY: number) => {
    const relativeY = pageY - sliderTopY.current;
    const clamped = Math.max(0, Math.min(SLIDER_HEIGHT, relativeY));
    const level = Math.round(
      ((SLIDER_HEIGHT - clamped) / SLIDER_HEIGHT) * (SKILL_LEVELS.length - 1)
    );
    setSliderValue(level);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => {
        updateSlider(event.nativeEvent.pageY);
      },
      onPanResponderMove: (event) => {
        updateSlider(event.nativeEvent.pageY);
      },
    })
  ).current;

  const handleNext = () => {
    if (isLast) {
      navigation.navigate('AvatarSelect');
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSliderValue(0);
    }
  };

  const thumbPosition =
    SLIDER_HEIGHT - (sliderValue / (SKILL_LEVELS.length - 1)) * SLIDER_HEIGHT;
  const fillHeight = SLIDER_HEIGHT - thumbPosition;

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
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 40,
      gap: 8,
    },
    title: {
      fontSize: 24,
      fontFamily: FontFamily.bold,
      color: colors.textPrimary,
    },
    sportEmoji: {
      fontSize: 32,
      textAlign: 'center',
      marginTop: 8,
      marginBottom: 32,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    labelsContainer: {
      flex: 1,
      height: SLIDER_HEIGHT,
      justifyContent: 'space-between',
    },
    levelLabel: {
      fontSize: 22,
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
      height: 56,
      paddingHorizontal: 48,
      borderRadius: 50,
      backgroundColor: colors.systemGreen,
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
      <View style={styles.titleRow}>
        <Text style={styles.title}>Select your skill level</Text>
        <Text style={{ fontSize: 18, color: colors.textTertiary }}>ⓘ</Text>
      </View>

      {/* Sport Emoji */}
      <Text style={styles.sportEmoji}>{SPORT_EMOJIS[currentSport]}</Text>

      {/* Slider + Labels */}
      <View style={styles.content}>
        <View style={styles.labelsContainer}>
          {[...SKILL_LEVELS].reverse().map((level, index) => {
            const levelIndex = SKILL_LEVELS.length - 1 - index;
            const isSelected = sliderValue === levelIndex;
            return (
              <Text
                key={level.label}
                style={[
                  styles.levelLabel,
                  {
                    color: isSelected ? currentSkill.color : colors.textTertiary,
                    opacity: isSelected ? 1 : 0.4,
                  },
                ]}
              >
                {level.label}
              </Text>
            );
          })}
        </View>

        {/* Vertical Slider */}
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
          <View
            style={[
              styles.sliderFill,
              {
                height: fillHeight,
                backgroundColor: currentSkill.color,
              },
            ]}
          />
          <View
            style={[
              styles.sliderThumb,
              { top: thumbPosition - 18 },
            ]}
          >
            <View
              style={[
                styles.thumbInner,
                { backgroundColor: currentSkill.color },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Next / Finish Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>{isLast ? 'Finish' : 'Next'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}