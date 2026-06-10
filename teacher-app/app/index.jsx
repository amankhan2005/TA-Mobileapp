import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import useAuthStore from '../src/store/authStore';
import useAppVersionStore from '../src/store/appVersionStore';
import { storage } from '../src/utils/secureStorage';
import { appVersionService } from '../src/api/appVersion.service';
import { needsForceUpdate, hasOptionalUpdate } from '../src/utils/semver';
import { Colors } from '../src/constants/colors';

/**
 * IndexScreen — app gate. Runs on every launch in this order:
 *   1. Wait for auth store to hydrate from SecureStore
 *   2. Run version check against backend
 *   3. Based on version result:
 *        force  → /update-required  (no bypass)
 *        optional → mark store, continue normal flow (modal shown from _layout)
 *        up-to-date / null config → continue normal flow
 *   4. Normal routing: terms → login → tabs
 *
 * The version check result is stored in appVersionStore so:
 *   - ForceUpdateScreen reads it for the title/message/store URLs
 *   - OptionalUpdateModal reads it to show the dismissible sheet
 */
export default function IndexScreen() {
  const router          = useRouter();
  const isLoading       = useAuthStore(s => s.isLoading);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const { setChecking, setUpToDate, setOptional, setForce } = useAppVersionStore();

  useEffect(() => {
    if (isLoading) return;           // wait for SecureStore hydration
    runStartup();
  }, [isLoading, isAuthenticated]);

  const runStartup = async () => {
    // ── Step 1: version check ──────────────────────────────────────────────
    setChecking();
    let destination = await resolveNormalDestination();

    const config = await appVersionService.getVersionConfig();

    if (config) {
      // Read installed version from app.json via expo-constants
      const installed = Constants.expoConfig?.version || '1.0.0';

      if (needsForceUpdate(installed, config.minimumVersion)) {
        setForce(config);
        router.replace('/update-required');
        return;                        // hard stop — nothing else runs
      }

      if (hasOptionalUpdate(installed, config.latestVersion)) {
        setOptional(config);
        // Fall through — app proceeds normally, modal shown from layout
      } else {
        setUpToDate();
      }
    } else {
      // No config or network error with stale cache expired — allow through
      setUpToDate();
    }

    // ── Step 2: normal routing ─────────────────────────────────────────────
    router.replace(destination);
  };

  const resolveNormalDestination = async () => {
    const termsAgreed = await storage.getTermsAgreed();
    if (!termsAgreed)    return '/terms';
    if (isAuthenticated) return '/(tabs)';
    return '/auth/login';
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.teal} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.navy, justifyContent: 'center', alignItems: 'center' },
});
