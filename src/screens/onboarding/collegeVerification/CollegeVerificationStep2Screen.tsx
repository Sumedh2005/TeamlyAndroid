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
  Alert,
  ActivityIndicator,
  type TextInput as TextInputType,
} from 'react-native';
import { useColors } from '../../../theme/colors';
import { FontFamily, FontSize } from '../../../theme/fonts';
import { supabase } from '../../../lib/supabase';
import ProfileManager from '../../../services/ProfileManager';

export default function CollegeVerificationStep2Screen({ navigation, route }: any) {
  const colors = useColors();
  const { email, college } = route.params; // college: { id, name, location }
  const [otp, setOtp] = useState(['', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
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

  // ── Shared helper to call the send-college-otp edge function ──────────────
  const callSendOtp = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;

    const response = await fetch(
      `${supabaseUrl}/functions/v1/send-college-otp`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ email }),
      }
    );
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? 'Failed to send OTP');
  };

  // ── Verify OTP ─────────────────────────────────────────────────────────────
  const handleVerify = async () => {
    if (!isComplete) return;
    setVerifying(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      const userId = sessionData?.session?.user?.id;
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;

      // 1. Verify OTP via edge function
      const response = await fetch(
        `${supabaseUrl}/functions/v1/verify-college-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ email, otp: otp.join('') }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        Alert.alert('Invalid OTP', result.error ?? 'Verification failed. Try again.');
        return;
      }

      // 2. Save college_id to the user's profile
      if (userId && college?.id) {
        await ProfileManager.saveCollegeId(userId, college.id);
      }

      // 3. Navigate to main app
      navigation.navigate('MainApp');
    } catch (err) {
      console.error('Verify OTP error:', err);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  // ── Resend OTP ─────────────────────────────────────────────────────────────
  const handleResend = async () => {
    setResending(true);
    setOtp(['', '', '', '']);
    inputs.current[0]?.focus();
    try {
      await callSendOtp();
      Alert.alert('Sent!', `A new OTP has been sent to ${email}`);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  };

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

        <View style={styles.emailBox}>
          <Text style={styles.emailText}>{email}</Text>
        </View>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <View
              key={index}
              style={[
                styles.otpBox,
                {
                  borderColor:
                    digit.length > 0
                      ? colors.systemGreen
                      : colors.backgroundTertiary,
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

        <TouchableOpacity
          style={[
            styles.button,
            { opacity: isComplete && !verifying ? 1 : 0.5 },
          ]}
          disabled={!isComplete || verifying}
          onPress={handleVerify}
        >
          {verifying ? (
            <ActivityIndicator color={colors.primaryWhite} />
          ) : (
            <Text style={styles.buttonText}>Verify</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleResend} disabled={resending}>
          {resending ? (
            <ActivityIndicator color={colors.systemGreen} />
          ) : (
            <Text style={styles.resendText}>Resend OTP</Text>
          )}
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
}