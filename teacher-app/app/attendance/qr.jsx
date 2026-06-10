import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, TextInput,
  KeyboardAvoidingView, Platform, Animated, Easing, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../../src/components/ui/Button';
import { Colors } from '../../src/constants/colors';
import { rs } from '../../src/constants/layout';
import { Typography } from '../../src/constants/typography';

const { width: SW, height: SH } = Dimensions.get('window');
const FRAME    = rs(260);   // scanner frame size
const CORNER   = rs(28);    // corner bracket arm length
const CBORDER  = 3;         // corner bracket thickness
const OVERLAY  = 'rgba(6,18,30,0.78)';   // deep navy-dark overlay

// ─── Animated scan line ──────────────────────────────────────────────────────
function ScanLine() {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1, duration: 1900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0, duration: 1900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, FRAME - rs(3)],
  });

  return (
    <Animated.View
      style={[styles.scanLine, { transform: [{ translateY }] }]}
      pointerEvents="none"
    >
      {/* Gradient line: transparent → teal → teal → transparent */}
      <LinearGradient
        colors={['transparent', Colors.teal + '55', Colors.teal + 'EE', Colors.teal, Colors.teal + 'EE', Colors.teal + '55', 'transparent']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.scanLineGradient}
      />
    </Animated.View>
  );
}

// ─── Corner bracket: top-left shape, rotated per position ───────────────────
function CornerBracket({ position }) {
  const rotation = {
    tl: '0deg', tr: '90deg', bl: '270deg', br: '180deg',
  }[position];
  const placement = {
    tl: { top: 0,    left: 0    },
    tr: { top: 0,    right: 0   },
    bl: { bottom: 0, left: 0    },
    br: { bottom: 0, right: 0   },
  }[position];

  return (
    <View style={[styles.cornerWrap, placement, { transform: [{ rotate: rotation }] }]}>
      {/* Horizontal arm */}
      <View style={[styles.cornerArm, styles.cornerArmH]} />
      {/* Vertical arm */}
      <View style={[styles.cornerArm, styles.cornerArmV]} />
    </View>
  );
}

// ─── Success flash overlay ───────────────────────────────────────────────────
function SuccessFlash({ visible }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    Animated.sequence([
      Animated.timing(opacity, { toValue: 0.7, duration: 100, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0,   duration: 500, useNativeDriver: true }),
    ]).start();
  }, [visible]);

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.successFlash, { opacity }]}
      pointerEvents="none"
    />
  );
}

