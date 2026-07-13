// FieldKeep Design System Colors
export const COLORS = {
  // Brand
  primary: '#1B3A5C',
  primaryMuted: 'rgba(27, 58, 92, 0.10)',
  primaryLight: '#2A5080',
  accent: '#F97316',
  accentMuted: 'rgba(249, 115, 22, 0.12)',

  // Backgrounds
  background: '#F8F9FB',
  surface: '#FFFFFF',
  surfaceSecondary: '#EEF1F5',
  surfaceElevated: '#FFFFFF',

  // Text
  text: '#0F1C2E',
  textSecondary: '#4A6080',
  textTertiary: '#8FA3B8',

  // Status
  success: '#16A34A',
  successMuted: 'rgba(22, 163, 74, 0.12)',
  warning: '#D97706',
  warningMuted: 'rgba(217, 119, 6, 0.12)',
  danger: '#DC2626',
  dangerMuted: 'rgba(220, 38, 38, 0.10)',

  // Structural
  border: 'rgba(27, 58, 92, 0.10)',
  divider: 'rgba(27, 58, 92, 0.06)',

  // Trade badge colors
  marine: '#0369A1',
  marineMuted: 'rgba(3, 105, 161, 0.12)',
  hvac: '#7C3AED',
  hvacMuted: 'rgba(124, 58, 237, 0.12)',
  welding: '#B45309',
  weldingMuted: 'rgba(180, 83, 9, 0.12)',
  landscaping: '#15803D',
  landscapingMuted: 'rgba(21, 128, 61, 0.12)',
  electrical: '#D97706',
  electricalMuted: 'rgba(217, 119, 6, 0.12)',
  plumbing: '#0891B2',
  plumbingMuted: 'rgba(8, 145, 178, 0.12)',
  general: '#475569',
  generalMuted: 'rgba(71, 85, 105, 0.12)',
};

export const DARK_COLORS = {
  primary: '#4A8FCC',
  primaryMuted: 'rgba(74, 143, 204, 0.15)',
  primaryLight: '#5BA3E0',
  accent: '#F97316',
  accentMuted: 'rgba(249, 115, 22, 0.15)',

  background: '#0A1520',
  surface: '#111E2E',
  surfaceSecondary: '#1A2A3E',
  surfaceElevated: '#1E3048',

  text: '#E8F0F8',
  textSecondary: '#7A9BBF',
  textTertiary: '#4A6A8A',

  success: '#22C55E',
  successMuted: 'rgba(34, 197, 94, 0.15)',
  warning: '#F59E0B',
  warningMuted: 'rgba(245, 158, 11, 0.15)',
  danger: '#EF4444',
  dangerMuted: 'rgba(239, 68, 68, 0.15)',

  border: 'rgba(255, 255, 255, 0.08)',
  divider: 'rgba(255, 255, 255, 0.05)',

  marine: '#38BDF8',
  marineMuted: 'rgba(56, 189, 248, 0.15)',
  hvac: '#A78BFA',
  hvacMuted: 'rgba(167, 139, 250, 0.15)',
  welding: '#FCD34D',
  weldingMuted: 'rgba(252, 211, 77, 0.15)',
  landscaping: '#4ADE80',
  landscapingMuted: 'rgba(74, 222, 128, 0.15)',
  electrical: '#FCD34D',
  electricalMuted: 'rgba(252, 211, 77, 0.15)',
  plumbing: '#22D3EE',
  plumbingMuted: 'rgba(34, 211, 238, 0.15)',
  general: '#94A3B8',
  generalMuted: 'rgba(148, 163, 184, 0.15)',
};

export function getColors(dark: boolean) {
  return dark ? DARK_COLORS : COLORS;
}
