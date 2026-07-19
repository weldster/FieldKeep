import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '@/utils/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getColors } from '@/constants/Colors';

export default function AccountScreen() {
  const dark = useColorScheme() === 'dark';
  const C = getColors(dark);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();

  const [signingOut, setSigningOut] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      router.replace('/auth');
    } catch {
      setSigningOut(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data (jobs, photos, sign-offs, crew). This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete My Account',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      const userId = user?.id;
      if (!userId) throw new Error('No user session');

      // Delete user data in order (child tables first)
      await supabase.from('job_photos').delete().eq('user_id', userId);
      await supabase.from('sign_offs').delete().eq('user_id', userId);
      await supabase.from('checklist_items').delete().eq('user_id', userId);
      await supabase.from('crew_members').delete().eq('user_id', userId);
      await supabase.from('jobs').delete().eq('user_id', userId);

      // Sign out — the backend will handle auth.users cleanup via RLS/trigger
      await signOut();
      router.replace('/auth');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete account';
      Alert.alert('Error', message);
      setDeleting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingBottom: 16,
          paddingHorizontal: 20,
          backgroundColor: C.primary,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#FFFFFF', flex: 1 }}>
          Account
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        {/* User info */}
        <View
          style={{
            backgroundColor: C.surface,
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: C.border,
            marginBottom: 24,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: C.primaryMuted,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialCommunityIcons name="account" size={26} color={C.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: C.text }}>
              {user?.email ?? 'Unknown'}
            </Text>
            <Text style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>
              Signed in
            </Text>
          </View>
        </View>

        {/* Sign Out */}
        <View
          style={{
            backgroundColor: C.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: C.border,
            marginBottom: 16,
            overflow: 'hidden',
          }}
        >
          <TouchableOpacity
            onPress={handleSignOut}
            disabled={signingOut || deleting}
            activeOpacity={0.75}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 18,
              gap: 14,
            }}
          >
            {signingOut ? (
              <ActivityIndicator size="small" color={C.primary} />
            ) : (
              <MaterialCommunityIcons name="logout" size={22} color={C.primary} />
            )}
            <Text style={{ fontSize: 16, fontWeight: '600', color: C.primary, flex: 1 }}>
              {signingOut ? 'Signing out…' : 'Sign Out'}
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={C.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Delete Account */}
        <View
          style={{
            backgroundColor: C.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: C.border,
            overflow: 'hidden',
          }}
        >
          <TouchableOpacity
            onPress={handleDeleteAccount}
            disabled={deleting || signingOut}
            activeOpacity={0.75}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 18,
              gap: 14,
            }}
          >
            {deleting ? (
              <ActivityIndicator size="small" color={C.danger} />
            ) : (
              <MaterialCommunityIcons name="delete-forever" size={22} color={C.danger} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: C.danger }}>
                {deleting ? 'Deleting account…' : 'Delete Account'}
              </Text>
              <Text style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>
                Permanently removes your account and all data
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={C.textTertiary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
