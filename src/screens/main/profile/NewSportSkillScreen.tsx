import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useColors } from '../../../theme/colors';
import { FontFamily } from '../../../theme/fonts';
import { supabase } from '../../../lib/supabase';

// Map strictly to Swift implementation
const SKILL_LEVELS = [
  { label: 'Beginner',     color: '#007AFF' },
  { label: 'Intermediate', color: '#FFD60A' },
  { label: 'Experienced',  color: '#FF9500' },
  { label: 'Advanced',     color: '#FF3B30' },
];
const SLIDER_HEIGHT = 340;

export default function NewSportSkillScreen({ navigation, route }: any) {
  const colors = useColors();
  const isDarkMode = colors.backgroundPrimary === '#000000' || colors.backgroundPrimary === '#121212';
  
  const { selectedSports = [], currentUserId } = route.params || {};

  const [currentSportIndex, setCurrentSportIndex] = useState(0);
  const [skillLevelsForSports, setSkillLevelsForSports] = useState<{ [key: string]: string }>({});
  
  // Default to Beginner index 0
  const [selectedSkillIndex, setSelectedSkillIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  const [dragY, setDragY] = useState<number | null>(null);
  const sliderRef = useRef<View>(null);
  const sliderTopY = useRef(0);

  const currentSport = selectedSports[currentSportIndex];
  const isLastSport = currentSportIndex === selectedSports.length - 1;

  const currentSkill = SKILL_LEVELS[selectedSkillIndex];

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
    setSelectedSkillIndex(level);
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

  const currentThumbPos = dragY !== null
    ? dragY
    : SLIDER_HEIGHT - (selectedSkillIndex / (SKILL_LEVELS.length - 1)) * SLIDER_HEIGHT;

  const thumbPosition = currentThumbPos;
  const fillHeight = SLIDER_HEIGHT - currentThumbPos;

  const handleCancel = () => {
    // Safely jump back to EditProfile directly instead of double popping
    navigation.navigate('EditProfile'); 
  };

  const handleInfo = () => {
    Alert.alert("Skill Levels", "Select your appropriate proficiency for this sport.");
  };

  const handleNextOrSave = async () => {
    // Record current selection
    const updatedSkills: Record<string, string> = { 
      ...skillLevelsForSports, 
      [currentSport.name]: SKILL_LEVELS[selectedSkillIndex].label 
    };
    setSkillLevelsForSports(updatedSkills);

    if (!isLastSport) {
      setCurrentSportIndex(prev => prev + 1);
      setSelectedSkillIndex(0); // Reset for next sport
      return;
    }

    // Save strictly via Supabase
    setIsLoading(true);
    try {
      const inserts = selectedSports.map((sport: any) => ({
        user_id: currentUserId,
        sport_id: sport.id,
        skill_level: updatedSkills[sport.name] || 'Beginner'
      }));

      for (const row of inserts) {
        const { error } = await supabase
          .from('user_preferred_sports')
          .insert([row]);
        if (error) throw error;
      }

      // Instead of relying on a callback, we just pop backward 2 screens (AddSport -> EditProfile)
      // Because EditProfile uses useFocusEffect, it'll refresh automatically!
      navigation.navigate('EditProfile');
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save sports.");
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
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
      
      <SafeAreaView style={styles.safeArea}>
        
        <View style={styles.header}>
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={styles.closeButton} onPress={handleCancel}>
            <Ionicons name="close" size={20} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        <View style={styles.titleStack}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Select your skill level</Text>
          <TouchableOpacity onPress={handleInfo}>
            <Ionicons name="information-circle-outline" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.emojiText}>{currentSport?.emoji}</Text>

        <View style={styles.content}>
          <View style={styles.labelsContainer}>
            {[...SKILL_LEVELS].reverse().map((level, index) => {
              const levelIndex = SKILL_LEVELS.length - 1 - index;
              const isSelected = selectedSkillIndex === levelIndex;
              return (
                <TouchableOpacity
                  key={level.label}
                  onPress={() => setSelectedSkillIndex(levelIndex)}
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
            <View style={[styles.sliderTrack, { backgroundColor: colors.backgroundTertiary }]} />
            <View style={[styles.sliderFill, { height: fillHeight, backgroundColor: currentSkill.color }]} />
            <View style={[styles.sliderThumb, { top: thumbPosition - 18, backgroundColor: colors.backgroundPrimary }]}>
              <View style={[styles.thumbInner, { backgroundColor: currentSkill.color }]} />
            </View>
          </View>
        </View>

        <View style={styles.bottomContainer}>
          <TouchableOpacity 
            style={[styles.saveButton, { opacity: isLoading ? 0.5 : 1 }]} 
            onPress={handleNextOrSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.saveButtonText}>{isLastSport ? 'Save' : 'Next'}</Text>
            )}
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  linearGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 300,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(142, 142, 147, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleStack: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    gap: 8,
  },
  title: {
    fontSize: 27,
    fontFamily: FontFamily.medium,
  },
  emojiText: {
    fontSize: 40,
    textAlign: 'center',
    marginTop: 12,
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
  saveButton: {
    width: 120,
    height: 50,
    backgroundColor: '#34C759',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontFamily: FontFamily.semiBold,
    fontSize: 20,
  }
});
