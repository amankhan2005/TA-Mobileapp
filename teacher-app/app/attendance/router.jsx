import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { settingsService } from '../../src/api/settings.service';
import { attendanceService } from '../../src/api/attendance.service';
import useAttendanceStore from '../../src/store/attendanceStore';
import useOfflineStore from '../../src/store/offlineStore';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { Colors } from '../../src/constants/colors';
import { rs } from '../../src/constants/layout';
import { Typography } from '../../src/constants/typography';
import { getTodayString } from '../../src/utils/formatDate';

export default function AttendanceRouterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const setTodayRecord = useAttendanceStore(s => s.setTodayRecord);
  const pendingQueue = useOfflineStore(s => s.queue);

  const [settings, setSettings] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    const init = async () => {
      const today = getTodayString();

      // Check pending offline queue first
      if (pendingQueue.some(e => e.date === today)) {
        router.replace('/(tabs)');
        return;
      }

      try {
        // Check if already marked today
        const histData = await attendanceService.getHistory({
          month: new Date().getMonth() + 1,
          year:  new Date().getFullYear(),
        });
        const alreadyMarked = (histData.records || []).some(r => r.date === today);
        if (alreadyMarked) {
          const rec = histData.records.find(r => r.date === today);
          setTodayRecord(rec);
          router.replace('/(tabs)');
          return;
        }

        // Fetch settings for mode routing
        const settingsData = await settingsService.getSettings();
        const s = settingsData.settings;
        setSettings(s);

        const wifi = s?.wifiAttendanceEnabled;
        const qr   = s?.qrAttendanceEnabled;

        // Auto-route if only one mode
        if (wifi && !qr) { router.replace('/attendance/wifi'); return; }
        if (!wifi && qr)  { router.replace('/attendance/qr');   return; }
        // Both enabled — show choice (fall through to render)
        // Both disabled — show error (fall through to render)
      } catch (err) {
        if (err?.isNetworkError) {
          // Offline — only WiFi queue mode available
          setSettings({ wifiAttendanceEnabled: true, qrAttendanceEnabled: false });
        } else {
          setError(err?.message || 'Unable to load attendance settings. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  if (loading) return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScreenHeader title="Mark Attendance" />
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.teal} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    </View>
  );

  if (error) return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScreenHeader title="Mark Attendance" />
      <View style={styles.center}>
        <View style={styles.errIcon}>
          <Ionicons name="cloud-offline-outline" size={rs(40)} color={Colors.textLight} />
        </View>
        <Text style={styles.errTitle}>Unable to Load</Text>
        <Text style={styles.errText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); setError(null); }}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backBtn} onPress={() => { if (router.canGoBack()) router.back(); else router.replace("/(tabs)"); }}>
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const wifi = settings?.wifiAttendanceEnabled;
  const qr   = settings?.qrAttendanceEnabled;

  if (!wifi && !qr) return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScreenHeader title="Mark Attendance" />
      <View style={styles.center}>
        <View style={styles.errIcon}>
          <Ionicons name="information-circle-outline" size={rs(40)} color={Colors.textLight} />
        </View>
        <Text style={styles.errTitle}>No Attendance Mode</Text>
        <Text style={styles.errText}>Your school administrator has not enabled any attendance mode yet. Please contact your admin.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => { if (router.canGoBack()) router.back(); else router.replace("/(tabs)"); }}>
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScreenHeader title="Mark Attendance" />
      <View style={styles.body}>
        <Text style={styles.chooseTitle}>Choose Attendance Mode</Text>

        {wifi && (
          <ModeCard
            icon="wifi"
            title="Wi-Fi Attendance"
            sub="Mark attendance using school Wi-Fi and location"
            onPress={() => router.push('/attendance/wifi')}
          />
        )}
        {qr && (
          <ModeCard
            icon="qr-code"
            title="QR Code Attendance"
            sub="Scan QR code and take selfie to mark attendance"
            onPress={() => router.push('/attendance/qr')}
          />
        )}
      </View>
    </View>
  );
}

function ModeCard({ icon, title, sub, onPress }) {
  return (
    <TouchableOpacity style={styles.modeCard} onPress={onPress} activeOpacity={0.82}>
      <View style={styles.modeIcon}>
        <Ionicons name={icon} size={rs(32)} color={Colors.teal} />
      </View>
      <View style={styles.modeInfo}>
        <Text style={styles.modeTitle}>{title}</Text>
        <Text style={styles.modeSub}>{sub}</Text>
      </View>
      <Ionicons name="chevron-forward" size={rs(20)} color={Colors.textLight} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen:      { flex: 1, backgroundColor: Colors.bg },
  body:        { flex: 1, padding: rs(20) },
  chooseTitle: { ...Typography.h3, color: Colors.textDark, marginBottom: rs(20) },

  modeCard:    {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgCard, borderRadius: rs(16), padding: rs(20), marginBottom: rs(14),
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 12, elevation: 4,
  },
  modeIcon:    { width: rs(64), height: rs(64), borderRadius: rs(32), backgroundColor: Colors.tealLight, justifyContent: 'center', alignItems: 'center', marginRight: rs(16) },
  modeInfo:    { flex: 1 },
  modeTitle:   { ...Typography.h4, color: Colors.textDark, marginBottom: rs(4) },
  modeSub:     { ...Typography.body2, color: Colors.textMid, lineHeight: rs(18) },

  center:      { flex: 1, justifyContent: 'center', alignItems: 'center', padding: rs(32) },
  loadingText: { ...Typography.body2, color: Colors.textMid, marginTop: rs(12) },
  errIcon:     { width: rs(80), height: rs(80), borderRadius: rs(40), backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: rs(16) },
  errTitle:    { ...Typography.h4, color: Colors.textDark, marginBottom: rs(8) },
  errText:     { ...Typography.body1, color: Colors.textMid, textAlign: 'center', lineHeight: rs(22), marginBottom: rs(24) },
  retryBtn:    { backgroundColor: Colors.teal, paddingHorizontal: rs(32), paddingVertical: rs(12), borderRadius: rs(12), marginBottom: rs(12) },
  retryText:   { ...Typography.btn, color: Colors.textWhite },
  backBtn:     { paddingVertical: rs(10) },
  backText:    { ...Typography.label, color: Colors.textMid },
});
