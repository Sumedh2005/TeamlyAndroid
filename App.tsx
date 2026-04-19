import { useCallback } from 'react';
import { View, LogBox } from 'react-native';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import AppNavigator from './src/navigation/AppNavigator';

SplashScreen.preventAutoHideAsync();

LogBox.ignoreLogs([
  'AuthApiError: Invalid Refresh Token: Refresh Token Not Found',
  'Non-serializable values were found in the navigation state',
]);

const originalConsoleError = console.error;
console.error = (...args) => {
  const errorString = args.map(arg => 
    typeof arg === 'string' ? arg : arg?.message || arg?.toString() || ''
  ).join(' ');
  
  if (errorString.includes('AuthApiError: Invalid Refresh Token: Refresh Token Not Found')) {
    return;
  }
  originalConsoleError(...args);
};

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View onLayout={onLayoutRootView} style={{ flex: 1 }}>
      <AppNavigator />
    </View>
  );
}