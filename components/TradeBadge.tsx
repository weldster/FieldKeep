import React from 'react';
import { View, Text, useColorScheme } from 'react-native';
import { getColors } from '@/constants/Colors';

export type TradeType = 'marine' | 'hvac' | 'welding' | 'landscaping' | 'electrical' | 'plumbing' | 'general';

interface TradeBadgeProps {
  trade: TradeType;
  size?: 'sm' | 'md';
}

const TRADE_LABELS: Record<TradeType, string> = {
  marine: 'Marine',
  hvac: 'HVAC',
  welding: 'Welding',
  landscaping: 'Landscaping',
  electrical: 'Electrical',
  plumbing: 'Plumbing',
  general: 'General',
};

export function TradeBadge({ trade, size = 'md' }: TradeBadgeProps) {
  const dark = useColorScheme() === 'dark';
  const C = getColors(dark);

  const colorMap: Record<TradeType, { bg: string; color: string }> = {
    marine: { bg: C.marineMuted, color: C.marine },
    hvac: { bg: C.hvacMuted, color: C.hvac },
    welding: { bg: C.weldingMuted, color: C.welding },
    landscaping: { bg: C.landscapingMuted, color: C.landscaping },
    electrical: { bg: C.electricalMuted, color: C.electrical },
    plumbing: { bg: C.plumbingMuted, color: C.plumbing },
    general: { bg: C.generalMuted, color: C.general },
  };

  const { bg, color } = colorMap[trade] ?? colorMap.general;
  const label = TRADE_LABELS[trade] ?? trade;
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
