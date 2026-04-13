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
  onSwitchToSignup: () => void;
  onLoginSuccess: (isOnboardingComplete: boolean) => void; // parent handles navigation
}

export default function LoginScreen({ onClose, onSwitchToSignup, onLoginSuccess }: Props) {
  const colors = useColors();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    Keyboard.dismiss();

    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }

    setIsLoading(true);
    try {
      const session = await AuthManager.signInWithEmail(email.trim(), password);
      const userId = session.user.id;
      const onboardingComplete = await AuthManager.isOnboardingComplete(userId);
      onLoginSuccess(onboardingComplete); // ← let LandingScreen navigate
    } catch (error: any) {
      Alert.alert('Login Failed', getErrorMessage(error?.message ?? ''));
    } finally {
      setIsLoading(false);
    }
  };

  const getErrorMessage = (raw: string): string => {
    if (raw.includes('Invalid login credentials') || raw.includes('invalid credentials'))
      return 'Invalid email or password.';
    if (raw.includes('Email not confirmed'))
      return 'Please confirm your email address first.';
    if (raw.includes('rate limit'))
      return 'Too many attempts. Please try again later.';
    if (raw.includes('Invalid email format'))
      return 'Please enter a valid email address.';
    if (raw.includes('Password must be at least'))
      return 'Password must be at least 6 characters.';
    return `Login failed: ${raw}`;
  };

  const styles = StyleSheet.create({
    modalHandle: {
      width: 40, height: 4, borderRadius: 2,
      backgroundColor: colors.backgroundQuaternary,
      alignSelf: 'center', marginBottom: 24,
    },
    modalTitle: {
      fontSize: 28, fontFamily: FontFamily.bold,
      color: colors.textPrimary, textAlign: 'center', marginBottom: 28,
    },
    input: {
      height: 52, backgroundColor: colors.backgroundSecondary,
      borderRadius: 50, paddingHorizontal: 20,
      fontSize: FontSize.md, fontFamily: FontFamily.regular,
      color: colors.textPrimary, marginBottom: 12,
    },
    button: {
      height: 56,
      backgroundColor: isLoading ? colors.systemGreen + '80' : colors.systemGreen,
      borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginTop: 8,
    },
    buttonText: {
      fontSize: FontSize.md, fontFamily: FontFamily.semiBold,
      color: colors.primaryWhite, letterSpacing: 1,
    },
    switchText: {
      fontSize: FontSize.sm, fontFamily: FontFamily.regular,
      color: colors.textSecondary, textAlign: 'center', marginTop: 20,
    },
    switchLink: { color: colors.systemGreen, fontFamily: FontFamily.semiBold },
  });

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={{ paddingHorizontal: 24, paddingBottom: 48, paddingTop: 12 }}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Login</Text>
          <TextInput
            style={styles.input} placeholder="Email"
            placeholderTextColor={colors.textTertiary}
            value={email} onChangeText={setEmail}
            keyboardType="email-address" autoCapitalize="none" editable={!isLoading}
          />
          <TextInput
            style={styles.input} placeholder="Password"
            placeholderTextColor={colors.textTertiary}
            value={password} onChangeText={setPassword}
            secureTextEntry editable={!isLoading}
          />
          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
            {isLoading
              ? <ActivityIndicator color={colors.primaryWhite} />
              : <Text style={styles.buttonText}>LOGIN</Text>
            }
          </TouchableOpacity>
          <Text style={styles.switchText}>
            Not a member?{' '}
            <Text style={styles.switchLink} onPress={onSwitchToSignup}>Register Now</Text>
          </Text>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}