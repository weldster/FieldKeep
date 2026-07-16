import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronDown, Check } from 'lucide-react-native';
import { supabase } from '@/utils/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { getColors } from '@/constants/Colors';
import type { TradeType } from '@/components/TradeBadge';

const TRADE_OPTIONS: { value: TradeType; label: string }[] = [
  { value: 'marine', label: 'Marine' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'welding', label: 'Welding' },
  { value: 'landscaping', label: 'Landscaping' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'general', label: 'General' },
];

interface FormField {
  label: string;
  value: string;
  placeholder: string;
  key: 'title' | 'clientName' | 'location';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

export default function NewJobScreen() {
  const dark = useColorScheme() === 'dark';
  const C = getColors(dark);
  const router = useRouter();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [location, setLocation] = useState('');
  const [tradeType, setTradeType] = useState<TradeType>('general');
  const [showTradePicker, setShowTradePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Job title is required';
    if (!clientName.trim()) newErrors.clientName = 'Client name is required';
    if (!location.trim()) newErrors.location = 'Location is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    console.log('[NewJob] Create Job button pressed:', { title, clientName, location, tradeType });
    if (!validate()) return;

    setSaving(true);
    try {
      const userId = user?.id;
      if (!userId) throw new Error('Not authenticated');

      console.log('[NewJob] Inserting new job into Supabase');
      const { data, error: insertError } = await supabase
        .from('jobs')
        .insert({
          title: title.trim(),
          client_name: clientName.trim(),
          location: location.trim(),
          trade_type: tradeType,
          status: 'pending',
          user_id: userId,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      console.log('[NewJob] Job created successfully:', data.id);
      router.replace(`/job/${data.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create job';
      console.error('[NewJob] Error creating job:', message);
      setErrors({ submit: message });
    } finally {
      setSaving(false);
    }
  };

  const selectedTradeLabel = TRADE_OPTIONS.find(t => t.value === tradeType)?.label ?? 'General';

  const fields: FormField[] = [
    { label: 'Job Title', value: title, placeholder: 'e.g. HVAC System Replacement', key: 'title', autoCapitalize: 'words' },
    { label: 'Client Name', value: clientName, placeholder: 'e.g. Coastal Marine Services', key: 'clientName', autoCapitalize: 'words' },
    { label: 'Location / Address', value: location, placeholder: 'e.g. 123 Harbor Blvd, Dock 4', key: 'location', autoCapitalize: 'sentences' },
  ];

  const setters: Record<string, (v: string) => void> = {
    title: setTitle,
    clientName: setClientName,
    location: setLocation,
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: C.background }}
    >
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={{ fontSize: 13, color: C.textSecondary, marginBottom: 24, lineHeight: 20 }}>
          Fill in the job details below. You can update the status and add safety checklists after creating the job.
        </Text>

        {fields.map(field => (
          <View key={field.key} style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: C.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {field.label} *
            </Text>
            <TextInput
              value={field.value}
              onChangeText={v => {
                setters[field.key](v);
                if (errors[field.key]) setErrors(prev => ({ ...prev, [field.key]: '' }));
              }}
              placeholder={field.placeholder}
              placeholderTextColor={C.textTertiary}
              autoCapitalize={field.autoCapitalize}
              style={{
                backgroundColor: C.surfaceSecondary,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 13,
                fontSize: 15,
                color: C.text,
                borderWidth: 1,
                borderColor: errors[field.key] ? C.danger : C.border,
              }}
            />
            {errors[field.key] ? (
              <Text style={{ fontSize: 12, color: C.danger, marginTop: 5 }}>{errors[field.key]}</Text>
            ) : null}
          </View>
        ))}

        {/* Trade Type Picker */}
        <View style={{ marginBottom: 28 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: C.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Trade Type
          </Text>
          <AnimatedPressable onPress={() => {
            console.log('[NewJob] Trade type picker toggled');
            setShowTradePicker(!showTradePicker);
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
              <Text style={{ fontSize: 15, color: C.text }}>{selectedTradeLabel}</Text>
              <ChevronDown size={18} color={C.textTertiary} />
            </View>
          </AnimatedPressable>

          {showTradePicker && (
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
              {TRADE_OPTIONS.map((opt, i) => (
                <AnimatedPressable
                  key={opt.value}
                  onPress={() => {
                    console.log('[NewJob] Trade type selected:', opt.value);
                    setTradeType(opt.value);
                    setShowTradePicker(false);
                  }}
                >
                  <View
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 13,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: tradeType === opt.value ? C.primaryMuted : 'transparent',
                      borderBottomWidth: i < TRADE_OPTIONS.length - 1 ? 1 : 0,
                      borderBottomColor: C.divider,
                    }}
                  >
                    <Text style={{ fontSize: 15, color: tradeType === opt.value ? C.primary : C.text, fontWeight: tradeType === opt.value ? '600' : '400' }}>
                      {opt.label}
                    </Text>
                    {tradeType === opt.value && <Check size={16} color={C.primary} />}
                  </View>
                </AnimatedPressable>
              ))}
            </View>
          )}
        </View>

        {errors.submit && (
          <View style={{ backgroundColor: C.dangerMuted, borderRadius: 10, padding: 12, marginBottom: 20 }}>
            <Text style={{ fontSize: 13, color: C.danger, fontWeight: '500' }}>{errors.submit}</Text>
          </View>
        )}

        <AnimatedPressable onPress={handleCreate} disabled={saving}>
          <View
            style={{
              backgroundColor: C.primary,
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: 'center',
              boxShadow: '0 2px 8px rgba(27,58,92,0.25)',
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>
              {saving ? 'Creating job...' : 'Create job'}
            </Text>
          </View>
        </AnimatedPressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
