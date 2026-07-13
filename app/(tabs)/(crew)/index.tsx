import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TextInput,
  Modal,
  ScrollView,
  useColorScheme,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Users, AlertCircle, RotateCcw, X, ChevronDown } from 'lucide-react-native';
import { supabase } from '@/app/integrations/supabase/client';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { SkeletonCrewCard } from '@/components/SkeletonLoader';
import { getColors } from '@/constants/Colors';

interface CrewMember {
  id: string;
  name: string;
  role: string;
  email: string;
  user_id: string;
  created_at: string;
}

const ROLES = ['Foreman', 'Technician', 'Apprentice', 'Safety Officer', 'Other'];

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  Foreman: { bg: 'rgba(27,58,92,0.12)', color: '#1B3A5C' },
  Technician: { bg: 'rgba(124,58,237,0.12)', color: '#7C3AED' },
  Apprentice: { bg: 'rgba(22,163,74,0.12)', color: '#16A34A' },
  'Safety Officer': { bg: 'rgba(220,38,38,0.10)', color: '#DC2626' },
  Other: { bg: 'rgba(71,85,105,0.12)', color: '#475569' },
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function CrewMemberCard({ member, index }: { member: CrewMember; index: number }) {
  const dark = useColorScheme() === 'dark';
  const C = getColors(dark);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 350, delay: index * 60, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 350, delay: index * 60, useNativeDriver: true }),
    ]).start();
  }, [index, opacity, translateY]);

  const roleStyle = ROLE_COLORS[member.role] ?? ROLE_COLORS.Other;
  const initials = getInitials(member.name);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <View
        style={{
          backgroundColor: C.surface,
          borderRadius: 14,
          padding: 16,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: C.border,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <View
          style={{
            width: 46,
            height: 46,
            borderRadius: 23,
            backgroundColor: C.primaryMuted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: C.primary }}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: C.text, marginBottom: 3 }} numberOfLines={1}>
            {member.name}
          </Text>
          <Text style={{ fontSize: 13, color: C.textSecondary, marginBottom: 6 }} numberOfLines={1}>
            {member.email}
          </Text>
          <View
            style={{
              backgroundColor: roleStyle.bg,
              borderRadius: 6,
              paddingHorizontal: 8,
              paddingVertical: 3,
              alignSelf: 'flex-start',
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '600', color: roleStyle.color, letterSpacing: 0.3 }}>
              {member.role}
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

