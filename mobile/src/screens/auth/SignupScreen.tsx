import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

export default function SignupScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { signUp } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validate = (): string | null => {
    if (!displayName.trim()) return 'Display name is required';
    if (!email.trim()) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) return 'Invalid email format';
    if (password.length < 6) return 'Password must be at least 6 characters';
    if (password !== confirmPassword) return 'Passwords do not match';
    return null;
  };

  const handleSignUp = async () => {
    setError('');
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    try {
      await signUp(email.trim(), password, displayName.trim());
      navigation.goBack();
    } catch (err: any) {
      setError(err?.message ?? 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const styles = makeStyles(colors);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Back button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Branding */}
          <View style={styles.brandingContainer}>
            <Ionicons name="shield" size={48} color={colors.accentGold} />
            <Text style={[styles.brandTitle, { color: colors.accentGold }]}>WARCASTER</Text>
            <Text style={[styles.brandSubtitle, { color: colors.textSecondary }]}>Create your account</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { backgroundColor: colors.bgCard, borderColor: colors.borderColor, color: colors.textPrimary }]}
                placeholder="Display Name"
                placeholderTextColor={colors.textSecondary}
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
                textContentType="name"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { backgroundColor: colors.bgCard, borderColor: colors.borderColor, color: colors.textPrimary }]}
                placeholder="Email"
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { backgroundColor: colors.bgCard, borderColor: colors.borderColor, color: colors.textPrimary }]}
                placeholder="Password (6+ characters)"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                textContentType="newPassword"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { backgroundColor: colors.bgCard, borderColor: colors.borderColor, color: colors.textPrimary }]}
                placeholder="Confirm Password"
                placeholderTextColor={colors.textSecondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                textContentType="newPassword"
              />
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.signUpButton, { backgroundColor: colors.accentGold, opacity: loading ? 0.7 : 1 }]}
              onPress={handleSignUp}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.signUpButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer link */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.footerLink, { color: colors.accentGold }]}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    flex: { flex: 1 },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingVertical: 32,
    },
    backButton: {
      position: 'absolute',
      top: 0,
      left: 0,
      zIndex: 10,
      padding: 4,
    },
    brandingContainer: {
      alignItems: 'center',
      marginBottom: 40,
    },
    brandTitle: {
      fontSize: 28,
      fontWeight: '800',
      letterSpacing: 4,
      marginTop: 12,
    },
    brandSubtitle: {
      fontSize: 14,
      marginTop: 8,
    },
    form: {
      gap: 16,
    },
    inputContainer: {
      position: 'relative',
    },
    inputIcon: {
      position: 'absolute',
      left: 14,
      top: 14,
      zIndex: 1,
    },
    input: {
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 44,
      paddingVertical: 14,
      fontSize: 16,
    },
    eyeButton: {
      position: 'absolute',
      right: 14,
      top: 14,
    },
    errorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 4,
    },
    errorText: {
      fontSize: 13,
      flex: 1,
    },
    signUpButton: {
      borderRadius: 8,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
    },
    signUpButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 1,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 24,
    },
    footerText: {
      fontSize: 14,
    },
    footerLink: {
      fontSize: 14,
      fontWeight: '600',
    },
  });
}
