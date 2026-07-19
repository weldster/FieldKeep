import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  useColorScheme,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Briefcase,
  ClipboardCheck,
  Camera,
  Plus,
  AlertCircle,
  RotateCcw,
  ChevronRight,
  MapPin,
} from 'lucide-react-native';
import { supabase } from '@/utils/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { TradeBadge, TradeType } from '@/components/TradeBadge';
import { StatusBadge } from '@/components/StatusBadge';
import { SkeletonLine, SkeletonJobCard } from '@/components/SkeletonLoader';
import { getColors } from '@/constants/Colors';
import type { Job } from '@/components/JobCard';

interface DashboardStats {
  todayJobs: number;
  pendingSignoffs: number;
  photosToday: number;
}

function StatCard({
  icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  bg: string;
}) {
  const dark = useColorScheme() === 'dark';
  const C = getColors(dark);
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: C.surface,
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: C.border,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 8,
        }}
      >
        {icon}
      </View>
      <Text
        style={{
          fontSize: 22,
          fontWeight: '700',
          color: C.text,
          fontVariant: ['tabular-nums'],
        }}
      >
        {value}
      </Text>
      <Text style={{ fontSize: 11, color: C.textSecondary, marginTop: 2, fontWeight: '500' }}>
        {label}
      </Text>
    </View>
  );
}

