import { Platform, StyleSheet, Text, type TextProps, TextStyle } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

/**
 * Helper to get the correct Kanit font family based on weight
 */
const getKanitFont = (weight: TextStyle['fontWeight']): string => {
  if (Platform.OS === 'web') return 'Kanit-Regular'; // Web uses CSS font-weight

  switch (weight) {
    case '100': case 'thin': return 'Kanit-Thin';
    case '200': return 'Kanit-ExtraLight';
    case '300': return 'Kanit-Light';
    case '400': case 'normal': return 'Kanit-Regular';
    case '500': return 'Kanit-Medium';
    case '600': return 'Kanit-SemiBold';
    case '700': case 'bold': return 'Kanit-Bold';
    case '800': return 'Kanit-ExtraBold';
    case '900': return 'Kanit-Black';
    default: return 'Kanit-Regular';
  }
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  // Extract font weight from style to determine correct font family for Android/iOS
  const flattenedStyle = StyleSheet.flatten(style);
  const typeStyle = styles[type];
  const weight = flattenedStyle?.fontWeight || typeStyle?.fontWeight || '400';
  const fontFamily = flattenedStyle?.fontFamily || getKanitFont(weight as any);

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        typeStyle,
        style,
        { fontFamily }, // Ensure correct font family is applied last
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  smallBold: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
  },
  link: {
    lineHeight: 24,
    fontSize: 14,
    fontWeight: '400',
  },
  linkPrimary: {
    lineHeight: 24,
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '500',
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: '400',
    fontSize: 12,
  },
});
