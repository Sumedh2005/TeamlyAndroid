import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  FlatList,
  Dimensions,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useColors } from '../../../theme/colors';
import { FontFamily } from '../../../theme/fonts';
import { supabase } from '../../../lib/supabase';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width / 4;
const AGES = Array.from({ length: 100 - 16 + 1 }, (_, i) => 16 + i);

export default function EditAgeScreen({ navigation, route }: any) {
  const colors = useColors();
  const isDarkMode = colors.backgroundPrimary === '#000000' || colors.backgroundPrimary === '#121212';
  
  const { currentAge, currentUserId } = route.params || {};

  const [isLoading, setIsLoading] = useState(false);
  const initialIndex = AGES.includes(currentAge) ? AGES.indexOf(currentAge) : AGES.indexOf(20);
  const [selectedAge, setSelectedAge] = useState(AGES[initialIndex]);

  // Pre-seed animated offset mathematically mapping standard index padding perfectly
  const scrollX = useRef(new Animated.Value(initialIndex * ITEM_WIDTH)).current;
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Snap immediately to correct index relying purely on physical offset mapping over buggy layout algorithms
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({
        offset: initialIndex * ITEM_WIDTH,
        animated: false,
      });
    }, 100);
  }, []);

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

  // Firing when drag completely stops
  const onMomentumScrollEnd = (e: any) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    let closestIndex = Math.round(offsetX / ITEM_WIDTH);
    
    closestIndex = Math.max(0, Math.min(closestIndex, AGES.length - 1));
    setSelectedAge(AGES[closestIndex]);
  };

  const renderItem = ({ item, index }: any) => {
    // Math mapping accurately to Swift's abs(labelCenterX - centerX)
    const inputRange = [
      (index - 2) * ITEM_WIDTH,
      (index - 1) * ITEM_WIDTH,
      index * ITEM_WIDTH,
      (index + 1) * ITEM_WIDTH,
      (index + 2) * ITEM_WIDTH,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.4, 0.6, 1, 0.6, 0.4],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0, 0.6, 1, 0.6, 0],
      extrapolate: 'clamp',
    });

    const color = scrollX.interpolate({
      inputRange,
      outputRange: [
        isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
        isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
        '#34C759',
        isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
        isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
      ],
      extrapolate: 'clamp'
    });

    return (
      <View style={{ width: ITEM_WIDTH, justifyContent: 'center', alignItems: 'center', overflow: 'visible' }}>
        <Animated.Text
          numberOfLines={1}
          style={[
            styles.ageText,
            {
               transform: [{ scale }],
               opacity,
               color,
               width: ITEM_WIDTH * 1.5,
               textAlign: 'center'
            }
          ]}
        >
          {item}
        </Animated.Text>
      </View>
    );
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

        <View style={styles.content}>
          <Animated.FlatList
            ref={flatListRef}
            data={AGES}
            keyExtractor={(item) => item.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            bounces={true}
            snapToInterval={ITEM_WIDTH}
            decelerationRate="fast"
            contentContainerStyle={{
              paddingHorizontal: (width - ITEM_WIDTH) / 2
            }}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false }
            )}
            onMomentumScrollEnd={onMomentumScrollEnd}
            renderItem={renderItem}
            getItemLayout={(_, index) => ({
              length: ITEM_WIDTH,
              offset: ITEM_WIDTH * index,
              index,
            })}
          />
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ageText: {
    fontSize: 90, // Mapped perfectly wrapping to Swift's 95 scaling bounds
    fontFamily: FontFamily.bold, // maps to .heavy
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
