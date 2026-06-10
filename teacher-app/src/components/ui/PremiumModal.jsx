/**
 * PremiumModal — all custom modals.
 *
 * Fixes applied:
 * - Issue 3: PhotoActionSheet now shows ONLY "Upload from Library" (no camera, no remove)
 * - Issue 4: onCancel fires AFTER a short delay so modal closes after gallery opens
 * - Issue 5: InquirySuccessModal has X button, tap-outside-to-close, fade-out animation
 */

import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  Animated, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { rs } from '../../constants/layout';

const BLUE  = '#2563EB';
const GREEN = '#22C55E';
const RED   = '#EF4444';

const CONFIGS = {
  success: { iconBg: '#F0FDF4', iconColor: GREEN,      titleColor: '#14532D',  btnBg: GREEN,  btnShadow: 'rgba(34,197,94,0.22)'  },
  danger:  { iconBg: '#FFF5F5', iconColor: RED,        titleColor: '#7F1D1D',  btnBg: RED,    btnShadow: 'rgba(239,68,68,0.22)'   },
  warning: { iconBg: '#FFFBEB', iconColor: '#D97706',  titleColor: '#78350F',  btnBg: '#F59E0B', btnShadow: 'rgba(245,158,11,0.22)'},
  info:    { iconBg: '#EFF6FF', iconColor: BLUE,       titleColor: '#1E3A8A',  btnBg: BLUE,   btnShadow: 'rgba(37,99,235,0.22)'   },
};

