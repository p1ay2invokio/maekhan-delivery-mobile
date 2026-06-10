import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { CartProvider } from '@/hooks/use-cart';
import { GlobalSocketListener } from '@/components/global-socket-listener';
import "../global.css"

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    'Kanit-Thin': require('../../assets/fonts/Kanit-Thin.ttf'),
    'Kanit-ExtraLight': require('../../assets/fonts/Kanit-ExtraLight.ttf'),
    'Kanit-Light': require('../../assets/fonts/Kanit-Light.ttf'),
    'Kanit-Regular': require('../../assets/fonts/Kanit-Regular.ttf'),
    'Kanit-Medium': require('../../assets/fonts/Kanit-Medium.ttf'),
    'Kanit-SemiBold': require('../../assets/fonts/Kanit-SemiBold.ttf'),
    'Kanit-Bold': require('../../assets/fonts/Kanit-Bold.ttf'),
    'Kanit-ExtraBold': require('../../assets/fonts/Kanit-ExtraBold.ttf'),
    'Kanit-Black': require('../../assets/fonts/Kanit-Black.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <CartProvider>
      <GlobalSocketListener />
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <AnimatedSplashOverlay />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="home" />
          <Stack.Screen name="cart" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="admin" />
          <Stack.Screen name="product/[id]" />
        </Stack>
      </ThemeProvider>
    </CartProvider>
  );
}
