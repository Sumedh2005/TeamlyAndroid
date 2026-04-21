import React, { useState } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '../../../theme/colors';
import { FontFamily, FontSize } from '../../../theme/fonts';
import { supabase } from '../../../lib/supabase';

// College-specific email domain rules
const COLLEGE_EMAIL_RULES: Record<number, string> = {
  1: '@srmist.edu.in', // SRM University
};

function isValidForSelectedCollege(email: string, collegeId: number): boolean {
  const requiredDomain = COLLEGE_EMAIL_RULES[collegeId];
  if (requiredDomain) {
    return email.toLowerCase().endsWith(requiredDomain);
  }
  // No specific rule for this college — accept any non-empty email
  return true;
}

export default function CollegeVerificationScreen({ navigation, route }: any) {
  const colors = useColors();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const college = route.params?.college; // { id, name, location }

  const requiredDomain = college ? COLLEGE_EMAIL_RULES[college.id] : null;
  const emailIsStructurallyValid = email.trim().length > 0;
  const emailIsCollegeValid =
    emailIsStructurallyValid &&
    (college ? isValidForSelectedCollege(email.trim(), college.id) : true);

  // Show a hint only when the user has typed something but the domain is wrong
  const showDomainHint =
    emailIsStructurallyValid && !emailIsCollegeValid && requiredDomain;

  const handleSendOtp = async () => {
    if (!emailIsCollegeValid) return;
    setLoading(true);
    try {
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
          body: JSON.stringify({ email: email.trim() }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        Alert.alert('Error', result.error ?? 'Failed to send OTP. Try again.');
        return;
      }

      navigation.navigate('CollegeVerificationStep2', {
        email: email.trim(),
        college,
      });
    } catch (err) {
      console.error('Send OTP error:', err);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundPrimary,
      paddingHorizontal: 24,
    },
    collegeBadge: {
      alignSelf: 'center',
      marginTop: 160,
      marginBottom: 8,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 50,
      paddingVertical: 8,
      paddingHorizontal: 20,
    },
    collegeBadgeText: {
      fontSize: FontSize.sm,
      fontFamily: FontFamily.medium,
      color: colors.textSecondary,
    },
    title: {
      fontSize: 24,
      fontFamily: FontFamily.semiBold,
      color: colors.textPrimary,
      marginTop: 12,
      marginBottom: 20,
      textAlign: 'center',
    },
    formContainer: {
      marginTop: 24,
    },
    input: {
      height: 52,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 50,
      paddingHorizontal: 20,
      fontSize: FontSize.md,
      fontFamily: FontFamily.regular,
      color: colors.textPrimary,
      marginBottom: 8,
    },
    hintText: {
      fontSize: FontSize.sm,
      fontFamily: FontFamily.regular,
      color: colors.systemGreen,
      textAlign: 'center',
      marginBottom: 20,
    },
    button: {
      height: 52,
      paddingHorizontal: 48,
      borderRadius: 50,
      backgroundColor: colors.systemGreen,
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
      marginTop: 24,
    },
    buttonText: {
      fontSize: FontSize.lg,
      fontFamily: FontFamily.semiBold,
      color: colors.primaryWhite,
    },
  });

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <StatusBar barStyle={colors.isDark ? 'light-content' : 'dark-content'} />

      {/* Green tint gradient at top */}
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

        {college && (
          <View style={styles.collegeBadge}>
            <Text style={styles.collegeBadgeText}>{college.name}</Text>
          </View>
        )}

        <Text style={styles.title}>Verify College Id</Text>

        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder={
              requiredDomain ? `yourname${requiredDomain}` : 'College mail id'
            }
            placeholderTextColor={colors.textTertiary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* Domain hint when email doesn't match */}
          {showDomainHint && (
            <Text style={styles.hintText}>
              Use your {college.name} email ({requiredDomain})
            </Text>
          )}

          <TouchableOpacity
            style={[
              styles.button,
              { opacity: emailIsCollegeValid && !loading ? 1 : 0.5 },
            ]}
            disabled={!emailIsCollegeValid || loading}
            onPress={handleSendOtp}
          >
            {loading ? (
              <ActivityIndicator color={colors.primaryWhite} />
            ) : (
              <Text style={styles.buttonText}>Send OTP</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}