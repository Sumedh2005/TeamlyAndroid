import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Dimensions,
  Alert,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useColors } from '../../../theme/colors';
import { FontFamily } from '../../../theme/fonts';
import { supabase } from '../../../lib/supabase';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width / 3;
const AGES = Array.from({ length: 100 - 16 + 1 }, (_, i) => 16 + i);

export default function EditAgeScreen({ navigation, route }: any) {
  const colors = useColors();
  const isDarkMode = colors.backgroundPrimary === '#000000' || colors.backgroundPrimary === '#121212';
  
  const { currentAge, currentUserId } = route.params || {};

  const [isLoading, setIsLoading] = useState(false);
  const initialIndex = AGES.includes(currentAge) ? AGES.indexOf(currentAge) : AGES.indexOf(20);
  const [selectedAge, setSelectedAge] = useState(AGES[initialIndex]);

  const scrollRef = useRef<ScrollView>(null);
  const initialOffset = initialIndex * ITEM_WIDTH;

  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ x: initialOffset, y: 0, animated: false });
    }, 50);
  }, [initialOffset]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = event.nativeEvent.contentOffset.x;
    const index = Math.round(offset / ITEM_WIDTH);
    if (index >= 0 && index < AGES.length) {
      setSelectedAge(AGES[index]);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const handleSave = async () => {
    if (!currentUserId) return;

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ age: selectedAge })
        .eq('id', currentUserId);

      if (error) throw error;
      
      navigation.goBack();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update age");
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

        <View style={styles.pickerContainer}>
          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={ITEM_WIDTH}
            decelerationRate="fast"
            onScroll={handleScroll}
            onMomentumScrollEnd={handleScroll}
            scrollEventThrottle={16}
            contentContainerStyle={{ paddingHorizontal: ITEM_WIDTH }}
            style={styles.agePicker}
          >
            {AGES.map((age) => {
              const isSelected = age === selectedAge;
              return (
                <View key={age} style={styles.ageItem}>
                  <Text
                    style={[
                      styles.ageText,
                      {
                        fontSize: isSelected ? 80 : 40,
                        color: isSelected ? colors.systemGreen : colors.textTertiary,
                        opacity: isSelected ? 1 : 0.4,
                      },
                    ]}
                  >
                    {age}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.bottomContainer}>
          <TouchableOpacity 
            style={[styles.saveButton, { opacity: isLoading ? 0.5 : 1 }]} 
            onPress={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
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
  pickerContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  agePicker: {
    maxHeight: 120,
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
