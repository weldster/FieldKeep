import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  useColorScheme,
  ActivityIndicator,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Plus, AlertCircle, RotateCcw, Image as ImageIcon } from 'lucide-react-native';
import { supabase } from '@/app/integrations/supabase/client';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { SkeletonLine } from '@/components/SkeletonLoader';
import { getColors } from '@/constants/Colors';

interface JobPhoto {
  id: string;
  job_id: string;
  photo_url: string;
  caption: string;
  photo_type: 'before' | 'after';
  created_at: string;
}

interface PendingPhoto {
  uri: string;
  caption: string;
  type: 'before' | 'after';
  uploading: boolean;
}

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

function PhotoGrid({
  photos,
  type,
  onAdd,
  uploading,
}: {
  photos: JobPhoto[];
  type: 'before' | 'after';
  onAdd: (type: 'before' | 'after') => void;
  uploading: boolean;
}) {
  const dark = useColorScheme() === 'dark';
  const C = getColors(dark);
  const label = type === 'before' ? 'Before' : 'After';
  const accentColor = type === 'before' ? C.warning : C.success;
  const accentMuted = type === 'before' ? C.warningMuted : C.successMuted;

  const handleAddPress = () => {
    console.log('[Photos] Add photo button pressed for type:', type);
    onAdd(type);
  };

  return (
    <View style={{ marginBottom: 28 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: accentColor }} />
          <Text style={{ fontSize: 17, fontWeight: '700', color: C.text }}>
            {label}
          </Text>
          <View style={{ backgroundColor: accentMuted, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: accentColor }}>{photos.length}</Text>
          </View>
        </View>
        <AnimatedPressable onPress={handleAddPress} disabled={uploading}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: accentMuted,
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
          >
            {uploading ? (
              <ActivityIndicator size="small" color={accentColor} />
            ) : (
              <Plus size={15} color={accentColor} />
            )}
            <Text style={{ fontSize: 13, fontWeight: '600', color: accentColor }}>
              {uploading ? 'Uploading...' : 'Add photo'}
            </Text>
          </View>
        </AnimatedPressable>
      </View>

      {photos.length === 0 ? (
        <View
          style={{
            backgroundColor: C.surface,
            borderRadius: 14,
            padding: 28,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: C.border,
            borderStyle: 'dashed',
          }}
        >
          <ImageIcon size={28} color={C.textTertiary} style={{ marginBottom: 8 }} />
          <Text style={{ fontSize: 14, color: C.textSecondary, textAlign: 'center' }}>
            No {label.toLowerCase()} photos yet
          </Text>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {photos.map(photo => (
            <View
              key={photo.id}
              style={{
                width: '47%',
                backgroundColor: C.surface,
                borderRadius: 12,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: C.border,
              }}
            >
              <Image
                source={resolveImageSource(photo.photo_url)}
                style={{ width: '100%', height: 130 }}
                resizeMode="cover"
              />
              {photo.caption ? (
                <View style={{ padding: 8 }}>
                  <Text style={{ fontSize: 12, color: C.textSecondary }} numberOfLines={2}>
                    {photo.caption}
                  </Text>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function PhotoLogScreen() {
  const dark = useColorScheme() === 'dark';
  const C = getColors(dark);
  const { jobId } = useLocalSearchParams<{ jobId: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [beforePhotos, setBeforePhotos] = useState<JobPhoto[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<JobPhoto[]>([]);
  const [uploadingType, setUploadingType] = useState<'before' | 'after' | null>(null);

  // Caption modal state
  const [pendingPhoto, setPendingPhoto] = useState<PendingPhoto | null>(null);
  const [captionInput, setCaptionInput] = useState('');

  const fetchPhotos = useCallback(async () => {
    console.log('[Photos] Fetching photos for job:', jobId);
    if (!jobId) return;
    try {
      const { data, error: fetchError } = await supabase
        .from('job_photos')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      const photos = (data ?? []) as JobPhoto[];
      setBeforePhotos(photos.filter(p => p.photo_type === 'before'));
      setAfterPhotos(photos.filter(p => p.photo_type === 'after'));
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load photos';
      console.error('[Photos] Error fetching photos:', message);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const handleAddPhoto = async (type: 'before' | 'after') => {
    console.log('[Photos] Requesting image picker for type:', type);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      console.log('[Photos] Media library permission denied');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) {
      console.log('[Photos] Image picker cancelled');
      return;
    }

    const asset = result.assets[0];
    console.log('[Photos] Image selected:', asset.uri);
    setPendingPhoto({ uri: asset.uri, caption: '', type, uploading: false });
    setCaptionInput('');
  };

  const handleUploadPhoto = async () => {
    if (!pendingPhoto || !jobId) return;
    console.log('[Photos] Uploading photo to Supabase Storage, type:', pendingPhoto.type);
    setUploadingType(pendingPhoto.type);

    try {
      const response = await fetch(pendingPhoto.uri);
      const blob = await response.blob();
      const fileName = `${jobId}/${Date.now()}.jpg`;

      console.log('[Photos] Uploading to storage path:', fileName);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('job-photos')
        .upload(fileName, blob, { contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('job-photos')
        .getPublicUrl(uploadData.path);

      console.log('[Photos] Photo uploaded, public URL:', publicUrl);

      const { error: insertError } = await supabase.from('job_photos').insert({
        job_id: jobId,
        photo_url: publicUrl,
        caption: captionInput.trim(),
        photo_type: pendingPhoto.type,
      });

      if (insertError) throw insertError;

      console.log('[Photos] Photo record saved to database');
      setPendingPhoto(null);
      setCaptionInput('');
      fetchPhotos();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to upload photo';
      console.error('[Photos] Error uploading photo:', message);
      setError(message);
    } finally {
      setUploadingType(null);
    }
  };

  const handleCancelPending = () => {
    console.log('[Photos] Photo upload cancelled');
    setPendingPhoto(null);
    setCaptionInput('');
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <Stack.Screen options={{ title: 'Photo Log' }} />

      {loading ? (
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
          <SkeletonLine width="30%" height={18} style={{ marginBottom: 8 }} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <SkeletonLine width="47%" height={130} borderRadius={12} />
            <SkeletonLine width="47%" height={130} borderRadius={12} />
          </View>
        </ScrollView>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <AlertCircle size={40} color={C.danger} style={{ marginBottom: 12 }} />
          <Text style={{ fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 6 }}>Couldn't load photos</Text>
          <Text style={{ fontSize: 14, color: C.textSecondary, textAlign: 'center', marginBottom: 20 }}>{error}</Text>
          <AnimatedPressable onPress={() => { console.log('[Photos] Retry pressed'); fetchPhotos(); }}>
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
          {/* Pending photo caption input */}
          {pendingPhoto && (
            <View
              style={{
                backgroundColor: C.surface,
                borderRadius: 14,
                padding: 16,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: C.primary,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 12 }}>
                Add caption for {pendingPhoto.type} photo
              </Text>
              <Image
                source={resolveImageSource(pendingPhoto.uri)}
                style={{ width: '100%', height: 180, borderRadius: 10, marginBottom: 12 }}
                resizeMode="cover"
              />
              <TextInput
                value={captionInput}
                onChangeText={setCaptionInput}
                placeholder="Optional caption..."
                placeholderTextColor={C.textTertiary}
                style={{
                  backgroundColor: C.surfaceSecondary,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 14,
                  color: C.text,
                  borderWidth: 1,
                  borderColor: C.border,
                  marginBottom: 12,
                }}
              />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <AnimatedPressable onPress={handleCancelPending} style={{ flex: 1 }}>
                  <View style={{ backgroundColor: C.surfaceSecondary, borderRadius: 10, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: C.border }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: C.textSecondary }}>Cancel</Text>
                  </View>
                </AnimatedPressable>
                <AnimatedPressable onPress={handleUploadPhoto} disabled={uploadingType !== null} style={{ flex: 1 }}>
                  <View style={{ backgroundColor: C.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
                    {uploadingType ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Camera size={16} color="#FFFFFF" />
                    )}
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>
                      {uploadingType ? 'Uploading...' : 'Upload photo'}
                    </Text>
                  </View>
                </AnimatedPressable>
              </View>
            </View>
          )}

          <PhotoGrid
            photos={beforePhotos}
            type="before"
            onAdd={handleAddPhoto}
            uploading={uploadingType === 'before'}
          />
          <PhotoGrid
            photos={afterPhotos}
            type="after"
            onAdd={handleAddPhoto}
            uploading={uploadingType === 'after'}
          />
        </ScrollView>
      )}
    </View>
  );
}
