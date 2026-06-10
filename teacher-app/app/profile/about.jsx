import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { Colors } from '../../src/constants/colors';
import { rs } from '../../src/constants/layout';
import { Typography } from '../../src/constants/typography';

const FEATURES = [
  { icon: 'wifi-outline',             label: 'Wi-Fi Attendance Verification' },
  { icon: 'qr-code-outline',          label: 'QR Code + Selfie Attendance' },
  { icon: 'location-outline',         label: 'GPS Location Validation' },
  { icon: 'shield-checkmark-outline', label: 'VPN & Mock GPS Detection' },
  { icon: 'calendar-outline',         label: 'Monthly Attendance History' },
  { icon: 'lock-closed-outline',      label: 'Secure JWT Authentication' },
];

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScreenHeader title="About App" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + rs(40) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo + version */}
        <View style={styles.hero}>
          <View style={styles.logoCircle}>
            <Ionicons name="location" size={rs(36)} color={Colors.teal} />
          </View>
          <Text style={styles.appName}>TeacherAttendance</Text>
          <Text style={styles.tagline}>Every Check-In, Every Day Counts</Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </View>
        </View>

        <Text style={styles.description}>
          TeacherAttendance is a secure, multi-tenant SaaS platform designed to digitise teacher attendance management across schools.
          Built for reliability, fraud prevention, and simplicity.
        </Text>

        <Text style={styles.sectionTitle}>Features</Text>
        <View style={styles.featureList}>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons name={f.icon} size={rs(16)} color={Colors.teal} />
              </View>
              <Text style={styles.featureLabel}>{f.label}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.link}
          onPress={() => Linking.openURL('https://teacherattendance.com')}
        >
          <Ionicons name="globe-outline" size={rs(16)} color={Colors.teal} />
          <Text style={styles.linkText}>teacherattendance.com</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.link}
          onPress={() => Linking.openURL('mailto:support@teacherattendance.com')}
        >
          <Ionicons name="mail-outline" size={rs(16)} color={Colors.teal} />
          <Text style={styles.linkText}>support@teacherattendance.com</Text>
        </TouchableOpacity>

        <Text style={styles.copyright}>© {new Date().getFullYear()} TeacherAttendance. All rights reserved.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: Colors.bg },
  scroll:       { padding: rs(20) },
  hero:         { alignItems: 'center', marginBottom: rs(24) },
  logoCircle:   {
    width: rs(80), height: rs(80), borderRadius: rs(40),
    backgroundColor: Colors.tealLight, justifyContent: 'center', alignItems: 'center',
    marginBottom: rs(12), borderWidth: 2, borderColor: Colors.tealAccent,
  },
  appName:      { ...Typography.h2, color: Colors.textDark, marginBottom: rs(4) },
  tagline:      { ...Typography.body2, color: Colors.textMid, marginBottom: rs(10) },
  versionBadge: { backgroundColor: Colors.tealLight, paddingHorizontal: rs(14), paddingVertical: rs(4), borderRadius: rs(20) },
  versionText:  { ...Typography.body3, color: Colors.teal, fontFamily: 'Poppins_600SemiBold' },
  description:  { ...Typography.body1, color: Colors.textMid, lineHeight: rs(24), marginBottom: rs(24) },
  sectionTitle: { ...Typography.h4, color: Colors.textDark, marginBottom: rs(12) },
  featureList:  {
    backgroundColor: Colors.bgCard, borderRadius: rs(14), padding: rs(4),
    marginBottom: rs(24),
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 3,
  },
  featureRow:   { flexDirection: 'row', alignItems: 'center', gap: rs(12), padding: rs(12) },
  featureIcon:  { width: rs(32), height: rs(32), borderRadius: rs(16), backgroundColor: Colors.tealLight, justifyContent: 'center', alignItems: 'center' },
  featureLabel: { ...Typography.label, color: Colors.textDark },
  link:         { flexDirection: 'row', alignItems: 'center', gap: rs(8), paddingVertical: rs(12), borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  linkText:     { ...Typography.body1, color: Colors.teal },
  copyright:    { ...Typography.caption, color: Colors.textLight, textAlign: 'center', marginTop: rs(24) },
});
