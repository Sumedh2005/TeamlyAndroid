// src/screens/main/teams/TeamScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '../../../theme/colors';
import { FontFamily, FontSize } from '../../../theme/fonts';

export default function TeamScreen() {
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Teams Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
  },
});