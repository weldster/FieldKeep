import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { CheckSquare, Square, AlertCircle, RotateCcw, Save } from 'lucide-react-native';
import { supabase } from '@/utils/supabase/client';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { SkeletonLine } from '@/components/SkeletonLoader';
import { getColors } from '@/constants/Colors';
import type { TradeType } from '@/components/TradeBadge';

interface ChecklistItem {
  id: string;
  job_id: string;
  question: string;
  is_checked: boolean;
  checked_by: string;
  sort_order: number;
}

const TRADE_QUESTIONS: Record<string, string[]> = {
  hvac: [
    'Is refrigerant handling equipment inspected?',
    'Are all electrical disconnects locked out?',
    'Is PPE (gloves, goggles) available?',
    'Has the work area been cleared of obstructions?',
    'Is the ladder/scaffold secure?',
    'Are refrigerant leak detectors on-site?',
    'Has the client been notified of work scope?',
  ],
  marine: [
    'Is the vessel properly secured to dock?',
    'Are life jackets accessible?',
    'Is fire suppression equipment checked?',
    'Are bilge pumps operational?',
    'Is the work area free of fuel vapors?',
    'Are all tools secured against falling overboard?',
    'Has weather been checked for the work period?',
  ],
  welding: [
    'Is welding area clear of flammables?',
    'Is ventilation adequate?',
    'Are welding screens/curtains in place?',
    'Is fire watch assigned?',
    'Is PPE (helmet, gloves, jacket) worn?',
    'Are gas cylinders secured upright?',
    'Is a fire extinguisher within reach?',
  ],
  landscaping: [
    'Is equipment pre-operation inspection complete?',
    'Are underground utilities marked?',
    'Is PPE (eye, ear, foot protection) worn?',
    'Is the work zone clearly marked?',
    'Are bystanders at safe distance?',
    'Is fuel/oil stored safely?',
    'Has client property been protected?',
  ],
  general: [
    'Is the work area safe and clear?',
    'Is PPE available and worn?',
    'Are tools inspected and in good condition?',
    'Is emergency contact info posted?',
    'Has the job scope been reviewed with crew?',
    'Are hazards identified and mitigated?',
    'Is first aid kit accessible?',
  ],
};

function getQuestionsForTrade(trade: string): string[] {
  return TRADE_QUESTIONS[trade] ?? TRADE_QUESTIONS.general;
}

