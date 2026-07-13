import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  ClipboardCheck,
  Camera,
  PenLine,
  ChevronRight,
  MapPin,
  User,
  Wrench,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
  Clock,
  Circle,
} from 'lucide-react-native';
import { supabase } from '@/app/integrations/supabase/client';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { StatusBadge } from '@/components/StatusBadge';
import { TradeBadge, TradeType } from '@/components/TradeBadge';
import { SkeletonLine } from '@/components/SkeletonLoader';
import { getColors } from '@/constants/Colors';
import type { Job } from '@/components/JobCard';

interface ChecklistStats {
  total: number;
  checked: number;
}

interface PhotoStats {
  before: number;
  after: number;
}

interface SignOffStats {
  count: number;
}

function ActionCard({
  icon,
  title,
  subtitle,
  onPress,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
  accent?: boolean;
}) {
  const dark = useColorScheme() === 'dark';
  const C = getColors(dark);

  return (
    <AnimatedPressable onPress={onPress}>
      <View
        style={{
          backgroundColor: C.surface,
          borderRadius: 14,
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          borderWidth: 1,
          borderColor: accent ? C.primary : C.border,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: accent ? C.primaryMuted : C.surfaceSecondary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: C.text, marginBottom: 2 }}>{title}</Text>
          <Text style={{ fontSize: 13, color: C.textSecondary }}>{subtitle}</Text>
        </View>
        <ChevronRight size={18} color={C.textTertiary} />
      </View>
    </AnimatedPressable>
  );
}

const STATUS_ORDER: Job['status'][] = ['pending', 'in_progress', 'completed'];

function getNextStatus(current: Job['status']): Job['status'] | null {
  const idx = STATUS_ORDER.indexOf(current);
  if (idx < STATUS_ORDER.length - 1) return STATUS_ORDER[idx + 1];
  return null;
}

const STATUS_BUTTON_LABELS: Record<string, string> = {
  pending: 'Mark as In Progress',
  in_progress: 'Mark as Completed',
  completed: 'Job Completed',
};

