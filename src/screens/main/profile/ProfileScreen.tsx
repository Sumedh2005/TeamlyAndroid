// src/screens/main/profile/ProfileScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useColors } from '../../../theme/colors';
import { FontFamily, FontSize } from '../../../theme/fonts';
import AuthManager from '../../../lib/AuthManager';

export default function ProfileScreen({ navigation }: any) {
  const colors = useColors();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await AuthManager.signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Landing' }],
      });
    } catch (error: any) {
      Alert.alert('Sign Out Failed', error?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.backgroundPrimary,
    },
    title: {
      fontSize: FontSize.xl,
      fontFamily: FontFamily.bold,
      color: colors.textPrimary,
      marginBottom: 40,
    },
    button: {
      height: 52,
      width: 200,
      backgroundColor: isLoading ? colors.systemGreen + '80' : colors.systemGreen,
      borderRadius: 50,
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonText: {
      fontSize: FontSize.md,
      fontFamily: FontFamily.semiBold,
      color: colors.primaryWhite,
      letterSpacing: 1,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile Screen</Text>
      <TouchableOpacity style={styles.button} onPress={handleSignOut} disabled={isLoading}>
        {isLoading
          ? <ActivityIndicator color={colors.primaryWhite} />
          : <Text style={styles.buttonText}>SIGN OUT</Text>
        }
      </TouchableOpacity>
    </View>
  );
}