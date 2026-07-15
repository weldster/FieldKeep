import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  RefreshControl,
  TextInput,
  useColorScheme,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Search, Briefcase, AlertCircle, RotateCcw, X } from 'lucide-react-native';
import { supabase } from '@/app/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { JobCard, Job } from '@/components/JobCard';
import { SkeletonJobCard } from '@/components/SkeletonLoader';
import { getColors } from '@/constants/Colors';

type FilterStatus = 'all' | 'pending' | 'in_progress' | 'completed';

const FILTERS: { key: FilterStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
];

export default function JobsScreen() {
  const dark = useColorScheme() === 'dark';
  const C = getColors(dark);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterStatus>('all');

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchJobs = useCallback(async () => {
    console.log('[Jobs] Fetching jobs list');
    try {
      const userId = user?.id;
      if (!userId) throw new Error('Could not get user ID');

      console.log('[Jobs] Querying jobs for user:', userId);
      const { data, error: fetchError } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setJobs((data ?? []) as Job[]);
      setError(null);
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load jobs';
      console.error('[Jobs] Error fetching jobs:', message);
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fadeAnim, user]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const onRefresh = useCallback(() => {
    console.log('[Jobs] Pull-to-refresh triggered');
    setRefreshing(true);
    fetchJobs();
  }, [fetchJobs]);

  const filteredJobs = jobs.filter(job => {
    const matchesFilter = filter === 'all' || job.status === filter;
    const searchLower = search.toLowerCase();
    const matchesSearch =
      !search ||
      job.title.toLowerCase().includes(searchLower) ||
      job.client_name.toLowerCase().includes(searchLower) ||
      job.location.toLowerCase().includes(searchLower) ||
      job.trade_type.toLowerCase().includes(searchLower);
    return matchesFilter && matchesSearch;
  });

  const handleNewJob = () => {
    console.log('[Jobs] New Job FAB pressed');
    router.push('/job/new');
  };

  const handleFilterChange = (f: FilterStatus) => {
    console.log('[Jobs] Filter changed to:', f);
    setFilter(f);
  };

  const handleSearchChange = (text: string) => {
    console.log('[Jobs] Search query changed:', text);
    setSearch(text);
  };

  const handleClearSearch = () => {
    console.log('[Jobs] Search cleared');
    setSearch('');
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
        <Text style={{ fontSize: 24, fontWeight: '800', color: C.text, letterSpacing: -0.3, marginBottom: 14 }}>
          Jobs
        </Text>

        {/* Search */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: C.surfaceSecondary,
            borderRadius: 12,
            paddingHorizontal: 12,
            height: 44,
            gap: 8,
            marginBottom: 14,
          }}
        >
          <Search size={18} color={C.textTertiary} />
          <TextInput
            value={search}
            onChangeText={handleSearchChange}
            placeholder="Search jobs, clients, locations..."
            placeholderTextColor={C.textTertiary}
            style={{ flex: 1, fontSize: 15, color: C.text }}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <AnimatedPressable onPress={handleClearSearch}>
              <X size={16} color={C.textTertiary} />
            </AnimatedPressable>
          )}
        </View>

        {/* Filter Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {FILTERS.map(f => {
            const isActive = filter === f.key;
            return (
              <AnimatedPressable key={f.key} onPress={() => handleFilterChange(f.key)}>
                <View
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: 20,
                    backgroundColor: isActive ? C.primary : C.surfaceSecondary,
                    borderWidth: 1,
                    borderColor: isActive ? 'transparent' : C.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: isActive ? '#FFFFFF' : C.textSecondary,
                    }}
                  >
                    {f.label}
                  </Text>
                </View>
              </AnimatedPressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Content */}
      {loading ? (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
          {[0, 1, 2, 3].map(i => <SkeletonJobCard key={i} />)}
        </ScrollView>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <AlertCircle size={40} color={C.danger} style={{ marginBottom: 12 }} />
          <Text style={{ fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 6 }}>
            Couldn't load jobs
          </Text>
          <Text style={{ fontSize: 14, color: C.textSecondary, textAlign: 'center', marginBottom: 20 }}>
            {error}
          </Text>
          <AnimatedPressable onPress={() => { console.log('[Jobs] Retry pressed'); fetchJobs(); }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.primaryMuted, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10 }}>
              <RotateCcw size={15} color={C.primary} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: C.primary }}>Try again</Text>
            </View>
          </AnimatedPressable>
        </View>
      ) : (
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <FlatList
            data={filteredJobs}
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
            renderItem={({ item, index }) => <JobCard job={item} index={index} />}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingTop: 60 }}>
                <View style={{ width: 72, height: 72, borderRadius: 22, backgroundColor: C.primaryMuted, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Briefcase size={32} color={C.primary} />
                </View>
                <Text style={{ fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 8 }}>
                  {search ? 'No jobs found' : 'No jobs yet'}
                </Text>
                <Text style={{ fontSize: 14, color: C.textSecondary, textAlign: 'center', maxWidth: 260, marginBottom: 20 }}>
                  {search
                    ? `No jobs match "${search}"`
                    : 'Create your first job to start tracking compliance and safety'}
                </Text>
                {!search && (
                  <AnimatedPressable onPress={handleNewJob}>
                    <View style={{ backgroundColor: C.primary, borderRadius: 12, paddingHorizontal: 22, paddingVertical: 12 }}>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>Create first job</Text>
                    </View>
                  </AnimatedPressable>
                )}
              </View>
            }
          />
        </Animated.View>
      )}

      {/* FAB */}
      <AnimatedPressable
        onPress={handleNewJob}
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
    </View>
  );
}
