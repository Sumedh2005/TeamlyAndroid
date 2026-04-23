import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useColors } from '../../../theme/colors';
import { FontFamily } from '../../../theme/fonts';
import { supabase } from '../../../lib/supabase';

interface Sport {
  id: number;
  name: string;
  emoji: string;
}

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 48 - 32) / 3;

export default function AddNewSportScreen({ navigation, route }: any) {
  const colors = useColors();
  const isDarkMode = colors.backgroundPrimary === '#000000' || colors.backgroundPrimary === '#121212';
  
  const { existingSportIds = [], currentUserId } = route.params || {};

  const [isLoading, setIsLoading] = useState(true);
  const [sports, setSports] = useState<Sport[]>([]);
  const [selectedSports, setSelectedSports] = useState<Sport[]>([]);

  useEffect(() => {
    fetchSports();
  }, []);

  const fetchSports = async () => {
    try {
      const { data, error } = await supabase
        .from('sports')
        .select('id, name, emoji')
        .order('id', { ascending: true });

      if (error) throw error;

      // Filter out existing sports logically mapping swift algorithm
      const filtered = (data || []).filter(s => !existingSportIds.includes(s.id));
      setSports(filtered);
    } catch (error: any) {
      Alert.alert("Error", "Failed to load sports. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const handleNext = () => {
    if (selectedSports.length === 0) return;
    navigation.navigate('NewSportSkill', { selectedSports, currentUserId });
  };

  const toggleSport = (sport: Sport) => {
    setSelectedSports(prev => {
      const exists = prev.find(s => s.id === sport.id);
      if (exists) {
        return prev.filter(s => s.id !== sport.id);
      } else {
        return [...prev, sport];
      }
    });
  };

  const renderItem = ({ item }: { item: Sport }) => {
    const isSelected = selectedSports.some(s => s.id === item.id);
    
    return (
      <TouchableOpacity
        key={item.id.toString()}
        style={[
          styles.sportCell,
          { 
            backgroundColor: isSelected
              ? `${colors.systemGreen}22`
              : colors.backgroundSecondary,
            borderWidth: isSelected ? 2 : 0,
            borderColor: isSelected ? colors.systemGreen : 'transparent',
          }
        ]}
        onPress={() => toggleSport(item)}
      >
        <Text style={styles.sportEmoji}>{item.emoji}</Text>
      </TouchableOpacity>
    );
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

        <Text style={[styles.title, { color: colors.textPrimary }]}>Add a sport</Text>

        <View style={styles.content}>
          {isLoading ? (
            <ActivityIndicator size="large" color={colors.textPrimary} />
          ) : (
            <FlatList
              data={sports}
              keyExtractor={item => item.id.toString()}
              numColumns={3}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              columnWrapperStyle={styles.columnWrapper}
              renderItem={renderItem}
              ListEmptyComponent={
                <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No more sports available to add</Text>
              }
            />
          )}
        </View>

        <View style={styles.bottomContainer}>
          <TouchableOpacity 
            style={[styles.saveButton, { opacity: selectedSports.length > 0 ? 1 : 0.5 }]} 
            onPress={handleNext}
            disabled={selectedSports.length === 0}
          >
            <Text style={styles.saveButtonText}>Next</Text>
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
  title: {
    fontSize: 28,
    fontFamily: FontFamily.medium,
    textAlign: 'center',
    marginTop: 24,
  },
  content: {
    flex: 1,
    marginTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  columnWrapper: {
    justifyContent: 'flex-start',
    marginBottom: 16,
    gap: 16,
  },
  sportCell: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sportEmoji: {
    fontSize: 40,
  },
  emptyText: {
    fontFamily: FontFamily.regular,
    marginTop: 40,
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
