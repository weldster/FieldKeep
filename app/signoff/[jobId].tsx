import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  useColorScheme,
  PanResponder,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { PenLine, Trash2, CheckCircle2, AlertCircle, RotateCcw, User } from 'lucide-react-native';
import { supabase } from '@/app/integrations/supabase/client';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { SkeletonLine } from '@/components/SkeletonLoader';
import { getColors } from '@/constants/Colors';

interface SignOff {
  id: string;
  job_id: string;
  signer_name: string;
  signature_data: string;
  created_at: string;
}

interface Point {
  x: number;
  y: number;
}

interface PathSegment {
  points: Point[];
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function pointsToSvgPath(points: Point[]): string {
  if (points.length < 2) return '';
  const start = points[0];
  let d = `M ${start.x} ${start.y}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x} ${points[i].y}`;
  }
  return d;
}

export default function SignOffScreen() {
  const dark = useColorScheme() === 'dark';
  const C = getColors(dark);
  const { jobId } = useLocalSearchParams<{ jobId: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signOffs, setSignOffs] = useState<SignOff[]>([]);
  const [signerName, setSignerName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Signature pad state
  const [paths, setPaths] = useState<PathSegment[]>([]);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [hasSignature, setHasSignature] = useState(false);
  const padRef = useRef<View>(null);
  const padLayout = useRef({ x: 0, y: 0, width: 0, height: 0 });

  const fetchSignOffs = useCallback(async () => {
    console.log('[SignOff] Fetching sign-offs for job:', jobId);
    if (!jobId) return;
    try {
      const { data, error: fetchError } = await supabase
        .from('sign_offs')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setSignOffs((data ?? []) as SignOff[]);
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load sign-offs';
      console.error('[SignOff] Error fetching sign-offs:', message);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchSignOffs();
  }, [fetchSignOffs]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: evt => {
        const { locationX, locationY } = evt.nativeEvent;
        console.log('[SignOff] Signature drawing started');
        setCurrentPath([{ x: locationX, y: locationY }]);
        setHasSignature(true);
      },
      onPanResponderMove: evt => {
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentPath(prev => [...prev, { x: locationX, y: locationY }]);
      },
      onPanResponderRelease: () => {
        console.log('[SignOff] Signature stroke completed');
        setCurrentPath(prev => {
          if (prev.length > 0) {
            setPaths(existing => [...existing, { points: prev }]);
          }
          return [];
        });
      },
    })
  ).current;

  const handleClear = () => {
    console.log('[SignOff] Clear signature pressed');
    setPaths([]);
    setCurrentPath([]);
    setHasSignature(false);
  };

  const serializeSignature = (): string => {
    return JSON.stringify(paths.map(p => p.points));
  };

  const handleSubmit = async () => {
    console.log('[SignOff] Submit Sign-Off pressed, signer:', signerName);
    if (!signerName.trim()) {
      setFormError('Signer name is required');
      return;
    }
    if (!hasSignature || paths.length === 0) {
      setFormError('Please draw your signature');
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const signatureData = serializeSignature();
      console.log('[SignOff] Saving sign-off to Supabase');
      const { error: insertError } = await supabase.from('sign_offs').insert({
        job_id: jobId,
        signer_name: signerName.trim(),
        signature_data: signatureData,
      });

      if (insertError) throw insertError;

      console.log('[SignOff] Sign-off saved successfully');
      setSignerName('');
      handleClear();
      fetchSignOffs();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit sign-off';
      console.error('[SignOff] Error submitting sign-off:', message);
      setFormError(message);
    } finally {
      setSaving(false);
    }
  };

  const allPaths = [...paths, ...(currentPath.length > 0 ? [{ points: currentPath }] : [])];

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <Stack.Screen options={{ title: 'Digital Sign-Off' }} />

      {loading ? (
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
          <SkeletonLine width="50%" height={18} style={{ marginBottom: 8 }} />
          <SkeletonLine width="100%" height={160} borderRadius={14} />
          <SkeletonLine width="100%" height={48} borderRadius={14} />
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Sign-Off Form */}
          <View
            style={{
              backgroundColor: C.surface,
              borderRadius: 16,
              padding: 20,
              marginBottom: 24,
              borderWidth: 1,
              borderColor: C.border,
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <Text style={{ fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 16 }}>
              New Sign-Off
            </Text>

            {/* Signer Name */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: C.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Signer Name *
              </Text>
              <TextInput
                value={signerName}
                onChangeText={v => {
                  setSignerName(v);
                  if (formError) setFormError(null);
                }}
                placeholder="e.g. John Smith"
                placeholderTextColor={C.textTertiary}
                autoCapitalize="words"
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

            {/* Signature Pad */}
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: C.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Signature *
                </Text>
                <AnimatedPressable onPress={handleClear}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Trash2 size={14} color={C.danger} />
                    <Text style={{ fontSize: 13, color: C.danger, fontWeight: '600' }}>Clear</Text>
                  </View>
                </AnimatedPressable>
              </View>

              <View
                ref={padRef}
                onLayout={e => {
                  padLayout.current = e.nativeEvent.layout;
                }}
                {...panResponder.panHandlers}
                style={{
                  height: 160,
                  backgroundColor: C.surfaceSecondary,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: hasSignature ? C.primary : C.border,
                  overflow: 'hidden',
                }}
              >
                {!hasSignature && (
                  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
                    <PenLine size={24} color={C.textTertiary} style={{ marginBottom: 6 }} />
                    <Text style={{ fontSize: 13, color: C.textTertiary }}>Draw your signature here</Text>
                  </View>
                )}
                <Svg width="100%" height="100%">
                  {allPaths.map((segment, i) => {
                    const d = pointsToSvgPath(segment.points);
                    if (!d) return null;
                    return (
                      <Path
                        key={i}
                        d={d}
                        stroke={C.primary}
                        strokeWidth={2.5}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    );
                  })}
                </Svg>
              </View>
            </View>

            {formError && (
              <View style={{ backgroundColor: C.dangerMuted, borderRadius: 10, padding: 12, marginBottom: 16 }}>
                <Text style={{ fontSize: 13, color: C.danger, fontWeight: '500' }}>{formError}</Text>
              </View>
            )}

            <AnimatedPressable onPress={handleSubmit} disabled={saving}>
              <View
                style={{
                  backgroundColor: C.primary,
                  borderRadius: 14,
                  paddingVertical: 15,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <CheckCircle2 size={18} color="#FFFFFF" />
                )}
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>
                  {saving ? 'Submitting...' : 'Submit sign-off'}
                </Text>
              </View>
            </AnimatedPressable>
          </View>

          {/* Existing Sign-Offs */}
          {signOffs.length > 0 && (
            <View>
              <Text style={{ fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 14, letterSpacing: -0.2 }}>
                Collected Signatures
              </Text>
              <View style={{ gap: 10 }}>
                {signOffs.map(signOff => {
                  const dateTimeDisplay = formatDateTime(signOff.created_at);
                  const initials = signOff.signer_name
                    .split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <View
                      key={signOff.id}
                      style={{
                        backgroundColor: C.surface,
                        borderRadius: 14,
                        padding: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 14,
                        borderWidth: 1,
                        borderColor: C.border,
                        borderLeftWidth: 3,
                        borderLeftColor: C.success,
                      }}
                    >
                      <View
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 22,
                          backgroundColor: C.successMuted,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ fontSize: 15, fontWeight: '700', color: C.success }}>{initials}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: '600', color: C.text, marginBottom: 3 }}>
                          {signOff.signer_name}
                        </Text>
                        <Text style={{ fontSize: 12, color: C.textSecondary }}>
                          {dateTimeDisplay}
                        </Text>
                      </View>
                      <CheckCircle2 size={20} color={C.success} />
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {error && (
            <View style={{ alignItems: 'center', paddingTop: 20 }}>
              <AlertCircle size={28} color={C.danger} style={{ marginBottom: 8 }} />
              <Text style={{ fontSize: 14, color: C.textSecondary, textAlign: 'center', marginBottom: 12 }}>{error}</Text>
              <AnimatedPressable onPress={() => { console.log('[SignOff] Retry pressed'); fetchSignOffs(); }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.primaryMuted, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10 }}>
                  <RotateCcw size={15} color={C.primary} />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: C.primary }}>Try again</Text>
                </View>
              </AnimatedPressable>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
