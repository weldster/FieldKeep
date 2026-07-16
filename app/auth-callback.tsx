import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '@/utils/supabase/client';
import { getColors } from '@/constants/Colors';

export default function AuthCallbackScreen() {
  const dark = useColorScheme() === 'dark';
  const C = getColors(dark);
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      console.log('[AuthCallback] Processing OAuth callback');
      try {
        const url = await Linking.getInitialURL();
        if (!url) {
          console.log('[AuthCallback] No initial URL, redirecting to auth');
          router.replace('/auth');
          return;
        }

        console.log('[AuthCallback] Callback URL:', url);

        // Parse tokens from URL hash or query params
        let accessToken: string | null = null;
        let refreshToken: string | null = null;

        // Try hash fragment first (implicit flow)
        const hashMatch = url.match(/#(.+)/);
        if (hashMatch) {
          const params = new URLSearchParams(hashMatch[1]);
          accessToken = params.get('access_token');
          refreshToken = params.get('refresh_token');
        }

        // Fallback to query params
        if (!accessToken) {
          const queryMatch = url.match(/\?(.+)/);
          if (queryMatch) {
            const params = new URLSearchParams(queryMatch[1]);
            accessToken = params.get('access_token');
            refreshToken = params.get('refresh_token');
          }
        }

        if (accessToken && refreshToken) {
          console.log('[AuthCallback] Setting session from OAuth tokens');
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
          console.log('[AuthCallback] Session set successfully, redirecting to tabs');
          router.replace('/(tabs)' as never);
        } else {
          console.log('[AuthCallback] No tokens found in URL, redirecting to auth');
          router.replace('/auth');
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Callback failed';
        console.error('[AuthCallback] Error processing callback:', message);
        router.replace('/auth');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <View style={{ flex: 1, backgroundColor: C.background, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <ActivityIndicator size="large" color={C.primary} />
      <Text style={{ fontSize: 15, color: C.textSecondary, fontWeight: '500' }}>
        Completing sign in...
      </Text>
    </View>
  );
}
