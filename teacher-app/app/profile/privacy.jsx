import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { rs } from '../../src/constants/layout';

const LAST_UPDATED = 'June 2025';
const APP_NAME     = 'TeacherAttendance';
const CONTACT_EMAIL= 'privacy@teacherattendance.com';
const BLUE         = '#2563EB';

const SECTIONS = [
  { title: '1. Introduction', body: `${APP_NAME} ("the App") is a secure digital attendance platform provided to educational institutions. This Privacy Policy explains how we collect, use, and protect your personal information when you use the App as a teacher.\n\nBy using the App, you agree to the terms of this Privacy Policy. If you have questions, contact your school administrator or us at ${CONTACT_EMAIL}.` },
  { title: '2. Information We Collect', body: `We collect the following information solely to operate the attendance system:\n\n• Account Data — Your name, email address, and school association, provided by your school administrator.\n\n• Attendance Records — Date, time, verification method (WiFi or QR), and attendance status for each session you mark.\n\n• Location Data — Your precise GPS coordinates, used once at the moment you mark attendance to confirm you are within the approved school premises radius.\n\n• Network Information — Your WiFi connection status may be checked to confirm you are on an approved school network.\n\n• Profile Photo — An optional profile image you upload to identify yourself.\n\n• Selfie (QR Attendance) — A live photo captured at the moment of QR attendance to verify physical presence.\n\n• Support Messages — Messages you submit via the in-app support/inquiry feature.` },
  { title: '3. How We Use Your Information', body: `Your information is used exclusively for:\n\n• Verifying and recording your attendance accurately and securely\n• Preventing fraudulent or proxy attendance\n• Generating attendance reports for your school administrator\n• Providing in-app support and responding to your inquiries\n• Maintaining the security and integrity of your account` },
  { title: '4. Location Permission', body: `The App requests "While Using App" location access only — never "Always" or background location.\n\nYour GPS location is accessed only at the precise moment you initiate attendance marking. After verification, location access stops immediately.` },
  { title: '5. WiFi Verification', body: `When WiFi-based attendance is enabled by your school, the App checks whether your device is connected to an approved school network.\n\nOn iOS devices, Apple's privacy framework restricts access to WiFi network identifiers. GPS location serves as the primary verification method.` },
  { title: '6. QR Attendance and Selfie Capture', body: `QR attendance requires camera access to scan a QR code displayed in your classroom. When QR attendance is used, the App captures a live selfie photo at the time of check-in.\n\nSelfie photos are stored securely, linked to your attendance record, and viewable only by authorized school administrators. They are not used for facial recognition or biometric profiling.` },
  { title: '7. Data Storage and Security', body: `All data is transmitted using HTTPS encryption and stored on secure cloud servers with industry-standard access controls.\n\nAttendance records, selfies, and personal data are accessible only to you, authorized school administrators, and system administrators for maintenance purposes only.` },
  { title: '8. Account Deletion', body: `You may submit a request to delete your account at any time from Profile → Request Account Deletion.\n\nDeletion requests require approval from your school administrator. Upon approval, your account credentials and personal profile data will be permanently deleted.` },
  { title: '9. Required Permissions', body: `The App requests the following device permissions:\n\n• Location ("While Using App") — Required for GPS-based attendance verification.\n• Camera — Required for QR code scanning and selfie capture during attendance.\n• Photo Library (optional) — Required only if you choose to upload a profile photo.` },
  { title: '10. Contact', body: `For privacy-related questions, data access requests, or concerns, please contact:\n\n• Your school administrator (for school-level data requests)\n• Email: ${CONTACT_EMAIL}` },
];

export default function PrivacyPolicyScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScreenHeader title="Privacy Policy" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + rs(48) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Premium Banner */}
        <LinearGradient colors={['#1E40AF','#2563EB','#3B82F6']} style={styles.banner}>
          <View style={styles.bannerIcon}>
            <Ionicons name="shield-checkmark" size={rs(32)} color="#fff" />
          </View>
          <Text style={styles.bannerTitle}>{APP_NAME}</Text>
          <Text style={styles.bannerSub}>Privacy Policy · Last updated {LAST_UPDATED}</Text>
          <Text style={styles.bannerBody}>
            We are committed to protecting your privacy. This policy explains clearly what data we collect, why, and how it is used.
          </Text>
        </LinearGradient>

        {/* Sections */}
        {SECTIONS.map((sec, i) => (
          <View key={i} style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>{sec.title}</Text>
            </View>
            <Text style={styles.sectionBody}>{sec.body}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: '#F8FAFC' },
  content: { paddingHorizontal: rs(16), paddingTop: rs(16) },

  banner:     { borderRadius: rs(20), padding: rs(22), alignItems: 'center', marginBottom: rs(22) },
  bannerIcon: { width: rs(64), height: rs(64), borderRadius: rs(32), backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center', marginBottom: rs(12) },
  bannerTitle:{ fontSize: rs(20), fontFamily: 'Poppins_700Bold', color: '#fff', marginBottom: rs(4) },
  bannerSub:  { fontSize: rs(11), fontFamily: 'Poppins_500Medium', color: 'rgba(255,255,255,0.70)', marginBottom: rs(10) },
  bannerBody: { fontSize: rs(13), fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: rs(20) },

  section:         { backgroundColor: '#fff', borderRadius: rs(16), padding: rs(18), marginBottom: rs(12), shadowColor: '#0F172A', shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:8, elevation:3 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: rs(8), marginBottom: rs(10) },
  sectionDot:      { width: rs(8), height: rs(8), borderRadius: rs(4), backgroundColor: BLUE, flexShrink: 0 },
  sectionTitle:    { fontSize: rs(14), fontFamily: 'Poppins_700Bold', color: '#0F172A', flex: 1 },
  sectionBody:     { fontSize: rs(13), fontFamily: 'Poppins_400Regular', color: '#475569', lineHeight: rs(22) },
});
