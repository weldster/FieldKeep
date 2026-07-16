import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/app/integrations/supabase/client';
import { getColors } from '@/constants/Colors';

WebBrowser.maybeCompleteAuthSession();

type Mode = 'signin' | 'signup';

export default function AuthScreen() {
  const dark = useColorScheme() === 'dark';
  const C = getColors(dark);
  const router = useRouter();

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignIn = mode === 'signin';
  const modeLabel = isSignIn ? 'Sign In' : 'Create Account';
  const toggleLabel = isSignIn ? "Don't have an account? Sign up" : 'Already have an account? Sign in';

  const handleEmailAuth = async () => {
    console.log('[Auth] Email auth button pressed, mode:', mode, 'email:', email);
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (isSignIn) {
        console.log('[Auth] Signing in with email/password');
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (signInError) throw signInError;
        console.log('[Auth] Email sign-in successful');
      } else {
        console.log('[Auth] Signing up with email/password');
        const { error: signUpError } = await supabase.auth.signUp({ email: email.trim(), password });
        if (signUpError) throw signUpError;
        console.log('[Auth] Email sign-up successful');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      console.error('[Auth] Email auth error:', message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    console.log('[Auth] Apple sign-in button pressed');
    setAppleLoading(true);
    setError(null);
    try {
      if (Platform.OS === 'ios') {
        // Native Apple Sign In on iOS
        const AppleAuthentication = await import('expo-apple-authentication');
        const credential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
        });
        console.log('[Auth] Apple native credential received');
        if (!credential.identityToken) throw new Error('No identity token from Apple');
        const { error: idTokenError } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
        });
        if (idTokenError) throw idTokenError;
        console.log('[Auth] Apple sign-in with ID token successful');
      } else {
        // OAuth fallback for Android/web
        const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
          provider: 'apple',
          options: {
            redirectTo: 'fieldkeep://auth-callback',
            skipBrowserRedirect: true,
          },
        });
        if (oauthError) throw oauthError;
        if (!data.url) throw new Error('No OAuth URL returned');

        console.log('[Auth] Opening Apple OAuth browser session');
        const result = await WebBrowser.openAuthSessionAsync(data.url, 'fieldkeep://auth-callback');
        console.log('[Auth] Apple OAuth browser result:', result.type);

        if (result.type === 'success' && result.url) {
          const url = new URL(result.url);
          const accessToken = url.searchParams.get('access_token') ?? url.hash.match(/access_token=([^&]+)/)?.[1];
          const refreshToken = url.searchParams.get('refresh_token') ?? url.hash.match(/refresh_token=([^&]+)/)?.[1];
          if (accessToken && refreshToken) {
            console.log('[Auth] Setting session from Apple OAuth tokens');
            await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          }
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Apple sign-in failed';
      // Ignore user cancellation
      if (message.includes('canceled') || message.includes('ERR_CANCELED')) {
        console.log('[Auth] Apple sign-in cancelled by user');
        setAppleLoading(false);
        return;
      }
      console.error('[Auth] Apple sign-in error:', message);
      setError(message);
    } finally {
      setAppleLoading(false);
    }
  };

  const handleToggleMode = () => {
    console.log('[Auth] Toggle mode pressed, switching to:', isSignIn ? 'signup' : 'signin');
    setMode(isSignIn ? 'signup' : 'signin');
    setError(null);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: C.background }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero / Logo Area */}
        <View
          style={{
            backgroundColor: '#1B3A5C',
            paddingTop: 80,
            paddingBottom: 48,
            alignItems: 'center',
            borderBottomLeftRadius: 32,
            borderBottomRightRadius: 32,
          }}
        >
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 24,
              backgroundColor: 'rgba(249,115,22,0.15)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              borderWidth: 1.5,
              borderColor: 'rgba(249,115,22,0.3)',
            }}
          >
            <MaterialCommunityIcons name="hard-hat" size={44} color="#F97316" />
          </View>
          <Text
            style={{
              fontSize: 32,
              fontWeight: '800',
              color: '#FFFFFF',
              letterSpacing: -0.5,
              marginBottom: 6,
            }}
          >
            FieldKeep
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: 'rgba(255,255,255,0.65)',
              fontWeight: '500',
              letterSpacing: 0.1,
            }}
          >
            Job site compliance, simplified
          </Text>
        </View>

        {/* Form Card */}
        <View style={{ padding: 24, paddingTop: 32 }}>
          <View
            style={{
              backgroundColor: C.surface,
              borderRadius: 20,
              padding: 24,
              borderWidth: 1,
              borderColor: C.border,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 12,
              elevation: 3,
            }}
          >
            <Text
              style={{
                fontSize: 22,
                fontWeight: '800',
                color: C.text,
                marginBottom: 6,
                letterSpacing: -0.3,
              }}
            >
              {isSignIn ? 'Welcome back' : 'Create account'}
            </Text>
            <Text style={{ fontSize: 14, color: C.textSecondary, marginBottom: 24 }}>
              {isSignIn ? 'Sign in to your FieldKeep account' : 'Get started with FieldKeep today'}
            </Text>

            {/* Email Field */}
            <View style={{ marginBottom: 14 }}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: C.textSecondary,
                  marginBottom: 7,
                  textTransform: 'uppercase',
                  letterSpacing: 0.6,
                }}
              >
                Email
              </Text>
              <TextInput
                value={email}
                onChangeText={v => {
                  setEmail(v);
                  if (error) setError(null);
                }}
                placeholder="you@company.com"
                placeholderTextColor={C.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={{
                  backgroundColor: C.surfaceSecondary,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 13,
                  fontSize: 15,
                  color: C.text,
                  borderWidth: 1,
                  borderColor: C.border,
                }}
              />
            </View>

            {/* Password Field */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: C.textSecondary,
                  marginBottom: 7,
                  textTransform: 'uppercase',
                  letterSpacing: 0.6,
                }}
              >
                Password
              </Text>
              <TextInput
                value={password}
                onChangeText={v => {
                  setPassword(v);
                  if (error) setError(null);
                }}
                placeholder="••••••••"
                placeholderTextColor={C.textTertiary}
                secureTextEntry
                style={{
                  backgroundColor: C.surfaceSecondary,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 13,
                  fontSize: 15,
                  color: C.text,
                  borderWidth: 1,
                  borderColor: C.border,
                }}
              />
            </View>

            {/* Error */}
            {error ? (
              <View
                style={{
                  backgroundColor: C.dangerMuted,
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 16,
                }}
              >
                <Text style={{ fontSize: 13, color: C.danger, fontWeight: '500' }}>{error}</Text>
              </View>
            ) : null}

            {/* Primary Button */}
            <TouchableOpacity
              onPress={handleEmailAuth}
              disabled={loading}
              activeOpacity={0.85}
              style={{
                backgroundColor: '#1B3A5C',
                borderRadius: 14,
                paddingVertical: 15,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
                marginBottom: 20,
                opacity: loading ? 0.75 : 1,
                shadowColor: '#1B3A5C',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : null}
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>
                {loading ? (isSignIn ? 'Signing in...' : 'Creating account...') : modeLabel}
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 20,
                gap: 12,
              }}
            >
              <View style={{ flex: 1, height: 1, backgroundColor: C.border }} />
              <Text style={{ fontSize: 13, color: C.textTertiary, fontWeight: '500' }}>
                or continue with
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: C.border }} />
            </View>

            {/* Apple Sign In */}
            <TouchableOpacity
              onPress={handleAppleSignIn}
              disabled={appleLoading}
              activeOpacity={0.85}
              style={{
                backgroundColor: dark ? '#FFFFFF' : '#000000',
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 10,
                opacity: appleLoading ? 0.75 : 1,
              }}
            >
              {appleLoading ? (
                <ActivityIndicator size="small" color={dark ? '#000000' : '#FFFFFF'} />
              ) : (
                <MaterialCommunityIcons name="apple" size={20} color={dark ? '#000000' : '#FFFFFF'} />
              )}
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '600',
                  color: dark ? '#000000' : '#FFFFFF',
                }}
              >
                {appleLoading ? 'Signing in...' : 'Continue with Apple'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Toggle Mode */}
          <TouchableOpacity
            onPress={handleToggleMode}
            activeOpacity={0.7}
            style={{ alignItems: 'center', marginTop: 24, paddingVertical: 8 }}
          >
            <Text style={{ fontSize: 14, color: C.textSecondary }}>
              {toggleLabel}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
