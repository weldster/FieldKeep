import React from 'react';
import { View, useColorScheme } from 'react-native';
import { Stack, usePathname } from 'expo-router';
import FloatingTabBar from '@/components/FloatingTabBar';
import { getColors } from '@/constants/Colors';

const TABS = [
  {
    name: '(home)',
    route: '/(tabs)/(home)' as const,
    icon: 'home' as const,
    label: 'Dashboard',
  },
  {
    name: '(jobs)',
    route: '/(tabs)/(jobs)' as const,
    icon: 'work' as const,
    label: 'Jobs',
  },
  {
    name: '(crew)',
    route: '/(tabs)/(crew)' as const,
    icon: 'group' as const,
    label: 'Crew',
  },
];

export default function TabLayout() {
  const dark = useColorScheme() === 'dark';
  const C = getColors(dark);
  const pathname = usePathname();

  // Hide tab bar on detail screens
  const hideTabBar = pathname.startsWith('/job/') || pathname.startsWith('/checklist/') || pathname.startsWith('/photos/') || pathname.startsWith('/signoff/');

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
        }}
      >
        <Stack.Screen name="(home)" />
        <Stack.Screen name="(jobs)" />
        <Stack.Screen name="(crew)" />
      </Stack>
      {!hideTabBar && (
        <FloatingTabBar
          tabs={TABS}
          containerWidth={280}
          borderRadius={35}
        />
      )}
    </View>
  );
}