export default function ChecklistScreen() {
  const dark = useColorScheme() === 'dark';
  const C = getColors(dark);
  const { jobId } = useLocalSearchParams<{ jobId: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [jobTrade, setJobTrade] = useState<TradeType>('general');

  const fetchChecklist = useCallback(async () => {
    console.log('[Checklist] Fetching checklist for job:', jobId);
    if (!jobId) return;
    try {
      const [jobRes, checklistRes] = await Promise.all([
        supabase.from('jobs').select('trade_type').eq('id', jobId).single(),
        supabase.from('checklist_items').select('*').eq('job_id', jobId).order('sort_order'),
      ]);

      if (jobRes.error) throw jobRes.error;

      const trade = (jobRes.data?.trade_type ?? 'general') as TradeType;
      setJobTrade(trade);

      if (checklistRes.data && checklistRes.data.length > 0) {
        setItems(checklistRes.data as ChecklistItem[]);
      } else {
        // Pre-populate with trade-specific questions
        console.log('[Checklist] No existing items, pre-populating for trade:', trade);
        const questions = getQuestionsForTrade(trade);
        const defaultItems: ChecklistItem[] = questions.map((q, i) => ({
          id: `temp-${i}`,
          job_id: jobId,
          question: q,
          is_checked: false,
          checked_by: '',
          sort_order: i,
        }));
        setItems(defaultItems);
      }
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load checklist';
      console.error('[Checklist] Error fetching checklist:', message);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchChecklist();
  }, [fetchChecklist]);

  const toggleItem = (index: number) => {
    console.log('[Checklist] Item toggled at index:', index, 'checked:', !items[index].is_checked);
    setItems(prev =>
      prev.map((item, i) =>
        i === index ? { ...item, is_checked: !item.is_checked } : item
      )
    );
  };

  const updateCheckedBy = (index: number, value: string) => {
    setItems(prev =>
      prev.map((item, i) =>
        i === index ? { ...item, checked_by: value } : item
      )
    );
  };

  const handleSave = async () => {
    console.log('[Checklist] Save Checklist button pressed');
    if (!jobId) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      // Delete existing items and re-insert
      await supabase.from('checklist_items').delete().eq('job_id', jobId);

      const toInsert = items.map((item, i) => ({
        job_id: jobId,
        question: item.question,
        is_checked: item.is_checked,
        checked_by: item.checked_by,
        sort_order: i,
      }));

      console.log('[Checklist] Saving', toInsert.length, 'checklist items to Supabase');
      const { error: insertError } = await supabase.from('checklist_items').insert(toInsert);
      if (insertError) throw insertError;

      console.log('[Checklist] Checklist saved successfully');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      // Refresh to get real IDs
      fetchChecklist();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save checklist';
      console.error('[Checklist] Error saving checklist:', message);
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const checkedCount = items.filter(i => i.is_checked).length;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;
  const progressDisplay = totalCount > 0 ? `${checkedCount}/${totalCount}` : '0/0';
  const allDone = totalCount > 0 && checkedCount === totalCount;

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <Stack.Screen options={{ title: 'Safety Checklist' }} />

      {loading ? (
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
          <SkeletonLine width="100%" height={8} borderRadius={4} />
          {[0, 1, 2, 3, 4].map(i => (
            <View key={i} style={{ backgroundColor: C.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: C.border }}>
              <SkeletonLine width="80%" height={14} />
            </View>
          ))}
        </ScrollView>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <AlertCircle size={40} color={C.danger} style={{ marginBottom: 12 }} />
          <Text style={{ fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 6 }}>Couldn't load checklist</Text>
          <Text style={{ fontSize: 14, color: C.textSecondary, textAlign: 'center', marginBottom: 20 }}>{error}</Text>
          <AnimatedPressable onPress={() => { console.log('[Checklist] Retry pressed'); fetchChecklist(); }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.primaryMuted, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10 }}>
              <RotateCcw size={15} color={C.primary} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: C.primary }}>Try again</Text>
            </View>
          </AnimatedPressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Progress Bar */}
          <View
            style={{
              backgroundColor: C.surface,
              borderRadius: 14,
              padding: 16,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: C.border,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: C.text }}>
                Completion
              </Text>
              <Text style={{ fontSize: 14, fontWeight: '700', color: allDone ? C.success : C.primary, fontVariant: ['tabular-nums'] }}>
                {progressDisplay}
              </Text>
            </View>
            <View style={{ height: 8, backgroundColor: C.surfaceSecondary, borderRadius: 4, overflow: 'hidden' }}>
              <View
                style={{
                  height: '100%',
                  width: `${progressPercent}%`,
                  backgroundColor: allDone ? C.success : C.primary,
                  borderRadius: 4,
                }}
              />
            </View>
            {allDone && (
              <Text style={{ fontSize: 13, color: C.success, fontWeight: '600', marginTop: 8 }}>
                All safety checks complete!
              </Text>
            )}
          </View>

          {/* Checklist Items */}
          <View style={{ gap: 10, marginBottom: 24 }}>
            {items.map((item, index) => (
              <View
                key={item.id}
                style={{
                  backgroundColor: C.surface,
                  borderRadius: 12,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: item.is_checked ? C.success : C.border,
                  borderLeftWidth: 3,
                  borderLeftColor: item.is_checked ? C.success : C.border,
                }}
              >
                <AnimatedPressable onPress={() => toggleItem(index)}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                    <View style={{ paddingTop: 1 }}>
                      {item.is_checked ? (
                        <CheckSquare size={22} color={C.success} />
                      ) : (
                        <Square size={22} color={C.textTertiary} />
                      )}
                    </View>
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 14,
                        color: item.is_checked ? C.textSecondary : C.text,
                        lineHeight: 20,
                        textDecorationLine: item.is_checked ? 'line-through' : 'none',
                      }}
                    >
                      {item.question}
                    </Text>
                  </View>
                </AnimatedPressable>

                {item.is_checked && (
                  <View style={{ marginTop: 10, marginLeft: 34 }}>
                    <TextInput
                      value={item.checked_by}
                      onChangeText={v => updateCheckedBy(index, v)}
                      placeholder="Checked by (name)"
                      placeholderTextColor={C.textTertiary}
                      style={{
                        backgroundColor: C.surfaceSecondary,
                        borderRadius: 8,
                        paddingHorizontal: 10,
                        paddingVertical: 8,
                        fontSize: 13,
                        color: C.text,
                        borderWidth: 1,
                        borderColor: C.border,
                      }}
                    />
                  </View>
                )}
              </View>
            ))}
          </View>

          {saveSuccess && (
            <View style={{ backgroundColor: C.successMuted, borderRadius: 10, padding: 12, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <CheckSquare size={16} color={C.success} />
              <Text style={{ fontSize: 13, color: C.success, fontWeight: '600' }}>Checklist saved successfully</Text>
            </View>
          )}

          <AnimatedPressable onPress={handleSave} disabled={saving}>
            <View
              style={{
                backgroundColor: C.primary,
                borderRadius: 14,
                paddingVertical: 16,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Save size={18} color="#FFFFFF" />
              )}
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>
                {saving ? 'Saving...' : 'Save checklist'}
              </Text>
            </View>
          </AnimatedPressable>
        </ScrollView>
      )}
    </View>
  );
}
