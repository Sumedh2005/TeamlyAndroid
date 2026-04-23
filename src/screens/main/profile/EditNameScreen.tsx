import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useColors } from '../../../theme/colors';
import { FontFamily } from '../../../theme/fonts';
import { supabase } from '../../../lib/supabase';

export default function EditNameScreen({ navigation, route }: any) {
  const colors = useColors();
  const isDarkMode = colors.backgroundPrimary === '#000000' || colors.backgroundPrimary === '#121212';
  
  const { currentName, currentUserId } = route.params || {};

  const [name, setName] = useState(currentName || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleCancel = () => {
    navigation.goBack();
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName || !currentUserId) return;

    setIsLoading(true);
    Keyboard.dismiss();

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name: trimmedName })
        .eq('id', currentUserId);

      if (error) throw error;

      // Navigate back and rely on useFocusEffect to propagate data automatically
      navigation.goBack();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update name");
      setIsLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
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

          <View style={styles.content}>
            <View style={[
              styles.inputContainer,
              { 
                backgroundColor: isDarkMode ? '#1C1C1E' : '#FFFFFF',
                borderColor: isDarkMode ? '#2C2C2E' : '#E5E5EA'
              }
            ]}>
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                value={name}
                onChangeText={setName}
                placeholder="Name"
                placeholderTextColor={isDarkMode ? '#8E8E93' : '#C7C7CC'}
                autoCorrect={false}
                autoFocus
              />
            </View>
          </View>

          <View style={styles.bottomContainer}>
            <TouchableOpacity 
              style={[
                styles.saveButton,
                { opacity: (!name.trim() || isLoading) ? 0.5 : 1 }
              ]} 
              onPress={handleSave}
              disabled={!name.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

        </SafeAreaView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
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
    paddingHorizontal: 40,
  },
  inputContainer: {
    height: 50,
    borderRadius: 25,
    borderWidth: 0.7,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  input: {
    fontFamily: FontFamily.regular,
    fontSize: 18,
    height: '100%',
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
