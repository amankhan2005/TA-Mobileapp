import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Animated, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '../src/utils/secureStorage';
import { Button } from '../src/components/ui/Button';
import { Colors } from '../src/constants/colors';
import { Layout, rs } from '../src/constants/layout';
import { Typography } from '../src/constants/typography';

const SECTIONS = [
  {
    icon: 'shield-checkmark-outline',
    title: '1. Data Privacy & Security',
    body: `TeacherAttendance collects only the minimum data required to verify your attendance. This includes your GPS location (only during attendance marking), WiFi network information (SSID and gateway IP), a live selfie photo when using QR attendance mode, and your device identifier for security purposes.\n\nAll data is encrypted in transit using HTTPS/TLS and stored securely on our servers. We never sell, share, or monetise your personal data. Your attendance records are accessible only by your school administrator and authorised platform personnel.`,
  },
  {
    icon: 'location-outline',
    title: '2. Location & Network Access',
    body: `The app requests foreground location access to verify that you are physically present within your school premises when marking attendance. Location data is sent to the server only at the moment of marking attendance and is not tracked continuously or in the background.\n\nWiFi network details (network name and gateway IP) are used solely to confirm you are connected to your school's registered network. No network traffic is monitored or intercepted.`,
  },
  {
    icon: 'camera-outline',
    title: '3. Camera & Selfie Capture',
    body: `When using QR + Selfie attendance mode, the app opens your front camera to capture a live photo. This selfie is uploaded to our secure cloud storage (Cloudinary) and linked to your attendance record as proof of physical presence.\n\nPhotos are used exclusively for attendance verification by your school administrator. You may request deletion of your photos by contacting your school administrator.`,
  },
  {
    icon: 'phone-portrait-outline',
    title: '4. Device Identifier',
    body: `A unique device identifier is generated when you first install the app. This identifier helps detect suspicious activity, such as attendance being marked from multiple devices simultaneously. The identifier is stored securely on your device and never used for advertising or tracking outside the app.`,
  },
  {
    icon: 'people-outline',
    title: '5. Teacher Attendance Consent',
    body: `By using TeacherAttendance, you acknowledge and consent to the collection and processing of your attendance data as described in these terms. Attendance records are maintained by your school and may be used for payroll, compliance, and reporting purposes as determined by your school administration.\n\nYou have the right to request access to your attendance records from your school administrator at any time.`,
  },
  {
    icon: 'settings-outline',
    title: '6. App Usage',
    body: `This app is provided for legitimate attendance tracking purposes only. Attempting to falsify attendance through VPN usage, mock GPS applications, or any other fraudulent means is strictly prohibited and may result in disciplinary action by your school.\n\nThe app is for teacher use only. Sharing your login credentials with any other person is a violation of these terms.`,
  },
  {
    icon: 'refresh-outline',
    title: '7. Updates to These Terms',
    body: `These Terms & Conditions may be updated from time to time. When significant changes are made, you will be required to review and accept the updated terms before continuing to use the app. Continued use of the app after accepting updates constitutes your agreement to the revised terms.\n\nFor questions or concerns, contact support at support@teacherattendance.com or visit teacherattendance.com.`,
  },
];

