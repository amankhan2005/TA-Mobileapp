import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, Linking, TouchableOpacity, Platform,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import useAppVersionStore from '../src/store/appVersionStore';
import { Colors } from '../src/constants/colors';
import { rs } from '../src/constants/layout';
import { Typography } from '../src/constants/typography';

/**
 * ForceUpdateScreen — full-screen block. No back button, no dismiss.
 * Shown when installed version < minimumVersion.
 */
export default function ForceUpdateScreen() {
  const insets  = useSafeAreaInsets();
  const config  = useAppVersionStore(s => s.versionConfig);

  // Block Android hardware back on this screen
  React.useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const storeUrl = Platform.OS === 'ios' ? config?.iosUrl : config?.androidUrl;

  const handleUpdate = useCallback(async () => {
    if (!storeUrl) return;
    const canOpen = await Linking.canOpenURL(storeUrl);
    if (canOpen) await Linking.openURL(storeUrl);
  }, [storeUrl]);

  const title   = config?.title   || 'Update Required';
  const message = config?.message || 'Please update TeacherAttendance to continue.';

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom + rs(24) }]}>
      {/* Navy gradient top band */}
      <LinearGradient colors={[Colors.navy, '#0D3F85']} style={styles.topBand}>
        <View style={styles.logoRow}>
          <View style={styles.logoCircle}>
            <Ionicons name="location" size={rs(24)} color={Colors.teal} />
          </View>
          <Text style={styles.logoText}>TeacherAttendance</Text>
        </View>
      </LinearGradient>

      {/* Main content */}
      <View style={styles.body}>
        {/* Icon */}
        <View style={styles.iconOuter}>
          <View style={styles.iconInner}>
            <Ionicons name="arrow-up-circle" size={rs(52)} color={Colors.textWhite} />
          </View>
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>

        {/* What's new hint */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={rs(16)} color={Colors.teal} />
          <Text style={styles.infoText}>
            The latest version includes important security improvements and bug fixes required to mark attendance.
          </Text>
        </View>

        {/* Update button */}
        <TouchableOpacity
          style={[styles.updateBtn, !storeUrl && styles.updateBtnDisabled]}
          onPress={handleUpdate}
          activeOpacity={0.85}
          disabled={!storeUrl}
        >
          <Ionicons
            name={Platform.OS === 'ios' ? 'logo-apple' : 'logo-google-playstore'}
            size={rs(20)}
            color={Colors.textWhite}
            style={{ marginRight: rs(10) }}
          />
          <Text style={styles.updateBtnText}>
            {Platform.OS === 'ios' ? 'Update on App Store' : 'Update on Play Store'}
          </Text>
        </TouchableOpacity>

        {!storeUrl && (
          <Text style={styles.noUrlText}>Store link not configured. Contact your school admin.</Text>
        )}

        <Text style={styles.versionNote}>
          {Platform.OS === 'ios' ? 'iOS' : 'Android'} · This version is no longer supported
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: Colors.bg },

  topBand:      { paddingHorizontal: rs(24), paddingTop: rs(20), paddingBottom: rs(24) },
  logoRow:      { flexDirection: 'row', alignItems: 'center' },
  logoCircle:   {
    width: rs(40), height: rs(40), borderRadius: rs(20),
    backgroundColor: 'rgba(19,198,179,0.2)', justifyContent: 'center', alignItems: 'center',
    marginRight: rs(10), borderWidth: 1.5, borderColor: 'rgba(19,198,179,0.4)',
  },
  logoText:     { ...Typography.h4, color: Colors.textWhite },

  body:         { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: rs(28) },

  iconOuter:    {
    width: rs(104), height: rs(104), borderRadius: rs(52),
    backgroundColor: Colors.tealLight,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: rs(28),
    shadowColor: Colors.teal, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 20, elevation: 8,
  },
  iconInner:    {
    width: rs(80), height: rs(80), borderRadius: rs(40),
    backgroundColor: Colors.teal,
    justifyContent: 'center', alignItems: 'center',
  },

  title:        { ...Typography.h2, color: Colors.textDark, textAlign: 'center', marginBottom: rs(12) },
  message:      { ...Typography.body1, color: Colors.textMid, textAlign: 'center', lineHeight: rs(24), marginBottom: rs(24) },

  infoBox:      {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: Colors.tealLight, borderRadius: rs(12),
    padding: rs(14), marginBottom: rs(32), width: '100%',
  },
  infoText:     { ...Typography.body2, color: Colors.teal, flex: 1, marginLeft: rs(8), lineHeight: rs(20) },

  updateBtn:    {
    width: '100%', height: rs(56), borderRadius: rs(16),
    backgroundColor: Colors.teal, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: Colors.teal, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 14, elevation: 8,
    marginBottom: rs(16),
  },
  updateBtnDisabled: { backgroundColor: Colors.textLight, shadowOpacity: 0 },
  updateBtnText:     { ...Typography.btn, color: Colors.textWhite },

  noUrlText:    { ...Typography.body2, color: Colors.textMid, textAlign: 'center', marginBottom: rs(16) },
  versionNote:  { ...Typography.caption, color: Colors.textLight, textAlign: 'center' },
});
