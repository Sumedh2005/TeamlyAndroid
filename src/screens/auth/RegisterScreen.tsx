import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useColors } from '../../theme/colors';
import { FontFamily, FontSize } from '../../theme/fonts';
import AuthManager from '../../lib/AuthManager';

interface Props {
  onClose: () => void;
  onSwitchToLogin: () => void;
  onSignUpSuccess: (isOnboardingComplete: boolean) => void; // renamed from onSignUp, same pattern as LoginScreen
}

export default function RegisterScreen({ onClose, onSwitchToLogin, onSignUpSuccess }: Props) {
  const colors = useColors();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // ── Sign Up Handler ──────────────────────────────────────────────────────────

  const handleSignUp = async () => {
    Keyboard.dismiss();

    // Empty field check
    if (!email.trim() || !password.trim() || !confirm.trim()) {
      Alert.alert('Missing Information', 'Please fill in all fields.');
      return;
    }

    // Password match check
    if (password !== confirm) {
      Alert.alert('Password Mismatch', "Passwords don't match.");
      return;
    }

    // Password length check
    if (password.length < 6) {
      Alert.alert('Password Too Short', 'Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);

    try {
      await AuthManager.registerNewUserWithEmail(email.trim(), password);

      // After register, new users always go to onboarding
      onSignUpSuccess(false);

    } catch (error: any) {
      const message = getErrorMessage(error?.message ?? '');
      Alert.alert('Registration Failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Error Message Helper ─────────────────────────────────────────────────────

  const getErrorMessage = (raw: string): string => {
    if (
      raw.includes('already registered') ||
      raw.includes('already exists') ||
      raw.includes('user already exists')
    ) {
      return 'This email is already registered. Please use a different email or login.';
    }
    if (raw.includes('invalid email') || raw.includes('email format')) {
      return 'Please enter a valid email address.';
    }
    if (
      raw.includes('password') ||
      raw.includes('weak') ||
      raw.includes('6 characters')
    ) {
      return 'Password must be at least 6 characters.';
    }
    if (raw.includes('network') || raw.includes('connection')) {
      return 'Network error. Please check your internet connection.';
    }
    if (raw.includes('Invalid email format')) {
      return 'Please enter a valid email address.';
    }
    return 'Registration failed. Please try again.';
  };

  // ── Styles ───────────────────────────────────────────────────────────────────

  const styles = StyleSheet.create({
    modalHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.backgroundQuaternary,
      alignSelf: 'center',
      marginBottom: 24,
    },
    modalTitle: {
      fontSize: 28,
      fontFamily: FontFamily.bold,
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: 28,
    },
    input: {
      height: 52,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 50,
      paddingHorizontal: 20,
      fontSize: FontSize.md,
      fontFamily: FontFamily.regular,
      color: colors.textPrimary,
      marginBottom: 12,
    },
    button: {
      height: 56,
      backgroundColor: isLoading ? colors.systemGreen + '80' : colors.systemGreen,
      borderRadius: 50,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 8,
    },
    buttonText: {
      fontSize: FontSize.md,
      fontFamily: FontFamily.semiBold,
      color: colors.primaryWhite,
      letterSpacing: 1,
    },
    switchText: {
      fontSize: FontSize.sm,
      fontFamily: FontFamily.regular,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 20,
    },
    switchLink: {
      color: colors.systemGreen,
      fontFamily: FontFamily.semiBold,
    },
  });

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={{ paddingHorizontal: 24, paddingBottom: 48, paddingTop: 12 }}>

          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Sign Up</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.textTertiary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoading}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.textTertiary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!isLoading}
          />

          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor={colors.textTertiary}
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            editable={!isLoading}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleSignUp}
            disabled={isLoading}
          >
            {isLoading
              ? <ActivityIndicator color={colors.primaryWhite} />
              : <Text style={styles.buttonText}>SIGN UP</Text>
            }
          </TouchableOpacity>

          <Text style={styles.switchText}>
            Already a member?{' '}
            <Text style={styles.switchLink} onPress={onSwitchToLogin}>
              Login
            </Text>
          </Text>

        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}