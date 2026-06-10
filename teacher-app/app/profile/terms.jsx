import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { Colors } from '../../src/constants/colors';
import { rs } from '../../src/constants/layout';
import { Typography } from '../../src/constants/typography';

const LAST_UPDATED = 'June 2025';
const APP_NAME = 'TeacherAttendance';
const CONTACT_EMAIL = 'support@teacherattendance.com';

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: `By downloading, installing, or using ${APP_NAME}, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you must not use the App.\n\nThese Terms apply to all users of the App, including teachers registered by their school administrators.`,
  },
  {
    title: '2. Use of the App',
    body: `${APP_NAME} is provided to you by your school for the sole purpose of recording and verifying your daily attendance. You agree to:\n\n• Use the App only for its intended attendance marking purpose\n• Mark attendance only when you are physically present at school\n• Not share your login credentials with any other person\n• Not attempt to spoof, fake, or manipulate your location or device information\n• Not use VPNs, mock GPS applications, or other tools to falsify your attendance location\n• Report any technical issues or bugs to your school administrator`,
  },
  {
    title: '3. Attendance Integrity',
    body: `Submitting false attendance records is a serious breach of these Terms and your school's policies. Proxy attendance — submitting attendance on behalf of another person — is strictly prohibited.\n\nThe App uses multiple security checks including GPS location, WiFi network verification, selfie capture, and device fingerprinting to detect and prevent fraudulent attendance. Suspicious activity is automatically flagged for administrator review.\n\nViolations may result in account suspension, termination, and reporting to your school administration.`,
  },
  {
    title: '4. Account Responsibility',
    body: `Your account is personal and non-transferable. You are responsible for:\n\n• Keeping your password secure and confidential\n• All actions performed under your account\n• Notifying your school administrator immediately if you suspect unauthorised access\n• Ensuring your device is not accessible to unauthorised users during attendance marking\n\nYou must log out of the App when using shared devices.`,
  },
  {
    title: '5. School Administrator Moderation',
    body: `Your school administrator has full authority over your account and attendance records. The administrator may:\n\n• Create, suspend, or deactivate your account\n• View all your attendance records and selfie captures\n• Review flagged or suspicious attendance attempts\n• Respond to your inquiries and support requests\n• Configure attendance modes, GPS radius, and WiFi settings\n\nDecisions made by your school administrator regarding your account are subject to your school's internal policies.`,
  },
  {
    title: '6. Intellectual Property',
    body: `${APP_NAME}, including its design, code, features, and content, is the intellectual property of its developers. You are granted a limited, non-exclusive, non-transferable licence to use the App for its intended purpose.\n\nYou may not copy, reverse engineer, distribute, or create derivative works based on the App or any part of it.`,
  },
  {
    title: '7. Account Deletion',
    body: `You may request deletion of your account at any time through the Profile section of the App. Deletion requests are reviewed by your school administrator before being processed.\n\nUpon account deletion, your personal information will be removed. Attendance records may be retained in anonymised form for school administrative and compliance purposes.`,
  },
  {
    title: '8. Disclaimer of Warranties',
    body: `The App is provided "as is" without any warranty of any kind. We do not guarantee that the App will be error-free, available at all times, or meet all your requirements.\n\nWe are not liable for any loss of attendance records caused by network issues, device failures, or force majeure events. Always confirm your attendance was recorded successfully.`,
  },
  {
    title: '9. Limitation of Liability',
    body: `To the maximum extent permitted by law, ${APP_NAME} and its developers shall not be liable for any indirect, incidental, consequential, or punitive damages arising from your use of or inability to use the App.\n\nOur total liability for any claim shall not exceed the amount you paid for the App in the twelve months preceding the claim.`,
  },
  {
    title: '10. Changes to These Terms',
    body: `We may update these Terms and Conditions from time to time. When we make significant changes, you will be notified within the App. Continued use of the App after changes are posted constitutes your acceptance of the updated Terms.`,
  },
  {
    title: '11. Contact Us',
    body: `If you have questions about these Terms and Conditions, please contact your school administrator, or reach us at:\n\n${CONTACT_EMAIL}\n\nThese Terms and Conditions are effective as of ${LAST_UPDATED}.`,
  },
];

import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const BLUE = '#2563EB';

export default function TermsScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScreenHeader title="Terms & Conditions" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + rs(48) }]}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient colors={['#1E40AF','#2563EB','#3B82F6']} style={styles.banner}>
          <View style={styles.bannerIcon}>
            <Ionicons name="document-text" size={rs(32)} color="#fff" />
          </View>
          <Text style={styles.bannerTitle}>{APP_NAME}</Text>
          <Text style={styles.bannerSub}>Terms & Conditions · Last updated {LAST_UPDATED}</Text>
          <Text style={styles.bannerBody}>
            Please read these terms carefully. By using the App, you agree to these conditions.
          </Text>
        </LinearGradient>

        {SECTIONS.map((sec, i) => (
          <View key={i} style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>{sec.title}</Text>
            </View>
            <Text style={styles.sectionBody}>{sec.body}</Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Ionicons name="checkmark-circle" size={rs(20)} color={BLUE} />
          <Text style={styles.footerText}>
            By continuing to use {APP_NAME}, you confirm you have read and agree to these Terms and Conditions.
          </Text>
        </View>
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

  footer:     { flexDirection: 'row', alignItems: 'flex-start', gap: rs(10), backgroundColor: '#EFF6FF', borderRadius: rs(14), padding: rs(16), marginBottom: rs(8) },
  footerText: { fontSize: rs(12), fontFamily: 'Poppins_400Regular', color: '#1D4ED8', lineHeight: rs(18), flex: 1 },
});
