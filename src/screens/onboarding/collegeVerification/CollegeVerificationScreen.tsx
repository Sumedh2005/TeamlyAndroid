import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useColors } from '../../../theme/colors';
import { FontFamily, FontSize } from '../../../theme/fonts';

export default function CollegeVerificationScreen({ navigation }: any) {
  const colors = useColors();
  const [email, setEmail] = useState('');

  const isValid = email.trim().length > 0;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundPrimary,
      paddingHorizontal: 24,
    },
    title: {
      fontSize: 28,
      fontFamily: FontFamily.bold,
      color: colors.textPrimary,
      marginTop: 100,
      marginBottom: 40,
      textAlign: 'center',
    },
    input: {
      height: 52,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 50,
      paddingHorizontal: 20,
      fontSize: FontSize.md,
      fontFamily: FontFamily.regular,
      color: colors.textPrimary,
      marginBottom: 20,
      textAlign: 'center',
    },
    button: {
      height: 52,
      paddingHorizontal: 48,
      borderRadius: 50,
      backgroundColor: colors.systemGreen,
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
    },
    buttonText: {
      fontSize: FontSize.md,
      fontFamily: FontFamily.semiBold,
      color: colors.primaryWhite,
    },
  });

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <StatusBar barStyle={colors.isDark ? 'light-content' : 'dark-content'} />

        <Text style={styles.title}>Verify College Id</Text>

        <TextInput
          style={styles.input}
          placeholder="College mail id"
          placeholderTextColor={colors.textTertiary}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={[styles.button, { opacity: isValid ? 1 : 0.5 }]}
          disabled={!isValid}
          onPress={() => navigation.navigate('CollegeVerificationStep2', { email })}
        >
          <Text style={styles.buttonText}>Send OTP</Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
}