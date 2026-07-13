import React from 'react';
import { View, Text, useColorScheme } from 'react-native';
import { getColors } from '@/constants/Colors';

type JobStatus = 'pending' | 'in_progress' | 'completed';

interface StatusBadgeProps {
  status: JobStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const dark = useColorScheme() === 'dark';
  const C = getColors(dark);

  const config: Record<JobStatus, { label: string; bg: string; color: string }> = {
    pending: { label: 'Pending', bg: C.surfaceSecondary, color: C.textSecondary },
    in_progress: { label: 'In Progress', bg: C.accentMuted, color: C.accent },
    completed: { label: 'Completed', bg: C.successMuted, color: C.success },
  };

  const { label, bg, color } = config[status] ?? config.pending;
  const isSmall = size === 'sm';

  return (
    <View
      style={{
        backgroundColor: bg,
        borderRadius: 6,
        paddingHorizontal: isSmall ? 6 : 8,
        paddingVertical: isSmall ? 2 : 4,
        alignSelf: 'flex-start',
      }}
    >
      <Text
        style={{
          fontSize: isSmall ? 10 : 11,
          fontWeight: '600',
          color,
          letterSpacing: 0.3,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
    </View>
  );
}