export default function CrewScreen() {
  const dark = useColorScheme() === 'dark';
  const C = getColors(dark);
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [role, setRole] = useState('Technician');
  const [email, setEmail] = useState('');
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchCrew = useCallback(async () => {
    console.log('[Crew] Fetching crew members');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      let userId = session?.user?.id;

      if (!userId) {
        console.log('[Crew] No session, signing in anonymously');
        const { data, error: anonError } = await supabase.auth.signInAnonymously();
        if (anonError) throw anonError;
        userId = data.user?.id;
      }

      if (!userId) throw new Error('Could not get user ID');

      console.log('[Crew] Querying crew_members for user:', userId);
      const { data, error: fetchError } = await supabase
        .from('crew_members')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setCrew((data ?? []) as CrewMember[]);
      setError(null);
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load crew';
      console.error('[Crew] Error fetching crew:', message);
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fadeAnim]);

  useEffect(() => {
    fetchCrew();
  }, [fetchCrew]);

  const onRefresh = useCallback(() => {
    console.log('[Crew] Pull-to-refresh triggered');
    setRefreshing(true);
    fetchCrew();
  }, [fetchCrew]);

  const handleOpenModal = () => {
    console.log('[Crew] Add crew member FAB pressed');
    setName('');
    setRole('Technician');
    setEmail('');
    setFormError(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    console.log('[Crew] Add crew modal closed');
    setShowModal(false);
  };

  const handleSaveCrew = async () => {
    console.log('[Crew] Save crew member pressed:', { name, role, email });
    if (!name.trim()) {
      setFormError('Name is required');
      return;
    }
    if (!email.trim()) {
      setFormError('Email is required');
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error('Not authenticated');

      console.log('[Crew] Inserting crew member into Supabase');
      const { error: insertError } = await supabase.from('crew_members').insert({
        name: name.trim(),
        role,
        email: email.trim(),
        user_id: userId,
      });

      if (insertError) throw insertError;

      console.log('[Crew] Crew member saved successfully');
      setShowModal(false);
      fetchCrew();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save crew member';
      console.error('[Crew] Error saving crew member:', message);
      setFormError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 20,
          paddingBottom: 16,
          backgroundColor: C.surface,
          borderBottomWidth: 1,
          borderBottomColor: C.border,
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: '800', color: C.text, letterSpacing: -0.3 }}>
          Crew
        </Text>
        <Text style={{ fontSize: 14, color: C.textSecondary, marginTop: 2 }}>
          {crew.length} {crew.length === 1 ? 'member' : 'members'}
        </Text>
      </View>

      {/* Content */}
      {loading ? (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
          {[0, 1, 2, 3].map(i => <SkeletonCrewCard key={i} />)}
        </ScrollView>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <AlertCircle size={40} color={C.danger} style={{ marginBottom: 12 }} />
          <Text style={{ fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 6 }}>
            Couldn't load crew
          </Text>
          <Text style={{ fontSize: 14, color: C.textSecondary, textAlign: 'center', marginBottom: 20 }}>
            {error}
          </Text>
          <AnimatedPressable onPress={() => { console.log('[Crew] Retry pressed'); fetchCrew(); }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.primaryMuted, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10 }}>
              <RotateCcw size={15} color={C.primary} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: C.primary }}>Try again</Text>
            </View>
          </AnimatedPressable>
        </View>
      ) : (
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <FlatList
            data={crew}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
            contentInsetAdjustmentBehavior="automatic"
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={C.primary}
                colors={[C.primary]}
              />
            }
            renderItem={({ item, index }) => <CrewMemberCard member={item} index={index} />}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingTop: 60 }}>
                <View style={{ width: 72, height: 72, borderRadius: 22, backgroundColor: C.primaryMuted, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Users size={32} color={C.primary} />
                </View>
                <Text style={{ fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 8 }}>
                  No crew members yet
                </Text>
                <Text style={{ fontSize: 14, color: C.textSecondary, textAlign: 'center', maxWidth: 260, marginBottom: 20 }}>
                  Add your crew to track who's on each job site
                </Text>
                <AnimatedPressable onPress={handleOpenModal}>
                  <View style={{ backgroundColor: C.primary, borderRadius: 12, paddingHorizontal: 22, paddingVertical: 12 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>Add first crew member</Text>
                  </View>
                </AnimatedPressable>
              </View>
            }
          />
        </Animated.View>
      )}

      {/* FAB */}
      <AnimatedPressable
        onPress={handleOpenModal}
        style={{
          position: 'absolute',
          bottom: insets.bottom + 90,
          right: 20,
        }}
      >
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: C.accent,
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(249,115,22,0.4)',
          }}
        >
          <Plus size={24} color="#FFFFFF" />
        </View>
      </AnimatedPressable>

      {/* Add Crew Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={handleCloseModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={{ flex: 1, backgroundColor: C.background }}>
            {/* Modal Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 20,
                paddingTop: 20,
                paddingBottom: 16,
                borderBottomWidth: 1,
                borderBottomColor: C.border,
                backgroundColor: C.surface,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '700', color: C.text }}>Add Crew Member</Text>
              <AnimatedPressable onPress={handleCloseModal}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: C.surfaceSecondary, alignItems: 'center', justifyContent: 'center' }}>
                  <X size={16} color={C.textSecondary} />
                </View>
              </AnimatedPressable>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
              {/* Name */}
              <View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: C.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Full Name *
                </Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. John Smith"
                  placeholderTextColor={C.textTertiary}
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
                  autoCapitalize="words"
                />
              </View>

              {/* Role */}
              <View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: C.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Role
                </Text>
                <AnimatedPressable onPress={() => {
                  console.log('[Crew] Role picker toggled');
                  setShowRolePicker(!showRolePicker);
                }}>
                  <View
                    style={{
                      backgroundColor: C.surfaceSecondary,
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 13,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderWidth: 1,
                      borderColor: C.border,
                    }}
                  >
                    <Text style={{ fontSize: 15, color: C.text }}>{role}</Text>
                    <ChevronDown size={18} color={C.textTertiary} />
                  </View>
                </AnimatedPressable>
                {showRolePicker && (
                  <View
                    style={{
                      backgroundColor: C.surface,
                      borderRadius: 12,
                      marginTop: 4,
                      borderWidth: 1,
                      borderColor: C.border,
                      overflow: 'hidden',
                    }}
                  >
                    {ROLES.map((r, i) => (
                      <AnimatedPressable
                        key={r}
                        onPress={() => {
                          console.log('[Crew] Role selected:', r);
                          setRole(r);
                          setShowRolePicker(false);
                        }}
                      >
                        <View
                          style={{
                            paddingHorizontal: 14,
                            paddingVertical: 13,
                            backgroundColor: role === r ? C.primaryMuted : 'transparent',
                            borderBottomWidth: i < ROLES.length - 1 ? 1 : 0,
                            borderBottomColor: C.divider,
                          }}
                        >
                          <Text style={{ fontSize: 15, color: role === r ? C.primary : C.text, fontWeight: role === r ? '600' : '400' }}>
                            {r}
                          </Text>
                        </View>
                      </AnimatedPressable>
                    ))}
                  </View>
                )}
              </View>

              {/* Email */}
              <View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: C.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Email *
                </Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="e.g. john@company.com"
                  placeholderTextColor={C.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
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

              {formError && (
                <View style={{ backgroundColor: C.dangerMuted, borderRadius: 10, padding: 12 }}>
                  <Text style={{ fontSize: 13, color: C.danger, fontWeight: '500' }}>{formError}</Text>
                </View>
              )}

              <AnimatedPressable onPress={handleSaveCrew} disabled={saving}>
                <View
                  style={{
                    backgroundColor: C.primary,
                    borderRadius: 14,
                    paddingVertical: 15,
                    alignItems: 'center',
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>
                    {saving ? 'Adding...' : 'Add crew member'}
                  </Text>
                </View>
              </AnimatedPressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
