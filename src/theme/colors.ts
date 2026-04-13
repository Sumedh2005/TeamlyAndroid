import { useColorScheme } from 'react-native';

// MARK: - Grayscale (Light Mode)
const baseWhite = '#FFFFFF';
const secondaryLight = '#F2F2F7';
const tertiaryLight = '#E5E5EA';
const quaternaryLight = '#D1D1D6';

// MARK: - Grayscale (Dark Mode)
const baseBlack = '#000000';
const secondaryDark = '#151515';
const tertiaryDark = '#282828';
const quaternaryDark = '#3A3A3C';

// MARK: - System Colors
const systemGreenLight = '#34C759';
const systemGreenDark = '#02b701';

export const useColors = () => {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return {
    // Backgrounds
    backgroundPrimary: isDark ? baseBlack : baseWhite,
    backgroundSecondary: isDark ? secondaryDark : secondaryLight,
    backgroundTertiary: isDark ? tertiaryDark : tertiaryLight,
    backgroundQuaternary: isDark ? quaternaryDark : quaternaryLight,

    // System
    systemGreen: isDark ? systemGreenDark : systemGreenLight,

    // Core
    primaryBlack: baseBlack,
    primaryWhite: baseWhite,

    // Text
    textPrimary: isDark ? baseWhite : baseBlack,
    textSecondary: isDark ? '#EBEBF5' : '#3C3C43',
    textTertiary: isDark ? '#EBEBF599' : '#3C3C4399',

    isDark,
  };
};