// ─── Permission screen (shared layout) ──────────────────────────────────────
function PermScreen({ iconName, iconColor, iconBg, title, body, primaryLabel, onPrimary, secondaryLabel, onSecondary, extra }) {
  return (
    <View style={styles.permScreen}>
      <View style={[styles.permIconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={iconName} size={rs(44)} color={iconColor} />
      </View>
      <Text style={styles.permTitle}>{title}</Text>
      <Text style={styles.permBody}>{body}</Text>
      {primaryLabel && (
        <TouchableOpacity style={[styles.permBtn, { backgroundColor: iconColor }]} onPress={onPrimary} activeOpacity={0.85}>
          <Text style={styles.permBtnText}>{primaryLabel}</Text>
        </TouchableOpacity>
      )}
      {secondaryLabel && (
        <TouchableOpacity style={styles.permSecondary} onPress={onSecondary}>
          <Text style={styles.permSecondaryText}>{secondaryLabel}</Text>
        </TouchableOpacity>
      )}
      {extra}
    </View>
  );
}

// ─── Manual code modal ───────────────────────────────────────────────────────
function ManualModal({ visible, value, onChange, onSubmit, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOuter}
      >
        <TouchableOpacity style={styles.modalDismiss} onPress={onClose} activeOpacity={1} />
        <View style={styles.modalCard}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Enter QR Code</Text>
          <Text style={styles.modalSub}>
            Paste or type the attendance code provided by your administrator.
          </Text>
          <TextInput
            style={styles.modalInput}
            value={value}
            onChangeText={onChange}
            placeholder="Attendance code"
            placeholderTextColor={Colors.textLight}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={onSubmit}
          />
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalCancel} onPress={onClose}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Button
              title="Continue"
              onPress={onSubmit}
              disabled={!value?.trim()}
              style={styles.modalConfirm}
              fullWidth={false}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Main QR Scanner Screen
// ═══════════════════════════════════════════════════════════════════════════
export default function QRScannerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();

  const [scanned,    setScanned]    = useState(false);
  const [showFlash,  setShowFlash]  = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualCode, setManualCode] = useState('');

  // Request permission on mount if needed
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission]);

  const handleScanned = useCallback(({ data }) => {
    if (scanned || !data?.trim()) return;
    setScanned(true);
    setShowFlash(true);
    // Short delay for success flash before navigating
    setTimeout(() => {
      router.push({ pathname: '/attendance/selfie', params: { qrToken: data.trim() } });
    }, 280);
  }, [scanned]);

  const handleManualSubmit = useCallback(() => {
    const code = manualCode.trim();
    if (!code) return;
    setShowManual(false);
    router.push({ pathname: '/attendance/selfie', params: { qrToken: code } });
  }, [manualCode]);

  const handleRescan = useCallback(() => {
    setScanned(false);
    setShowFlash(false);
  }, []);

  // ── Permission: permanently denied ────────────────────────────────────────
  if (permission && !permission.granted && !permission.canAskAgain) {
    return (
      <PermScreen
        iconName="camera-off-outline"
        iconColor={Colors.textMid}
        iconBg="#F1F5F9"
        title="Camera Access Denied"
        body="Camera permission was denied. Go to Settings → Privacy → Camera and enable access for TeacherAttendance."
        primaryLabel="Go Back"
        onPrimary={() => { if (router.canGoBack()) router.back(); else router.replace("/(tabs)"); }}
        secondaryLabel="Enter Code Manually"
        onSecondary={() => setShowManual(true)}
        extra={
          <ManualModal visible={showManual} value={manualCode} onChange={setManualCode}
            onSubmit={handleManualSubmit} onClose={() => setShowManual(false)} />
        }
      />
    );
  }

  // ── Permission: requesting ─────────────────────────────────────────────────
  if (!permission?.granted) {
    return (
      <PermScreen
        iconName="camera-outline"
        iconColor={Colors.teal}
        iconBg={Colors.tealLight}
        title="Camera Access Required"
        body="TeacherAttendance needs camera access to scan the QR attendance code shown by your school administrator."
        primaryLabel="Allow Camera"
        onPrimary={requestPermission}
        secondaryLabel="Go Back"
        onSecondary={() => { if (router.canGoBack()) router.back(); else router.replace("/(tabs)"); }}
      />
    );
  }

  // ── Main scanner ───────────────────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      {/* Live camera — fills entire screen */}
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />

      {/* ── Dark overlay with transparent cutout ─────────────────────────── */}
      {/* Top strip */}
      <View style={[styles.overlayStrip, { height: (SH - FRAME) / 2 }]} />
      {/* Middle row: left | FRAME | right */}
      <View style={[styles.overlayRow, { height: FRAME }]}>
        <View style={[styles.overlaySide, { width: (SW - FRAME) / 2 }]} />
        {/* ── Scanner frame ─────────────────────────────────────────────── */}
        <View style={styles.frameContainer}>
          <CornerBracket position="tl" />
          <CornerBracket position="tr" />
          <CornerBracket position="bl" />
          <CornerBracket position="br" />
          {/* Animated scan line — only when not yet scanned */}
          {!scanned && <ScanLine />}
          {/* Scanned checkmark */}
          {scanned && (
            <View style={styles.scannedOverlay}>
              <View style={styles.scannedCheck}>
                <Ionicons name="checkmark" size={rs(36)} color="#fff" />
              </View>
            </View>
          )}
        </View>
        <View style={[styles.overlaySide, { width: (SW - FRAME) / 2 }]} />
      </View>
      {/* Bottom strip */}
      <View style={[styles.overlayStrip, { flex: 1 }]} />

      {/* ── Success flash ──────────────────────────────────────────────────── */}
      <SuccessFlash visible={showFlash} />

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <View style={[styles.topBar, { paddingTop: insets.top + rs(6) }]}>
        <TouchableOpacity
          onPress={() => { if (router.canGoBack()) router.back(); else router.replace("/(tabs)"); }}
          style={styles.topIconBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View style={styles.topIconBg}>
            <Ionicons name="arrow-back" size={rs(20)} color="#fff" />
          </View>
        </TouchableOpacity>

        <Text style={styles.topTitle}>Scan QR Code</Text>

        {/* Placeholder to center title */}
        <View style={styles.topIconBtn} />
      </View>

      {/* ── Instruction below top bar ─────────────────────────────────────── */}
      <View style={styles.instructionRow} pointerEvents="none">
        <Text style={styles.instructionText}>
          Align the QR code within the frame
        </Text>
      </View>

      {/* ── Status badge (scanning / success) ────────────────────────────── */}
      <View style={styles.statusRow} pointerEvents="none">
        {scanned ? (
          <View style={[styles.statusBadge, styles.statusBadgeSuccess]}>
            <Ionicons name="checkmark-circle" size={rs(15)} color="#fff" />
            <Text style={styles.statusText}>Code detected — loading…</Text>
          </View>
        ) : (
          <View style={styles.statusBadge}>
            <Animated.View style={styles.pulsingDot} />
            <Text style={styles.statusText}>Scanning…</Text>
          </View>
        )}
      </View>

      {/* ── Bottom controls ───────────────────────────────────────────────── */}
      <View style={[styles.bottomArea, { paddingBottom: insets.bottom + rs(36) }]}>
        {scanned ? (
          <TouchableOpacity style={styles.rescanBtn} onPress={handleRescan} activeOpacity={0.82}>
            <Ionicons name="refresh" size={rs(17)} color="#fff" />
            <Text style={styles.rescanText}>Scan Again</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.manualBtn} onPress={() => setShowManual(true)} activeOpacity={0.75}>
            <Text style={styles.manualBtnText}>Enter Code Manually</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Manual code modal ─────────────────────────────────────────────── */}
      <ManualModal
        visible={showManual}
        value={manualCode}
        onChange={setManualCode}
        onSubmit={handleManualSubmit}
        onClose={() => setShowManual(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },

  // ── Overlay cutout system ────────────────────────────────────────────────
  overlayStrip:  { width: '100%', backgroundColor: OVERLAY },
  overlayRow:    { flexDirection: 'row' },
  overlaySide:   { backgroundColor: OVERLAY },
  frameContainer:{
    width: FRAME, height: FRAME,
    position: 'relative',
  },

  // ── Corner brackets ──────────────────────────────────────────────────────
  cornerWrap:  { position: 'absolute', width: CORNER, height: CORNER },
  cornerArm:   { position: 'absolute', backgroundColor: Colors.teal, borderRadius: 2 },
  cornerArmH:  { top: 0, left: 0, width: CORNER, height: CBORDER },
  cornerArmV:  { top: 0, left: 0, width: CBORDER, height: CORNER },

  // ── Scan line ────────────────────────────────────────────────────────────
  scanLine: {
    position: 'absolute',
    left: rs(4), right: rs(4),
    height: rs(2),
    zIndex: 2,
  },
  scanLineGradient: { flex: 1, height: rs(2) },

  // ── Scanned state overlay ────────────────────────────────────────────────
  scannedOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(19,198,179,0.18)',
  },
  scannedCheck: {
    width: rs(64), height: rs(64), borderRadius: rs(32),
    backgroundColor: Colors.teal,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: Colors.teal, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 12, elevation: 8,
  },

  // ── Success flash ────────────────────────────────────────────────────────
  successFlash: { backgroundColor: Colors.teal },

  // ── Top bar ──────────────────────────────────────────────────────────────
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: rs(16), paddingBottom: rs(10),
    zIndex: 10,
  },
  topIconBtn:  { width: rs(40), alignItems: 'center' },
  topIconBg:   {
    width: rs(36), height: rs(36), borderRadius: rs(18),
    backgroundColor: 'rgba(0,0,0,0.40)',
    justifyContent: 'center', alignItems: 'center',
  },
  topTitle:    { ...Typography.h4, color: '#fff', textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },

  // ── Instruction ──────────────────────────────────────────────────────────
  instructionRow: {
    position: 'absolute',
    top: (SH - FRAME) / 2 - rs(44),
    left: 0, right: 0,
    alignItems: 'center',
    zIndex: 5,
  },
  instructionText: {
    ...Typography.body2,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // ── Status badge ─────────────────────────────────────────────────────────
  statusRow: {
    position: 'absolute',
    top: (SH + FRAME) / 2 + rs(20),
    left: 0, right: 0,
    alignItems: 'center',
    zIndex: 5,
  },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: rs(8),
    backgroundColor: 'rgba(0,0,0,0.50)',
    paddingHorizontal: rs(18), paddingVertical: rs(9),
    borderRadius: rs(24),
  },
  statusBadgeSuccess: { backgroundColor: Colors.teal + 'CC' },
  statusText: { ...Typography.body2, color: '#fff', fontFamily: 'Poppins_500Medium' },
  pulsingDot: {
    width: rs(8), height: rs(8), borderRadius: rs(4),
    backgroundColor: Colors.teal,
  },

  // ── Bottom controls ───────────────────────────────────────────────────────
  bottomArea: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  rescanBtn: {
    flexDirection: 'row', alignItems: 'center', gap: rs(8),
    backgroundColor: Colors.teal,
    paddingHorizontal: rs(28), paddingVertical: rs(13),
    borderRadius: rs(28),
    shadowColor: Colors.teal, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
  rescanText:   { ...Typography.btn, color: '#fff' },
  manualBtn:    { paddingVertical: rs(12), paddingHorizontal: rs(24) },
  manualBtnText:{ ...Typography.label, color: Colors.tealAccent, textDecorationLine: 'underline' },

  // ── Permission screens ───────────────────────────────────────────────────
  permScreen: {
    flex: 1, backgroundColor: Colors.bg,
    alignItems: 'center', justifyContent: 'center',
    padding: rs(28),
  },
  permIconWrap: {
    width: rs(100), height: rs(100), borderRadius: rs(50),
    justifyContent: 'center', alignItems: 'center',
    marginBottom: rs(24),
  },
  permTitle:     { ...Typography.h3, color: Colors.textDark, textAlign: 'center', marginBottom: rs(12) },
  permBody:      { ...Typography.body1, color: Colors.textMid, textAlign: 'center', lineHeight: rs(22), marginBottom: rs(28) },
  permBtn:       { width: '100%', height: rs(52), borderRadius: rs(14), justifyContent: 'center', alignItems: 'center', marginBottom: rs(12) },
  permBtnText:   { ...Typography.btn, color: '#fff' },
  permSecondary: { paddingVertical: rs(10) },
  permSecondaryText: { ...Typography.label, color: Colors.textMid },

  // ── Manual code modal ────────────────────────────────────────────────────
  modalOuter:   { flex: 1 },
  modalDismiss: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  modalCard:    {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: rs(24), borderTopRightRadius: rs(24),
    padding: rs(24), paddingBottom: rs(40),
  },
  modalHandle:  { width: rs(40), height: rs(4), backgroundColor: Colors.border, borderRadius: rs(2), alignSelf: 'center', marginBottom: rs(20) },
  modalTitle:   { ...Typography.h3, color: Colors.textDark, marginBottom: rs(8) },
  modalSub:     { ...Typography.body2, color: Colors.textMid, lineHeight: rs(20), marginBottom: rs(20) },
  modalInput:   {
    height: rs(52), borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: rs(12), paddingHorizontal: rs(16),
    ...Typography.body1, color: Colors.textDark,
    marginBottom: rs(20), backgroundColor: Colors.bg,
  },
  modalActions: { flexDirection: 'row', gap: rs(12), alignItems: 'center' },
  modalCancel:  {
    flex: 1, height: rs(52), borderRadius: rs(14),
    borderWidth: 1.5, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  modalCancelText: { ...Typography.btn, color: Colors.textMid },
  modalConfirm: { flex: 2 },
});
