import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  Platform, Dimensions, ScrollView, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useCameraPermissions } from 'expo-camera';
import { rs } from '../../constants/layout';

const { width: SW, height: SH } = Dimensions.get('window');

const STEPS = [
  {
    icon:         'location',
    gradColors:   ['#DBEAFE', '#EFF6FF'],
    iconColor:    '#2563EB',
    accentColor:  '#2563EB',
    lightBg:      '#EFF6FF',
    title:        'Location Access',
    subtitle:     'Verify you\'re at school',
    body:         'TeacherAttendance uses your GPS location only at the exact moment you mark attendance — to confirm you\'re within the school premises.',
    note:         'Your location is never collected in the background or shared with anyone.',
    iosNote:      'On iOS, location is used only while the app is open.',
  },
  {
    icon:         'wifi',
    gradColors:   ['#DCFCE7', '#F0FDF4'],
    iconColor:    '#16A34A',
    accentColor:  '#22C55E',
    lightBg:      '#F0FDF4',
    title:        'Wi-Fi Information',
    subtitle:     'Validate school network',
    body:         'The app checks you\'re connected to your school\'s Wi-Fi network — a secure second layer of verification beyond GPS.',
    note:         'Network info is checked once per attendance and never stored.',
    iosNote:      'On iOS, GPS is used as the primary verification since Apple restricts Wi-Fi details.',
  },
  {
    icon:         'camera',
    gradColors:   ['#FEE2E2', '#FFF1F2'],
    iconColor:    '#EF4444',
    accentColor:  '#EF4444',
    lightBg:      '#FFF1F2',
    title:        'Camera Access',
    subtitle:     'QR scan + identity check',
    body:         'Camera is used to scan the QR attendance code and capture a live selfie — proving you\'re physically present. This prevents proxy attendance.',
    note:         'Camera is only activated when you tap "Scan QR Code". Never activated automatically.',
    iosNote:      'Permission is only requested when you initiate a QR scan.',
  },
];

