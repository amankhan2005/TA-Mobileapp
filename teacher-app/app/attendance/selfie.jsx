import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../src/store/authStore';
import useAttendanceStore from '../../src/store/attendanceStore';
import { attendanceService } from '../../src/api/attendance.service';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { Button } from '../../src/components/ui/Button';
import { Toast } from '../../src/components/ui/Toast';
import { Colors } from '../../src/constants/colors';
import { Layout, rs } from '../../src/constants/layout';
import { Typography } from '../../src/constants/typography';
import { formatTime, formatDateDisplay } from '../../src/utils/formatDate';

const CIRCLE = rs(230);

export default function SelfieScreen() {
  const insets = useSafeAreaInsets();
  const router  = useRouter();
  const { qrToken } = useLocalSearchParams();
  const deviceId = useAuthStore(s => s.deviceId);
  const setTodayRecord = useAttendanceStore(s => s.setTodayRecord);

  const [permission, requestPermission] = useCameraPermissions();
  const [photo,      setPhoto]     = useState(null);
  const [capturing,  setCapturing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const cameraRef = useRef(null);
  const now = new Date();

  const capturePhoto = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const pic = await cameraRef.current.takePictureAsync({
        quality: 0.75,
        base64: false,
        exif: false,
      });
      setPhoto(pic.uri);
    } catch {
      Toast.show({ message: 'Failed to capture photo. Please try again.', type: 'error' });
    } finally {
      setCapturing(false);
    }
  };

  const retake = () => setPhoto(null);

  const submitAttendance = async () => {
    if (!photo || submitting) return;
    setSubmitting(true);
    try {
      const data = await attendanceService.markQR({
        qrToken: String(qrToken),
        deviceId,
        selfieUri: photo,
      });
      setTodayRecord(data.record);
      // Clean up local selfie after successful upload
      try { await FileSystem.deleteAsync(photo, { idempotent: true }); } catch {}
      router.replace({
        pathname: '/attendance/success',
        params: { mode: 'qr', time: new Date().toISOString() },
      });
    } catch (err) {
      const msg = err?.message || 'Failed to submit attendance. Please try again.';
      if (err?.status === 409) {
        Toast.show({ message: 'Attendance already marked for today.', type: 'info' });
        router.replace('/(tabs)');
      } else if (err?.status === 400) {
        Toast.show({ message: 'QR code is invalid or expired. Ask your admin to generate a new one.', type: 'error', duration: 5000 });
        router.back();
      } else {
        Toast.show({ message: msg, type: 'error' });
        setSubmitting(false);
      }
    }
  };

  // Permission flow
  if (!permission?.granted) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <ScreenHeader title="Take Selfie" />
        <View style={styles.center}>
          <View style={styles.permIcon}>
            <Ionicons name="camera-outline" size={rs(48)} color={Colors.teal} />
          </View>
          <Text style={styles.permTitle}>Camera Required</Text>
          <Text style={styles.permSub}>
            Camera access is needed to capture your selfie for attendance verification.
          </Text>
          <Button title="Allow Camera" onPress={requestPermission} style={styles.permBtn} />
          <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.backLinkText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScreenHeader title={photo ? 'Review & Submit' : 'Take Selfie'} />

      <View style={styles.body}>
        <Text style={styles.subtitle}>
          {photo ? 'Please review your photo\nbefore submitting' : 'Take a clear selfie'}
        </Text>

        {/* Circular camera / photo preview */}
        {/* overflow:hidden on the wrapper clips the CameraView into a circle */}
        <View style={styles.circleOuter}>
          <View style={styles.circleClip}>
            {photo ? (
              <Image source={{ uri: photo }} style={styles.circleContent} resizeMode="cover" />
            ) : (
              <CameraView
                ref={cameraRef}
                style={styles.circleContent}
                facing="front"
              />
            )}
          </View>
        </View>

        {photo ? (
          // Review mode
          <>
            <View style={styles.sessionCard}>
              <Text style={styles.sessionTitle}>Session Details</Text>
              {[
                { label: 'Time', value: formatTime(now) },
                { label: 'Date', value: formatDateDisplay(now) },
                { label: 'Mode', value: 'QR Code' },
              ].map((row, i, arr) => (
                <View key={i} style={[styles.sessionRow, i < arr.length - 1 && styles.sessionBorder]}>
                  <Text style={styles.sessionLabel}>{row.label}</Text>
                  <Text style={styles.sessionValue}>{row.value}</Text>
                </View>
              ))}
            </View>

            <View style={styles.reviewActions}>
              <TouchableOpacity style={styles.retakeBtn} onPress={retake} disabled={submitting}>
                <Text style={styles.retakeText}>Retake</Text>
              </TouchableOpacity>
              <Button
                title="Submit Attendance"
                onPress={submitAttendance}
                loading={submitting}
                style={styles.submitBtn}
                fullWidth={false}
              />
            </View>
          </>
        ) : (
          // Capture mode
          <TouchableOpacity
            style={styles.captureBtn}
            onPress={capturePhoto}
            disabled={capturing}
            activeOpacity={0.85}
          >
            {capturing ? (
              <ActivityIndicator color={Colors.textWhite} size="small" />
            ) : (
              <View style={styles.captureBtnInner}>
                <Ionicons name="camera" size={rs(28)} color={Colors.textWhite} />
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: Colors.bg },
  body:         { flex: 1, alignItems: 'center', paddingHorizontal: rs(24), paddingTop: rs(8) },
  subtitle:     { ...Typography.h4, color: Colors.textDark, textAlign: 'center', marginBottom: rs(24) },

  // The key fix: overflow:hidden on a View with borderRadius clips children
  circleOuter:  { marginBottom: rs(24) },
  circleClip:   {
    width: CIRCLE + rs(8),
    height: CIRCLE + rs(8),
    borderRadius: (CIRCLE + rs(8)) / 2,
    borderWidth: rs(3),
    borderColor: Colors.teal,
    overflow: 'hidden',  // ← THIS clips CameraView into circle shape
    backgroundColor: '#000',
  },
  circleContent:{ width: CIRCLE + rs(2), height: CIRCLE + rs(2) },

  captureBtn:   {
    width: rs(72), height: rs(72), borderRadius: rs(36),
    backgroundColor: 'rgba(19,198,179,0.18)',
    justifyContent: 'center', alignItems: 'center',
  },
  captureBtnInner:{
    width: rs(58), height: rs(58), borderRadius: rs(29),
    backgroundColor: Colors.teal,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: Colors.teal, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },

  sessionCard:  {
    width: '100%', backgroundColor: Colors.bgCard, borderRadius: rs(14), padding: rs(16), marginBottom: rs(20),
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 3,
  },
  sessionTitle: { ...Typography.label, color: Colors.textDark, marginBottom: rs(10) },
  sessionRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: rs(10) },
  sessionBorder:{ borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  sessionLabel: { ...Typography.body2, color: Colors.textMid },
  sessionValue: { ...Typography.body2, color: Colors.textDark, fontFamily: 'Poppins_500Medium' },

  reviewActions:{ flexDirection: 'row', gap: rs(12), width: '100%', alignItems: 'center' },
  retakeBtn:    { flex: 1, height: rs(52), borderRadius: rs(14), borderWidth: 1.5, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  retakeText:   { ...Typography.btn, color: Colors.textMid },
  submitBtn:    { flex: 2 },

  // Permission
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center', padding: rs(28), gap: rs(12) },
  permIcon:     { width: rs(90), height: rs(90), borderRadius: rs(45), backgroundColor: Colors.tealLight, justifyContent: 'center', alignItems: 'center' },
  permTitle:    { ...Typography.h3, color: Colors.textDark, textAlign: 'center' },
  permSub:      { ...Typography.body1, color: Colors.textMid, textAlign: 'center', lineHeight: rs(22) },
  permBtn:      { width: '100%' },
  backLink:     { paddingVertical: rs(8) },
  backLinkText: { ...Typography.label, color: Colors.textMid },
});