// ── Base animated modal ───────────────────────────────────────────────────────
export function PremiumModal({
  visible, type = 'info', icon = 'information-circle',
  title, message,
  primaryLabel = 'OK', onPrimary,
  secondaryLabel, onSecondary,
  onClose,
  showCloseBtn = false,  // X button top-right
  closeOnBackdrop = false,
}) {
  const scale   = useRef(new Animated.Value(0.92)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const cfg     = CONFIGS[type] || CONFIGS.info;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale,   { toValue: 1, tension: 72, friction: 9, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    } else {
      // Fade out before hiding
      Animated.parallel([
        Animated.timing(scale,   { toValue: 0.92, duration: 160, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0,    duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Backdrop — optionally tappable */}
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={closeOnBackdrop ? onClose : undefined}
      >
        <Animated.View
          style={[styles.dialog, { transform: [{ scale }], opacity }]}
          onStartShouldSetResponder={() => true} // prevent backdrop tap propagating through card
        >
          {/* Optional X close button */}
          {showCloseBtn && (
            <TouchableOpacity style={styles.xBtn} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={rs(18)} color="#94A3B8" />
            </TouchableOpacity>
          )}

          {/* Icon */}
          <View style={[styles.iconRing, { backgroundColor: cfg.iconBg }]}>
            <Ionicons name={icon} size={rs(34)} color={cfg.iconColor} />
          </View>

          {/* Text */}
          <Text style={[styles.dialogTitle, { color: cfg.titleColor }]}>{title}</Text>
          {message ? <Text style={styles.dialogMsg}>{message}</Text> : null}

          {/* Buttons */}
          <View style={secondaryLabel ? styles.btnPair : styles.btnSolo}>
            {secondaryLabel && (
              <TouchableOpacity style={styles.ghostBtn} onPress={onSecondary} activeOpacity={0.72}>
                <Text style={styles.ghostBtnText}>{secondaryLabel}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.solidBtn, { backgroundColor: cfg.btnBg, shadowColor: cfg.btnShadow }]}
              onPress={onPrimary}
              activeOpacity={0.85}
            >
              <Text style={styles.solidBtnText}>{primaryLabel}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

// ── Photo Action Sheet — Gallery ONLY (Issue 3 fix) ───────────────────────────
export function PhotoActionSheet({ visible, onUpload, onCancel }) {
  const slideY  = useRef(new Animated.Value(300)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideY,  { toValue: 0, tension: 58, friction: 11, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideY,  { toValue: 300, duration: 220, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0,   duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleUpload = () => {
    // Issue 4 fix: close modal FIRST with a tiny delay so the modal is
    // dismissed before ImagePicker.launchImageLibraryAsync is called.
    // On Android, an open Modal can prevent system pickers from opening.
    onCancel(); // close immediately
    setTimeout(() => onUpload(), 350); // then open gallery after modal is gone
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <Animated.View style={[styles.sheetOverlay, { opacity }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onCancel} />
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideY }] }]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Profile Photo</Text>
          <Text style={styles.sheetMeta}>Select a photo from your gallery</Text>

          {/* Single action: Upload only */}
          <TouchableOpacity
            style={styles.sheetSingleAction}
            onPress={handleUpload}
            activeOpacity={0.75}
          >
            <View style={styles.sheetActionIcon}>
              <Ionicons name="image-outline" size={rs(22)} color={BLUE} />
            </View>
            <View style={styles.sheetActionText}>
              <Text style={styles.sheetActionLabel}>Upload from Gallery</Text>
              <Text style={styles.sheetActionSub}>Choose a photo from your library</Text>
            </View>
            <Ionicons name="chevron-forward" size={rs(16)} color="#D1D5DB" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.sheetCancel} onPress={onCancel} activeOpacity={0.72}>
            <Text style={styles.sheetCancelText}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// ── Typed shortcuts ────────────────────────────────────────────────────────────
export function LogoutModal({ visible, onConfirm, onCancel, loading }) {
  return (
    <PremiumModal
      visible={visible} type="danger" icon="log-out-outline"
      title="Log out?"
      message="You'll need to sign in again to access your records."
      primaryLabel={loading ? 'Logging out…' : 'Log Out'}
      onPrimary={onConfirm}
      secondaryLabel="Cancel" onSecondary={onCancel}
      onClose={onCancel}
    />
  );
}

export function DeleteAccountModal({ visible, onConfirm, onCancel }) {
  return (
    <PremiumModal
      visible={visible} type="danger" icon="trash-outline"
      title="Request deletion?"
      message="This sends a request to your school admin for review. Your account isn't deleted immediately."
      primaryLabel="Submit Request"
      onPrimary={onConfirm}
      secondaryLabel="Cancel" onSecondary={onCancel}
      onClose={onCancel}
    />
  );
}

// Issue 5 fix: X button + tap-outside-to-close + smooth fade-out
export function InquirySuccessModal({ visible, onClose }) {
  return (
    <PremiumModal
      visible={visible} type="success" icon="checkmark-circle"
      title="Inquiry sent"
      message="Your request has been sent to your school admin. You'll be notified when they respond."
      primaryLabel="Done"
      onPrimary={onClose}
      onClose={onClose}
      showCloseBtn={true}
      closeOnBackdrop={true}
    />
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.52)',
    justifyContent: 'center', alignItems: 'center',
    padding: rs(28),
  },
  dialog: {
    backgroundColor: '#fff', borderRadius: rs(24),
    width: '100%', maxWidth: rs(340),
    alignItems: 'center', padding: rs(28),
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.18, shadowRadius: 48, elevation: 24,
  },
  xBtn:        { position: 'absolute', top: rs(14), right: rs(14), width: rs(30), height: rs(30), borderRadius: rs(15), backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  iconRing:    { width: rs(72), height: rs(72), borderRadius: rs(36), justifyContent: 'center', alignItems: 'center', marginBottom: rs(18) },
  dialogTitle: { fontSize: rs(18), fontFamily: 'Poppins_700Bold', textAlign: 'center', marginBottom: rs(8), letterSpacing: -0.2 },
  dialogMsg:   { fontSize: rs(13), fontFamily: 'Poppins_400Regular', color: '#64748B', textAlign: 'center', lineHeight: rs(20), marginBottom: rs(24) },

  btnPair:      { flexDirection: 'row', gap: rs(10), width: '100%' },
  btnSolo:      { width: '100%' },
  ghostBtn:     { flex: 1, height: rs(46), borderRadius: rs(14), backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  ghostBtnText: { fontSize: rs(14), fontFamily: 'Poppins_600SemiBold', color: '#64748B' },
  solidBtn:     { flex: 1, height: rs(46), borderRadius: rs(14), justifyContent: 'center', alignItems: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 12, elevation: 5 },
  solidBtnText: { fontSize: rs(14), fontFamily: 'Poppins_600SemiBold', color: '#fff' },

  // Sheet
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.52)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: rs(24), borderTopRightRadius: rs(24),
    paddingHorizontal: rs(20), paddingTop: rs(14), paddingBottom: rs(40),
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.10, shadowRadius: 20, elevation: 20,
  },
  sheetHandle: { width: rs(32), height: rs(4), borderRadius: rs(2), backgroundColor: '#E2E8F0', alignSelf: 'center', marginBottom: rs(20) },
  sheetTitle:  { fontSize: rs(17), fontFamily: 'Poppins_700Bold', color: '#0F172A', marginBottom: rs(3) },
  sheetMeta:   { fontSize: rs(12), fontFamily: 'Poppins_400Regular', color: '#94A3B8', marginBottom: rs(20) },

  sheetSingleAction: {
    flexDirection: 'row', alignItems: 'center', gap: rs(14),
    backgroundColor: '#F8FAFF', borderRadius: rs(16),
    padding: rs(16), marginBottom: rs(14),
    borderWidth: 1, borderColor: '#DBEAFE',
  },
  sheetActionIcon: { width: rs(48), height: rs(48), borderRadius: rs(24), backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  sheetActionText: { flex: 1 },
  sheetActionLabel:{ fontSize: rs(15), fontFamily: 'Poppins_600SemiBold', color: '#0F172A', marginBottom: rs(2) },
  sheetActionSub:  { fontSize: rs(11), fontFamily: 'Poppins_400Regular', color: '#94A3B8' },

  sheetCancel:     { height: rs(50), borderRadius: rs(14), backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  sheetCancelText: { fontSize: rs(15), fontFamily: 'Poppins_600SemiBold', color: '#64748B' },
});
