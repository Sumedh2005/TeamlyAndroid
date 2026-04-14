import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../theme/colors';
import { FontFamily } from '../../../theme/fonts';

export default function UserProfileScreen({ navigation, route }: any) {
  const colors = useColors();
  const userId = route?.params?.userId;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundPrimary,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 20,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.backgroundTertiary,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    title: {
      fontSize: 24,
      fontFamily: FontFamily.bold,
      color: colors.textPrimary,
      marginBottom: 10,
    },
    subtitle: {
      fontSize: 16,
      fontFamily: FontFamily.medium,
      color: colors.textSecondary,
    }
  });

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>User Profile</Text>
          <Text style={styles.subtitle}>ID: {userId}</Text>
          <Text style={[styles.subtitle, { marginTop: 20 }]}>Placeholder for User Profile Screen</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}
