import React, { useState, useEffect } from 'react';
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

export default function UpdateSkillScreen({ navigation, route }: any) {
  const colors = useColors();
  const isDarkMode = colors.backgroundPrimary === '#000000' || colors.backgroundPrimary === '#121212';
  
  const { sports = [], currentUserId } = route.params || {};

  const [currentIndex, setCurrentIndex] = useState(0);
  const [updatedSkillLevels, setUpdatedSkillLevels] = useState<{ [key: string]: string }>({});
  
  const [selectedSkillIndex, setSelectedSkillIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  const currentSport = sports[currentIndex];
  const isLastSport = currentIndex === sports.length - 1;

  // React to sport change natively setting slider
  useEffect(() => {
    if (currentSport) {
      const existingSkill = currentSport.skill_level;
      const parsedIndex = SKILLS.indexOf(existingSkill);
      setSelectedSkillIndex(parsedIndex >= 0 ? parsedIndex : 0);
    }
  }, [currentIndex, currentSport]);

  const handleCancel = () => {
    navigation.goBack();
  };

  const handleInfo = () => {
    Alert.alert("Skill Levels", "Update your appropriate proficiency for this sport.");
  };

  const handleNextOrSave = async () => {
    // Record current selection map bound to ID directly aligning with swift protocol
    const updatedSkills = { 
      ...updatedSkillLevels, 
      [currentSport.id]: SKILLS[selectedSkillIndex] 
    };
    setUpdatedSkillLevels(updatedSkills);

    if (!isLastSport) {
      setCurrentIndex(prev => prev + 1);
      return;
    }

    // Save strictly via Supabase
    setIsLoading(true);
    try {
      // Loop map patching updates
      for (const [sportId, skill] of Object.entries(updatedSkills)) {
        const { error } = await supabase
           .from('user_preferred_sports')
           .update({ skill_level: skill })
           .eq('user_id', currentUserId)
           .eq('sport_id', parseInt(sportId));
           
        if (error) throw error;
      }

      // Automatically refresh bounds implicitly by backing up to EditProfile
      navigation.goBack();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update sports.");
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
          <Text style={[styles.title, { color: colors.textPrimary }]}>Update skill level</Text>
          <TouchableOpacity onPress={handleInfo}>
            <Ionicons name="information-circle-outline" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.emojiText}>{currentSport?.emoji}</Text>

        <View style={styles.sliderContainer}>
          <View style={styles.verticalTrackContainer}>
            <View style={[styles.trackLine, { backgroundColor: isDarkMode ? '#2C2C2E' : '#E5E5EA' }]} />
            
            <View 
               style={[
                 styles.activeTrackLine, 
                 { 
                   backgroundColor: SKILL_COLORS[selectedSkillIndex],
                   height: `${(selectedSkillIndex / 3) * 100}%` 
                 }
               ]} 
            />
          </View>

          <View style={styles.labelsContainer}>
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
            style={[styles.actionButton, { opacity: isLoading ? 0.5 : 1 }]} 
            onPress={handleNextOrSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.actionButtonText}>{isLastSport ? 'Save' : 'Next'}</Text>
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
    marginLeft: 'auto',
    position: 'absolute',
    right: 0,
    borderRadius: 4,
    justifyContent: 'flex-end',
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
    paddingRight: 40,
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
  actionButton: {
    width: 120,
    height: 50,
    backgroundColor: '#34C759',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontFamily: FontFamily.semiBold,
    fontSize: 20,
  }
});