export default function TermsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const checkAnim = useRef(new Animated.Value(0)).current;

  const handleScroll = ({ nativeEvent }) => {
    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
    const isAtBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;
    if (isAtBottom) setHasScrolledToBottom(true);
  };

  const toggleAgreed = () => {
    const next = !agreed;
    setAgreed(next);
    Animated.spring(checkAnim, {
      toValue: next ? 1 : 0, useNativeDriver: true, tension: 120, friction: 8,
    }).start();
  };

  const handleContinue = async () => {
    if (!agreed) return;
    setLoading(true);
    await storage.setTermsAgreed();
    router.replace('/auth/login');
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient colors={[Colors.navy, Colors.navyLight]} style={styles.header}>
        <View style={styles.logoRow}>
          <Ionicons name="shield-checkmark" size={rs(28)} color={Colors.teal} />
          <View style={styles.logoText}>
            <Text style={styles.logoName}>TeacherAttendance</Text>
            <Text style={styles.logoSub}>Every Check-In, Every Day Counts</Text>
          </View>
        </View>
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <Text style={styles.headerSub}>Please read and accept before continuing</Text>
      </LinearGradient>

      {/* Scrollable content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={32}
      >
        <Text style={styles.intro}>
          Welcome to TeacherAttendance. These Terms & Conditions govern your use of the app
          and explain how we collect, use, and protect your data. Please read them carefully.
        </Text>

        {SECTIONS.map((section, i) => (
          <View key={i} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons name={section.icon} size={rs(18)} color={Colors.teal} />
              </View>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}

        <View style={styles.divider} />
        <Text style={styles.lastUpdated}>Last updated: June 2025 · Version 1.0</Text>
      </ScrollView>

      {/* Footer — accept + button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + rs(16) }]}>
        {!hasScrolledToBottom && (
          <View style={styles.scrollHint}>
            <Ionicons name="arrow-down-circle-outline" size={rs(16)} color={Colors.textMid} />
            <Text style={styles.scrollHintText}>Scroll to read all terms</Text>
          </View>
        )}

        <TouchableOpacity style={styles.checkRow} onPress={toggleAgreed} activeOpacity={0.75}>
          <Animated.View style={[
            styles.checkbox,
            { backgroundColor: agreed ? Colors.teal : Colors.bgCard, transform: [{ scale: checkAnim.interpolate({ inputRange: [0,1], outputRange: [1, 1.05] }) }] },
          ]}>
            {agreed && <Ionicons name="checkmark" size={rs(14)} color={Colors.textWhite} />}
          </Animated.View>
          <Text style={styles.checkLabel}>
            I have read and agree to the{' '}
            <Text style={styles.checkLabelBold}>Terms & Conditions</Text>
            {' '}and{' '}
            <Text style={styles.checkLabelBold}>Privacy Policy</Text>
          </Text>
        </TouchableOpacity>

        <Button
          title="Continue"
          onPress={handleContinue}
          loading={loading}
          disabled={!agreed}
          style={styles.btn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: Colors.bg },
  header:       { paddingHorizontal: rs(24), paddingTop: rs(20), paddingBottom: rs(24) },
  logoRow:      { flexDirection: 'row', alignItems: 'center', gap: rs(10), marginBottom: rs(16) },
  logoText:     {},
  logoName:     { ...Typography.h4, color: Colors.textWhite },
  logoSub:      { ...Typography.caption, color: Colors.tealAccent },
  headerTitle:  { ...Typography.h2, color: Colors.textWhite, marginBottom: rs(4) },
  headerSub:    { ...Typography.body2, color: 'rgba(255,255,255,0.7)' },

  scroll:       { flex: 1 },
  scrollContent:{ padding: rs(20), paddingBottom: rs(40) },
  intro:        { ...Typography.body2, color: Colors.textMid, lineHeight: rs(22), marginBottom: rs(20) },

  section:      { marginBottom: rs(20) },
  sectionHeader:{ flexDirection: 'row', alignItems: 'center', gap: rs(10), marginBottom: rs(8) },
  sectionIcon:  {
    width: rs(34), height: rs(34), borderRadius: rs(17),
    backgroundColor: Colors.tealLight, justifyContent: 'center', alignItems: 'center',
  },
  sectionTitle: { ...Typography.label, color: Colors.textDark, flex: 1 },
  sectionBody:  { ...Typography.body2, color: Colors.textMid, lineHeight: rs(22) },
  divider:      { height: 1, backgroundColor: Colors.border, marginVertical: rs(16) },
  lastUpdated:  { ...Typography.caption, color: Colors.textLight, textAlign: 'center' },

  footer:       {
    backgroundColor: Colors.bgCard,
    paddingTop: rs(16), paddingHorizontal: rs(20),
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 8,
  },
  scrollHint:   { flexDirection: 'row', alignItems: 'center', gap: rs(6), justifyContent: 'center', marginBottom: rs(12) },
  scrollHintText:{ ...Typography.caption, color: Colors.textMid },

  checkRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: rs(12), marginBottom: rs(16) },
  checkbox:     {
    width: rs(22), height: rs(22), borderRadius: rs(6),
    borderWidth: 2, borderColor: Colors.teal,
    justifyContent: 'center', alignItems: 'center', marginTop: rs(1),
  },
  checkLabel:   { ...Typography.body2, color: Colors.textMid, flex: 1, lineHeight: rs(20) },
  checkLabelBold:{ fontFamily: 'Poppins_600SemiBold', color: Colors.navy },
  btn:          {},
});
