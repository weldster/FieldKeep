import React, { useEffect, useRef } from 'react';
import { Animated, View, ViewStyle, useColorScheme, DimensionValue } from 'react-native';
import { getColors } from '@/constants/Colors';

interface SkeletonLineProps {
  width: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonLine({ width, height = 14, borderRadius, style }: SkeletonLineProps) {
  const dark = useColorScheme() === 'dark';
  const C = getColors(dark);
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <View style={[{ width }, style]}>
      <Animated.View
        style={{
          width: '100%',
          height,
          borderRadius: borderRadius ?? height / 2,
          backgroundColor: C.surfaceSecondary,
          opacity,
        }}
      />
    </View>
  );
}

export function SkeletonJobCard() {
  const dark = useColorScheme() === 'dark';
  const C = getColors(dark);

  return (
    <View
      style={{
        backgroundColor: C.surface,
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: C.border,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
        <SkeletonLine width="60%" height={16} />
        <SkeletonLine width={60} height={20} borderRadius={6} />
      </View>
      <SkeletonLine width="40%" height={12} style={{ marginBottom: 8 }} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <SkeletonLine width={70} height={20} borderRadius={6} />
        <SkeletonLine width={80} height={20} borderRadius={6} />
      </View>
    </View>
  );
}

export function SkeletonCrewCard() {
  const dark = useColorScheme() === 'dark';
  const C = getColors(dark);

  return (
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
        gap: 12,
      }}
    >
      <SkeletonLine width={44} height={44} borderRadius={22} />
      <View style={{ flex: 1, gap: 8 }}>
        <SkeletonLine width="50%" height={14} />
        <SkeletonLine width="30%" height={12} />
      </View>
    </View>
  );
}
