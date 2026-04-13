import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  StatusBar,
  TouchableWithoutFeedback,
  Keyboard,
  type TextInput as TextInputType,
} from 'react-native';
import { useColors } from '../../../theme/colors';
import { FontFamily, FontSize } from '../../../theme/fonts';

export default function CollegeVerificationStep2Screen({ navigation, route }: any) {
  const colors = useColors();
  const { email } = route.params;
  const [otp, setOtp] = useState(['', '', '', '']);
  const inputs = useRef<TextInputType[]>([]);

  const handleChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text && index < 3) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const isComplete = otp.every((d) => d.length === 1);

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
    emailBox: {
      height: 52,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 50,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 32,
    },
    emailText: {
      fontSize: FontSize.md,
      fontFamily: FontFamily.regular,
      color: colors.textPrimary,
    },
    otpContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 12,
      marginBottom: 32,
    },
    otpBox: {
      width: 64,
      height: 64,
      borderRadius: 16,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
    },
    otpInput: {
      width: '100%',
      height: '100%',
      textAlign: 'center',
      fontSize: 22,
      fontFamily: FontFamily.bold,
      color: colors.textPrimary,
    },
    button: {
      height: 52,
      paddingHorizontal: 48,
      borderRadius: 50,
      backgroundColor: colors.systemGreen,
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
      marginBottom: 20,
    },
    buttonText: {
      fontSize: FontSize.md,
      fontFamily: FontFamily.semiBold,
      color: colors.primaryWhite,
    },
    resendText: {
      fontSize: FontSize.sm,
      fontFamily: FontFamily.semiBold,
      color: colors.systemGreen,
      textAlign: 'center',
    },
  });

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <StatusBar barStyle={colors.isDark ? 'light-content' : 'dark-content'} />

        <Text style={styles.title}>Enter OTP</Text>

        {/* Email display */}
        <View style={styles.emailBox}>
          <Text style={styles.emailText}>{email}</Text>
        </View>

        {/* OTP boxes */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <View
              key={index}
              style={[
                styles.otpBox,
                {
                  borderColor:
                    digit.length > 0 ? colors.systemGreen : colors.backgroundTertiary,
                },
              ]}
            >
              <TextInput
                ref={(ref) => {
                  if (ref) inputs.current[index] = ref;
                }}
                style={styles.otpInput}
                value={digit}
                onChangeText={(text) => handleChange(text.slice(-1), index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
              />
            </View>
          ))}
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          style={[styles.button, { opacity: isComplete ? 1 : 0.5 }]}
          disabled={!isComplete}
          onPress={() => navigation.navigate('MainApp')}
        >
          <Text style={styles.buttonText}>Verify</Text>
        </TouchableOpacity>

        {/* Resend */}
        <TouchableOpacity onPress={() => {}}>
          <Text style={styles.resendText}>Resend OTP</Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
}