function ActiveJobCard({ job, index }: { job: Job; index: number }) {
  const dark = useColorScheme() === 'dark';
  const C = getColors(dark);
  const router = useRouter();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 350, delay: index * 80, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: 0, duration: 350, delay: index * 80, useNativeDriver: true }),
    ]).start();
  }, [index, opacity, translateX]);

  const handlePress = () => {
    console.log('[Dashboard] Active job card pressed:', job.id, job.title);
    router.push(`/job/${job.id}`);
  };

  return (
    <Animated.View style={{ opacity, transform: [{ translateX }] }}>
      <AnimatedPressable onPress={handlePress}>
        <View
          style={{
            width: 220,
            backgroundColor: C.surface,
            borderRadius: 14,
            padding: 16,
            marginRight: 12,
            borderWidth: 1,
            borderColor: C.border,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <TradeBadge trade={job.trade_type as TradeType} size="sm" />
            <StatusBadge status={job.status} size="sm" />
          </View>
          <Text
            style={{ fontSize: 15, fontWeight: '600', color: C.text, marginBottom: 4 }}
            numberOfLines={2}
          >
            {job.title}
          </Text>
          <Text style={{ fontSize: 13, color: C.textSecondary, marginBottom: 8 }} numberOfLines={1}>
            {job.client_name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <MapPin size={12} color={C.textTertiary} />
            <Text style={{ fontSize: 12, color: C.textTertiary }} numberOfLines={1}>
              {job.location}
            </Text>
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

function QuickActionButton({
  icon,
  label,
  onPress,
  primary,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  const dark = useColorScheme() === 'dark';
  const C = getColors(dark);

  return (
    <AnimatedPressable onPress={onPress} style={{ flex: 1 }}>
      <View
        style={{
          backgroundColor: primary ? C.primary : C.surface,
          borderRadius: 14,
          padding: 14,
          alignItems: 'center',
          gap: 8,
          borderWidth: 1,
          borderColor: primary ? 'transparent' : C.border,
          boxShadow: primary
            ? '0 2px 8px rgba(27,58,92,0.25)'
            : '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        {icon}
        <Text
          style={{
            fontSize: 12,
            fontWeight: '600',
            color: primary ? '#FFFFFF' : C.text,
            textAlign: 'center',
          }}
        >
          {label}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

export default function DashboardScreen() {
  const dark = useColorScheme() === 'dark';
  const C = getColors(dark);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({ todayJobs: 0, pendingSignoffs: 0, photosToday: 0 });
  const [activeJobs, setActiveJobs] = useState<Job[]>([]);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchData = useCallback(async () => {
    console.log('[Dashboard] Fetching dashboard data');
    try {
      const userId = user?.id;
      if (!userId) throw new Error('Could not get user ID');

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      console.log('[Dashboard] Fetching jobs for user:', userId);
      const [jobsRes, signoffsRes, photosRes] = await Promise.all([
        supabase.from('jobs').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('sign_offs').select('id, job_id, created_at').gte('created_at', todayISO),
        supabase.from('job_photos').select('id, created_at').gte('created_at', todayISO),
      ]);

      if (jobsRes.error) throw jobsRes.error;

      const jobs = (jobsRes.data ?? []) as Job[];
      const todayJobs = jobs.filter(j => new Date(j.created_at) >= today).length;
      const active = jobs.filter(j => j.status === 'in_progress');

      // Count jobs without sign-offs
      const signedJobIds = new Set((signoffsRes.data ?? []).map((s: { job_id: string }) => s.job_id));
      const pendingSignoffs = jobs.filter(j => j.status !== 'completed' && !signedJobIds.has(j.id)).length;

      setStats({
        todayJobs,
        pendingSignoffs,
        photosToday: (photosRes.data ?? []).length,
      });
      setActiveJobs(active);
      setError(null);

      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load dashboard';
      console.error('[Dashboard] Error fetching data:', message);
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fadeAnim, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    console.log('[Dashboard] Pull-to-refresh triggered');
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleNewJob = () => {
    console.log('[Dashboard] New Job button pressed');
    router.push('/job/new');
  };

  const handleSafetyChecklist = () => {
    console.log('[Dashboard] Safety Checklist quick action pressed');
    router.push('/(tabs)/(jobs)');
  };

  const handleLogPhotos = () => {
    console.log('[Dashboard] Log Photos quick action pressed');
    router.push('/(tabs)/(jobs)');
  };

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.primary}
            colors={[C.primary]}
          />
        }
      >
        {/* Header */}
        <View
          style={{
            paddingTop: insets.top + 16,
            paddingHorizontal: 20,
            paddingBottom: 20,
            backgroundColor: C.primary,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
                {dateStr}
              </Text>
              <Text style={{ fontSize: 28, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 }}>
                FieldKeep
              </Text>
              <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                Job Site Compliance
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/account')}
              hitSlop={12}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: 'rgba(255,255,255,0.15)',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 4,
              }}
            >
              <MaterialCommunityIcons name="account" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
          {/* Stats Row */}
          {loading ? (
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 28 }}>
              {[0, 1, 2].map(i => (
                <View key={i} style={{ flex: 1, backgroundColor: C.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border }}>
                  <SkeletonLine width={32} height={32} borderRadius={10} style={{ marginBottom: 8 }} />
                  <SkeletonLine width="60%" height={20} style={{ marginBottom: 6 }} />
                  <SkeletonLine width="80%" height={11} />
                </View>
              ))}
            </View>
          ) : (
            <Animated.View style={{ opacity: fadeAnim, flexDirection: 'row', gap: 10, marginBottom: 28 }}>
              <StatCard
                icon={<Briefcase size={18} color={C.primary} />}
                label="Today's Jobs"
                value={stats.todayJobs}
                color={C.primary}
                bg={C.primaryMuted}
              />
              <StatCard
                icon={<ClipboardCheck size={18} color={C.accent} />}
                label="Pending Sign-offs"
                value={stats.pendingSignoffs}
                color={C.accent}
                bg={C.accentMuted}
              />
              <StatCard
                icon={<Camera size={18} color={C.success} />}
                label="Photos Today"
                value={stats.photosToday}
                color={C.success}
                bg={C.successMuted}
              />
            </Animated.View>
          )}

          {/* Active Jobs */}
          <View style={{ marginBottom: 28 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: C.text, letterSpacing: -0.2 }}>
                Active Jobs
              </Text>
              <AnimatedPressable onPress={() => {
                console.log('[Dashboard] View all jobs pressed');
                router.push('/(tabs)/(jobs)');
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                  <Text style={{ fontSize: 13, color: C.primary, fontWeight: '600' }}>View all</Text>
                  <ChevronRight size={14} color={C.primary} />
                </View>
              </AnimatedPressable>
            </View>

            {loading ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {[0, 1, 2].map(i => (
                  <View key={i} style={{ width: 220, backgroundColor: C.surface, borderRadius: 14, padding: 16, marginRight: 12, borderWidth: 1, borderColor: C.border }}>
                    <SkeletonLine width={60} height={20} borderRadius={6} style={{ marginBottom: 10 }} />
                    <SkeletonLine width="80%" height={15} style={{ marginBottom: 6 }} />
                    <SkeletonLine width="60%" height={13} style={{ marginBottom: 8 }} />
                    <SkeletonLine width="50%" height={12} />
                  </View>
                ))}
              </ScrollView>
            ) : error ? (
              <View style={{ backgroundColor: C.surface, borderRadius: 14, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: C.border }}>
                <AlertCircle size={28} color={C.danger} style={{ marginBottom: 8 }} />
                <Text style={{ fontSize: 15, fontWeight: '600', color: C.text, marginBottom: 4 }}>Couldn't load jobs</Text>
                <Text style={{ fontSize: 13, color: C.textSecondary, textAlign: 'center', marginBottom: 12 }}>
                  {error}
                </Text>
                <AnimatedPressable onPress={() => { console.log('[Dashboard] Retry pressed'); fetchData(); }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.primaryMuted, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 }}>
                    <RotateCcw size={14} color={C.primary} />
                    <Text style={{ fontSize: 13, fontWeight: '600', color: C.primary }}>Try again</Text>
                  </View>
                </AnimatedPressable>
              </View>
            ) : activeJobs.length === 0 ? (
              <View style={{ backgroundColor: C.surface, borderRadius: 14, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: C.border }}>
                <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: C.primaryMuted, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <Briefcase size={28} color={C.primary} />
                </View>
                <Text style={{ fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 6 }}>No active jobs today</Text>
                <Text style={{ fontSize: 14, color: C.textSecondary, textAlign: 'center', marginBottom: 16, maxWidth: 240 }}>
                  Start a new job to track compliance and safety for your crew
                </Text>
                <AnimatedPressable onPress={handleNewJob}>
                  <View style={{ backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>Start a new job</Text>
                  </View>
                </AnimatedPressable>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 4 }}>
                {activeJobs.map((job, i) => (
                  <ActiveJobCard key={job.id} job={job} index={i} />
                ))}
              </ScrollView>
            )}
          </View>

          {/* Quick Actions */}
          <View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: C.text, letterSpacing: -0.2, marginBottom: 14 }}>
              Quick Actions
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <QuickActionButton
                icon={<Plus size={20} color="#FFFFFF" />}
                label="New Job"
                onPress={handleNewJob}
                primary
              />
              <QuickActionButton
                icon={<ClipboardCheck size={20} color={C.primary} />}
                label="Safety Checklist"
                onPress={handleSafetyChecklist}
              />
              <QuickActionButton
                icon={<Camera size={20} color={C.primary} />}
                label="Log Photos"
                onPress={handleLogPhotos}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
