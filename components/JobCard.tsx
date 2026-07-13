import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, MapPin, Calendar } from 'lucide-react-native';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { StatusBadge } from '@/components/StatusBadge';
import { TradeBadge, TradeType } from '@/components/TradeBadge';
import { getColors } from '@/constants/Colors';

export interface Job {
  id: string;
  title: string;
  client_name: string;
  location: string;
  trade_type: TradeType;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  user_id: string;
}

interface JobCardProps {
  job: Job;
  index?: number;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function JobCard({ job, index = 0 }: JobCardProps) {
  const dark = useColorScheme() === 'dark';
  const C = getColors(dark);
  const router = useRouter();

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 350,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 350,
        delay: index * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, opacity, translateY]);

  const dateDisplay = formatDate(job.created_at);

  const handlePress = () => {
    console.log('[JobCard] Pressed job card:', job.id, job.title);
    router.push(`/job/${job.id}`);
  };

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <AnimatedPressable onPress={handlePress}>
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
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: C.text,
                flex: 1,
                marginRight: 8,
              }}
              numberOfLines={1}
            >
              {job.title}
            </Text>
            <ChevronRight size={18} color={C.textTertiary} />
          </View>

          <Text
            style={{
              fontSize: 14,
              color: C.textSecondary,
              marginBottom: 10,
              fontWeight: '500',
            }}
            numberOfLines={1}
          >
            {job.client_name}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 }}>
            <MapPin size={13} color={C.textTertiary} />
            <Text
              style={{ fontSize: 13, color: C.textTertiary }}
              numberOfLines={1}
            >
              {job.location}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TradeBadge trade={job.trade_type} size="sm" />
              <StatusBadge status={job.status} size="sm" />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Calendar size={12} color={C.textTertiary} />
              <Text style={{ fontSize: 12, color: C.textTertiary }}>{dateDisplay}</Text>
            </View>
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}
