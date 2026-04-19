import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useColors } from '../../../theme/colors';
import { FontFamily } from '../../../theme/fonts';
import { supabase } from '../../../lib/supabase';

// Map strictly to Swift implementation
const SKILLS = ['Beginner', 'Intermediate', 'Experienced', 'Advanced'];
const SKILL_COLORS = ['#007AFF', '#FFCC00', '#FF9500', '#FF3B30']; // Blue, Yellow, Orange, Red

export default function NewSportSkillScreen({ navigation, route }: any) {
  const colors = useColors();
  const isDarkMode = colors.backgroundPrimary === '#000000' || colors.backgroundPrimary === '#121212';
  
  const { selectedSports = [], currentUserId } = route.params || {};

  const [currentSportIndex, setCurrentSportIndex] = useState(0);
  const [skillLevelsForSports, setSkillLevelsForSports] = useState<{ [key: string]: string }>({});
  
  // Default to Beginner index 0
  const [selectedSkillIndex, setSelectedSkillIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  const currentSport = selectedSports[currentSportIndex];
  const isLastSport = currentSportIndex === selectedSports.length - 1;

  const handleCancel = () => {
    // Safely jump back to EditProfile directly instead of double popping
    navigation.navigate('EditProfile'); 
  };

  const handleInfo = () => {
    Alert.alert("Skill Levels", "Select your appropriate proficiency for this sport.");
  };

  const handleNextOrSave = async () => {
    // Record current selection
    const updatedSkills = { 
      ...skillLevelsForSports, 
      [currentSport.name]: SKILLS[selectedSkillIndex] 
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
        colors={isDarkMode ? ['rgba(0, 38, 0, 1)', 'transparent'] : ['rgba(53, 199, 89, 0.3)', 'transparent']}
        style={styles.linearGradient}
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

        <View style={styles.sliderContainer}>
          {/* Vertical Touch Nodes mapping Swift verticalSlider positions */}
          <View style={styles.verticalTrackContainer}>
            <View style={[styles.trackLine, { backgroundColor: isDarkMode ? '#2C2C2E' : '#E5E5EA' }]} />
            
            {/* The active selection track pill */}
            <View 
               style={[
                 styles.activeTrackLine, 
                 { 
                   backgroundColor: SKILL_COLORS[selectedSkillIndex],
                   // Bottom is 0, so height grows from bottom
                   height: `${(selectedSkillIndex / 3) * 100}%` 
                 }
               ]} 
            />
          </View>

          <View style={styles.labelsContainer}>
            {/* Map backward to match Advanced on top seamlessly */}
            {SKILLS.slice().reverse().map((skill, reversedIndex) => {
              const actualIndex = 3 - reversedIndex;
              const isSelected = actualIndex === selectedSkillIndex;
              
              return (
                <TouchableOpacity 
                   key={skill}
                   style={styles.labelNode}
                   onPress={() => setSelectedSkillIndex(actualIndex)}
                >
                  <Text 
                    style={[
                      styles.skillText, 
                      { 
                         color: isSelected 
                           ? SKILL_COLORS[actualIndex] 
                           : (isDarkMode ? '#8E8E93' : 'rgba(0,0,0,0.4)'),
                         fontFamily: isSelected ? FontFamily.bold : FontFamily.medium
                      }
                    ]}
                  >
                    {skill}
                  </Text>
                </TouchableOpacity>
              )
            })}
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
  sliderContainer: {
    marginTop: 30,
    flexDirection: 'row',
    alignSelf: 'center',
    width: 250,
    height: 380,
  },
  verticalTrackContainer: {
    width: 8,
    height: '100%',
    marginLeft: 'auto', // Push strictly to right side of slider container
    position: 'absolute',
    right: 0,
    borderRadius: 4,
    justifyContent: 'flex-end', // Ensure active track spawns from bottom
    overflow: 'hidden',
  },
  trackLine: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 4,
  },
  activeTrackLine: {
    width: '100%',
    borderRadius: 4,
  },
  labelsContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingRight: 40, // Space from track
    paddingVertical: 10,
  },
  labelNode: {
    height: 70,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  skillText: {
    fontSize: 26,
    textAlign: 'right',
  },
  bottomContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 30,
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
