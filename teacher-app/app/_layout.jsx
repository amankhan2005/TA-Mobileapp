import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Poppins_400Regular, Poppins_500Medium,
  Poppins_600SemiBold, Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import * as SplashScreen from 'expo-splash-screen';
import { StyleSheet } from 'react-native';
import useAuthStore from '../src/store/authStore';
import useOfflineStore from '../src/store/offlineStore';
import { ToastProvider } from '../src/components/ui/Toast';
import OptionalUpdateModal from '../src/components/ui/OptionalUpdateModal';
import { Colors } from '../src/constants/colors';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular, Poppins_500Medium,
    Poppins_600SemiBold, Poppins_700Bold,
  });
  const hydrate        = useAuthStore(s => s.hydrate);
  const hydrateOffline = useOfflineStore(s => s.hydrate);

  useEffect(() => {
    hydrate();
    hydrateOffline();
  }, []);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  useEffect(() => {
    global.__onAuthExpired = () => useAuthStore.getState().clearAuth();
    return () => { global.__onAuthExpired = null; };
  }, []);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={Colors.navy} />

        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          <Stack.Screen name="index"                   options={{ animation: 'none' }} />

          {/* ── Version screens ─────────────────────────────────────── */}
          <Stack.Screen
            name="update-required"
            options={{
              animation: 'fade',
              gestureEnabled: false,      // no swipe-back on force update
            }}
          />

          {/* ── Auth & onboarding ────────────────────────────────────── */}
          <Stack.Screen name="terms"                   options={{ animation: 'fade' }} />
          <Stack.Screen name="auth/login"              options={{ animation: 'fade' }} />

          {/* ── Main app ─────────────────────────────────────────────── */}
          <Stack.Screen name="(tabs)"                  options={{ animation: 'fade' }} />

          {/* ── Attendance flow ───────────────────────────────────────── */}
          <Stack.Screen name="attendance/router"       />
          <Stack.Screen name="attendance/wifi"         />
          <Stack.Screen
            name="attendance/qr"
            options={{ animation: 'slide_from_bottom' }}
          />
          <Stack.Screen name="attendance/selfie"       />
          <Stack.Screen
            name="attendance/success"
            options={{ animation: 'fade', gestureEnabled: false }}
          />

          {/* ── Profile ───────────────────────────────────────────────── */}
          <Stack.Screen name="profile/change-password" />
          <Stack.Screen name="profile/about"           />
          <Stack.Screen name="profile/inquiry" />
          <Stack.Screen name="profile/privacy" />
          <Stack.Screen name="profile/terms" />
          <Stack.Screen name="profile/contact-support"   />

          {/* ── Super Admin ────────────────────────────────────────── */}
          <Stack.Screen name="admin/app-version"        />
        </Stack>

        {/*
         * OptionalUpdateModal sits at root level so it floats above all routes.
         * It renders nothing when checkStatus !== 'optional'.
         * Force update never shows this modal — user is already on /update-required.
         */}
        <OptionalUpdateModal />

        <ToastProvider />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
});