export default function JobDetailScreen() {
  const dark = useColorScheme() === 'dark';
  const C = getColors(dark);
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [checklistStats, setChecklistStats] = useState<ChecklistStats>({ total: 0, checked: 0 });
  const [photoStats, setPhotoStats] = useState<PhotoStats>({ before: 0, after: 0 });
  const [signOffStats, setSignOffStats] = useState<SignOffStats>({ count: 0 });
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchJob = useCallback(async () => {
    console.log('[JobDetail] Fetching job details for id:', id);
    if (!id) return;
    try {
      const [jobRes, checklistRes, photosRes, signoffsRes] = await Promise.all([
        supabase.from('jobs').select('*').eq('id', id).single(),
        supabase.from('checklist_items').select('id, is_checked').eq('job_id', id),
        supabase.from('job_photos').select('id, photo_type').eq('job_id', id),
        supabase.from('sign_offs').select('id').eq('job_id', id),
      ]);

      if (jobRes.error) throw jobRes.error;

      setJob(jobRes.data as Job);

      const items = checklistRes.data ?? [];
      setChecklistStats({
        total: items.length,
        checked: items.filter((i: { is_checked: boolean }) => i.is_checked).length,
      });

      const photos = photosRes.data ?? [];
      setPhotoStats({
        before: photos.filter((p: { photo_type: string }) => p.photo_type === 'before').length,
        after: photos.filter((p: { photo_type: string }) => p.photo_type === 'after').length,
      });

      setSignOffStats({ count: (signoffsRes.data ?? []).length });
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load job';
      console.error('[JobDetail] Error fetching job:', message);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  const handleStatusUpdate = async () => {
    if (!job) return;
    const nextStatus = getNextStatus(job.status);
    if (!nextStatus) return;

    console.log('[JobDetail] Status update pressed:', job.status, '->', nextStatus);
    setUpdatingStatus(true);
    try {
      const { error: updateError } = await supabase
        .from('jobs')
        .update({ status: nextStatus })
        .eq('id', job.id);

      if (updateError) throw updateError;

      console.log('[JobDetail] Status updated successfully to:', nextStatus);
      setJob(prev => prev ? { ...prev, status: nextStatus } : prev);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update status';
      console.error('[JobDetail] Error updating status:', message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleChecklist = () => {
    console.log('[JobDetail] Safety Checklist card pressed for job:', id);
    router.push(`/checklist/${id}`);
  };

  const handlePhotos = () => {
    console.log('[JobDetail] Photo Log card pressed for job:', id);
    router.push(`/photos/${id}`);
  };

  const handleSignOff = () => {
    console.log('[JobDetail] Sign-Off card pressed for job:', id);
    router.push(`/signoff/${id}`);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.background }}>
        <Stack.Screen options={{ title: 'Job Detail' }} />
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
          <SkeletonLine width="70%" height={24} style={{ marginBottom: 8 }} />
          <SkeletonLine width="40%" height={16} style={{ marginBottom: 4 }} />
          <SkeletonLine width="55%" height={16} style={{ marginBottom: 4 }} />
          <SkeletonLine width="45%" height={16} style={{ marginBottom: 24 }} />
          {[0, 1, 2].map(i => (
            <View key={i} style={{ backgroundColor: C.surface, borderRadius: 14, padding: 16, flexDirection: 'row', gap: 14, borderWidth: 1, borderColor: C.border }}>
              <SkeletonLine width={44} height={44} borderRadius={12} />
              <View style={{ flex: 1, gap: 8 }}>
                <SkeletonLine width="50%" height={15} />
                <SkeletonLine width="70%" height={13} />
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  if (error || !job) {
    return (
      <View style={{ flex: 1, backgroundColor: C.background, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Stack.Screen options={{ title: 'Job Detail' }} />
        <AlertCircle size={40} color={C.danger} style={{ marginBottom: 12 }} />
        <Text style={{ fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 6 }}>Couldn't load job</Text>
        <Text style={{ fontSize: 14, color: C.textSecondary, textAlign: 'center', marginBottom: 20 }}>{error}</Text>
        <AnimatedPressable onPress={() => { console.log('[JobDetail] Retry pressed'); fetchJob(); }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.primaryMuted, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10 }}>
            <RotateCcw size={15} color={C.primary} />
            <Text style={{ fontSize: 14, fontWeight: '600', color: C.primary }}>Try again</Text>
          </View>
        </AnimatedPressable>
      </View>
    );
  }

  const nextStatus = getNextStatus(job.status);
  const statusButtonLabel = STATUS_BUTTON_LABELS[job.status] ?? 'Completed';
  const checklistSubtitle = checklistStats.total === 0
    ? 'No items yet — tap to set up'
    : `${checklistStats.checked}/${checklistStats.total} items checked`;
  const checklistDone = checklistStats.total > 0 && checklistStats.checked === checklistStats.total;
  const photoSubtitle = `${photoStats.before} before, ${photoStats.after} after`;
  const signOffSubtitle = signOffStats.count === 0 ? 'Not signed off yet' : `${signOffStats.count} signature${signOffStats.count > 1 ? 's' : ''} collected`;

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <Stack.Screen options={{ title: job.title }} />
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Job Header Card */}
        <View
          style={{
            backgroundColor: C.surface,
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: C.border,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
          }}
        >
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            <TradeBadge trade={job.trade_type as TradeType} />
            <StatusBadge status={job.status} />
          </View>

          <Text style={{ fontSize: 22, fontWeight: '800', color: C.text, letterSpacing: -0.3, marginBottom: 14 }}>
            {job.title}
          </Text>

          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <User size={15} color={C.textTertiary} />
              <Text style={{ fontSize: 14, color: C.textSecondary }}>{job.client_name}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MapPin size={15} color={C.textTertiary} />
              <Text style={{ fontSize: 14, color: C.textSecondary }}>{job.location}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Wrench size={15} color={C.textTertiary} />
              <Text style={{ fontSize: 14, color: C.textSecondary, textTransform: 'capitalize' }}>{job.trade_type}</Text>
            </View>
          </View>
        </View>

        {/* Status Update */}
        {nextStatus && (
          <AnimatedPressable onPress={handleStatusUpdate} disabled={updatingStatus} style={{ marginBottom: 20 }}>
            <View
              style={{
                backgroundColor: job.status === 'pending' ? C.accentMuted : C.successMuted,
                borderRadius: 14,
                paddingVertical: 15,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
                borderWidth: 1,
                borderColor: job.status === 'pending' ? C.accent : C.success,
              }}
            >
              {updatingStatus ? (
                <ActivityIndicator size="small" color={job.status === 'pending' ? C.accent : C.success} />
              ) : (
                <>
                  {job.status === 'pending' ? (
                    <Clock size={18} color={C.accent} />
                  ) : (
                    <CheckCircle2 size={18} color={C.success} />
                  )}
                  <Text style={{ fontSize: 15, fontWeight: '700', color: job.status === 'pending' ? C.accent : C.success }}>
                    {statusButtonLabel}
                  </Text>
                </>
              )}
            </View>
          </AnimatedPressable>
        )}

        {job.status === 'completed' && (
          <View
            style={{
              backgroundColor: C.successMuted,
              borderRadius: 14,
              paddingVertical: 15,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: C.success,
            }}
          >
            <CheckCircle2 size={18} color={C.success} />
            <Text style={{ fontSize: 15, fontWeight: '700', color: C.success }}>Job Completed</Text>
          </View>
        )}

        {/* Section Title */}
        <Text style={{ fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 12, letterSpacing: -0.2 }}>
          Job Actions
        </Text>

        {/* Action Cards */}
        <View style={{ gap: 12 }}>
          <ActionCard
            icon={
              checklistDone
                ? <CheckCircle2 size={22} color={C.success} />
                : <ClipboardCheck size={22} color={C.primary} />
            }
            title="Safety Checklist"
            subtitle={checklistSubtitle}
            onPress={handleChecklist}
            accent={!checklistDone && checklistStats.total === 0}
          />
          <ActionCard
            icon={<Camera size={22} color={C.primary} />}
            title="Photo Log"
            subtitle={photoSubtitle}
            onPress={handlePhotos}
          />
          <ActionCard
            icon={
              signOffStats.count > 0
                ? <CheckCircle2 size={22} color={C.success} />
                : <Circle size={22} color={C.primary} />
            }
            title="Digital Sign-Off"
            subtitle={signOffSubtitle}
            onPress={handleSignOff}
          />
        </View>
      </ScrollView>
    </View>
  );
}
