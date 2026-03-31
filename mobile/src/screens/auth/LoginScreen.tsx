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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = async () => {
    setError('');
    if (!email.trim()) { setError('Email is required'); return; }
    if (!password) { setError('Password is required'); return; }

    setLoading(true);
    try {
      await signIn(email.trim(), password);
      navigation.goBack();
    } catch (err: any) {
      setError(err?.message ?? 'Sign in failed. Please try again.');
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
        <View style={styles.inner}>
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
            <Text style={[styles.brandSubtitle, { color: colors.textSecondary }]}>Sign in to access the Market</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
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
                placeholder="Password"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                textContentType="password"
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

            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.signInButton, { backgroundColor: colors.accentGold, opacity: loading ? 0.7 : 1 }]}
              onPress={handleSignIn}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.signInButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer link */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={[styles.footerLink, { color: colors.accentGold }]}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    flex: { flex: 1 },
    inner: {
      flex: 1,
      paddingHorizontal: 24,
      justifyContent: 'center',
    },
    backButton: {
      position: 'absolute',
      top: 16,
      left: 24,
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
    signInButton: {
      borderRadius: 8,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
    },
    signInButtonText: {
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