export default function PermissionOnboarding({ visible, onComplete }) {
  const [step, setStep] = useState(0);
  const [, requestCamera] = useCameraPermissions();
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const current = STEPS[step];
  const isLast  = step === STEPS.length - 1;

  const handleNext = async () => {
    // Request permissions at each step
    if (step === 0) await Location.requestForegroundPermissionsAsync().catch(() => {});
    if (step === 2) await requestCamera().catch(() => {});

    if (isLast) {
      onComplete();
      return;
    }

    // Fade transition
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    setStep(s => s + 1);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} statusBarTranslucent>
      <View style={styles.screen}>
        {/* Top gradient area */}
        <LinearGradient
          colors={current.gradColors}
          style={styles.topZone}
        >
          {/* Skip button */}
          <TouchableOpacity style={styles.skipBtn} onPress={onComplete} hitSlop={{top:10,bottom:10,left:10,right:10}}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>

          {/* Step counter */}
          <View style={styles.stepCounter}>
            <Text style={[styles.stepCountText, { color: current.iconColor }]}>{step + 1} of {STEPS.length}</Text>
          </View>

          {/* Animated icon */}
          <Animated.View style={[styles.iconWrap, { opacity: fadeAnim }]}>
            <View style={[styles.iconOuterRing, { borderColor: `${current.iconColor}25` }]}>
              <View style={[styles.iconInnerCircle, { backgroundColor: `${current.iconColor}15` }]}>
                <Ionicons name={current.icon} size={rs(52)} color={current.iconColor} />
              </View>
            </View>
          </Animated.View>
        </LinearGradient>

        {/* Content card */}
        <View style={styles.contentCard}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            bounces={false}
          >
            <Animated.View style={{ opacity: fadeAnim }}>
              {/* Title */}
              <View style={[styles.titleBadge, { backgroundColor: current.lightBg }]}>
                <Ionicons name={current.icon} size={rs(13)} color={current.iconColor} />
                <Text style={[styles.titleBadgeText, { color: current.iconColor }]}>{current.subtitle}</Text>
              </View>
              <Text style={styles.title}>{current.title}</Text>
              <Text style={styles.body}>{current.body}</Text>

              {/* Privacy note */}
              <View style={[styles.noteBox, { backgroundColor: current.lightBg, borderLeftColor: current.accentColor }]}>
                <Ionicons name="shield-checkmark-outline" size={rs(15)} color={current.accentColor} />
                <Text style={[styles.noteText, { color: current.iconColor }]}>{current.note}</Text>
              </View>

              {/* iOS note */}
              {Platform.OS === 'ios' && (
                <View style={styles.iosBox}>
                  <Ionicons name="logo-apple" size={rs(13)} color="#475569" />
                  <Text style={styles.iosText}>{current.iosNote}</Text>
                </View>
              )}
            </Animated.View>
          </ScrollView>

          {/* Progress dots */}
          <View style={styles.dots}>
            {STEPS.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === step
                    ? [styles.dotActive, { backgroundColor: current.accentColor, width: rs(22) }]
                    : i < step
                      ? { backgroundColor: `${current.accentColor}50` }
                      : {},
                ]}
              />
            ))}
          </View>

          {/* CTA Button */}
          <TouchableOpacity style={styles.ctaWrap} onPress={handleNext} activeOpacity={0.88}>
            <LinearGradient
              colors={[current.accentColor, current.iconColor]}
              start={{x:0,y:0}} end={{x:1,y:0}}
              style={styles.ctaBtn}
            >
              <Text style={styles.ctaText}>{isLast ? 'Get Started' : 'Continue'}</Text>
              <View style={styles.ctaArrow}>
                <Ionicons name={isLast ? 'checkmark' : 'arrow-forward'} size={rs(18)} color={current.accentColor} />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.legalNote}>
            Your data is protected and never sold or shared with third parties.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen:     { flex: 1, backgroundColor: '#fff' },

  topZone:    { height: SH * 0.40, justifyContent: 'center', alignItems: 'center', paddingHorizontal: rs(24), position: 'relative' },
  skipBtn:    { position: 'absolute', top: rs(56), right: rs(24), paddingHorizontal: rs(12), paddingVertical: rs(6), backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: rs(99) },
  skipText:   { fontSize: rs(13), fontFamily: 'Poppins_500Medium', color: '#64748B' },
  stepCounter:{ position: 'absolute', top: rs(56), left: rs(24) },
  stepCountText:{ fontSize: rs(13), fontFamily: 'Poppins_600SemiBold' },

  iconWrap:       { alignItems: 'center', justifyContent: 'center' },
  iconOuterRing:  { width: rs(150), height: rs(150), borderRadius: rs(75), borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  iconInnerCircle:{ width: rs(110), height: rs(110), borderRadius: rs(55), justifyContent: 'center', alignItems: 'center' },

  contentCard:    { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: rs(28), borderTopRightRadius: rs(28), marginTop: -rs(20), paddingHorizontal: rs(24), paddingTop: rs(28) },
  scrollContent:  { paddingBottom: rs(8) },

  titleBadge:      { flexDirection: 'row', alignItems: 'center', gap: rs(5), alignSelf: 'flex-start', paddingHorizontal: rs(10), paddingVertical: rs(4), borderRadius: rs(99), marginBottom: rs(10) },
  titleBadgeText:  { fontSize: rs(11), fontFamily: 'Poppins_600SemiBold' },
  title:           { fontSize: rs(24), fontFamily: 'Poppins_700Bold', color: '#0F172A', lineHeight: rs(32), marginBottom: rs(12) },
  body:            { fontSize: rs(14), fontFamily: 'Poppins_400Regular', color: '#475569', lineHeight: rs(22), marginBottom: rs(16) },

  noteBox:     { flexDirection: 'row', alignItems: 'flex-start', gap: rs(8), borderRadius: rs(12), padding: rs(14), marginBottom: rs(12), borderLeftWidth: 3 },
  noteText:    { fontSize: rs(12), fontFamily: 'Poppins_500Medium', flex: 1, lineHeight: rs(18) },

  iosBox:      { flexDirection: 'row', alignItems: 'flex-start', gap: rs(8), backgroundColor: '#F8FAFC', borderRadius: rs(10), padding: rs(12), borderWidth: 1, borderColor: '#E2E8F0' },
  iosText:     { fontSize: rs(12), fontFamily: 'Poppins_400Regular', color: '#475569', flex: 1, lineHeight: rs(18) },

  dots:       { flexDirection: 'row', justifyContent: 'center', gap: rs(6), marginVertical: rs(18) },
  dot:        { width: rs(7), height: rs(7), borderRadius: rs(4), backgroundColor: '#E2E8F0' },
  dotActive:  { height: rs(7), borderRadius: rs(4) },

  ctaWrap: { borderRadius: rs(16), overflow: 'hidden', shadowColor: '#2563EB', shadowOffset:{width:0,height:4}, shadowOpacity:0.25, shadowRadius:12, elevation:6, marginBottom: rs(14) },
  ctaBtn:  { height: rs(56), flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: rs(24) },
  ctaText: { fontSize: rs(16), fontFamily: 'Poppins_600SemiBold', color: '#fff', flex: 1, textAlign: 'center' },
  ctaArrow:{ width: rs(32), height: rs(32), borderRadius: rs(16), backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },

  legalNote: { fontSize: rs(11), fontFamily: 'Poppins_400Regular', color: '#94A3B8', textAlign: 'center', paddingBottom: rs(24) },
});
