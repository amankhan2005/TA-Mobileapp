import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  Linking, Platform, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useAppVersionStore from '../../store/appVersionStore';
import { Colors } from '../../constants/colors';
import { rs } from '../../constants/layout';
import { Typography } from '../../constants/typography';

/**
 * OptionalUpdateModal — dismissible bottom-sheet style modal.
 * Shown when installed < latestVersion but installed >= minimumVersion.
 * User can tap "Later" to proceed into the app.
 */
export default function OptionalUpdateModal() {
  const config  = useAppVersionStore(s => s.versionConfig);
  const status  = useAppVersionStore(s => s.checkStatus);
  const dismiss = useAppVersionStore(s => s.dismissOptional);

  const slideAnim = useRef(new Animated.Value(300)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;

  const visible = status === 'optional';

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }),
        Animated.timing(bgOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible || !config) return null;

  const storeUrl = Platform.OS === 'ios' ? config.iosUrl : config.androidUrl;

  const handleUpdate = async () => {
    if (!storeUrl) return;
    const canOpen = await Linking.canOpenURL(storeUrl);
    if (canOpen) {
      await Linking.openURL(storeUrl);
    }
  };

  const handleLater = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 300, duration: 220, useNativeDriver: true }),
      Animated.timing(bgOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => dismiss());
  };

  const title   = config.title   || 'Update Available';
  const message = config.message || 'A new version of TeacherAttendance is available.';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleLater}
    >
      {/* Dimmed background */}
      <Animated.View style={[styles.backdrop, { opacity: bgOpacity }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={handleLater} activeOpacity={1} />
      </Animated.View>

      {/* Slide-up card */}
      <Animated.View style={[styles.card, { transform: [{ translateY: slideAnim }] }]}>
        {/* Handle bar */}
        <View style={styles.handle} />

        {/* Icon */}
        <View style={styles.iconWrap}>
          <View style={styles.iconBg}>
            <Ionicons name="arrow-up-circle-outline" size={rs(36)} color={Colors.teal} />
          </View>
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>

        {/* Latest version badge */}
        <View style={styles.versionBadge}>
          <Ionicons name="sparkles-outline" size={rs(13)} color={Colors.teal} />
          <Text style={styles.versionText}>Version {config.latestVersion} available</Text>
        </View>

        {/* Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.laterBtn} onPress={handleLater} activeOpacity={0.75}>
            <Text style={styles.laterText}>Later</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.updateBtn, !storeUrl && styles.updateBtnDisabled]}
            onPress={handleUpdate}
            activeOpacity={0.85}
            disabled={!storeUrl}
          >
            <Ionicons
              name={Platform.OS === 'ios' ? 'logo-apple' : 'logo-google-playstore'}
              size={rs(16)}
              color={Colors.textWhite}
              style={{ marginRight: rs(6) }}
            />
            <Text style={styles.updateBtnText}>Update Now</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footnote}>You can continue using the app after updating.</Text>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop:     {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
  },
  card:         {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: rs(24), borderTopRightRadius: rs(24),
    padding: rs(24), paddingBottom: rs(40), alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12, shadowRadius: 20, elevation: 16,
  },
  handle:       { width: rs(40), height: rs(4), backgroundColor: Colors.border, borderRadius: rs(2), marginBottom: rs(20) },

  iconWrap:     { marginBottom: rs(16) },
  iconBg:       {
    width: rs(72), height: rs(72), borderRadius: rs(36),
    backgroundColor: Colors.tealLight,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: Colors.tealAccent,
  },

  title:        { ...Typography.h3, color: Colors.textDark, textAlign: 'center', marginBottom: rs(8) },
  message:      { ...Typography.body1, color: Colors.textMid, textAlign: 'center', lineHeight: rs(22), marginBottom: rs(16) },

  versionBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.tealLight, borderRadius: rs(20),
    paddingHorizontal: rs(12), paddingVertical: rs(5), marginBottom: rs(24),
  },
  versionText:  { ...Typography.body3, color: Colors.teal, fontFamily: 'Poppins_500Medium', marginLeft: rs(5) },

  actions:      { flexDirection: 'row', width: '100%', gap: rs(12), marginBottom: rs(14) },

  laterBtn:     {
    flex: 1, height: rs(52), borderRadius: rs(14),
    borderWidth: 1.5, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  laterText:    { ...Typography.btn, color: Colors.textMid },

  updateBtn:    {
    flex: 2, height: rs(52), borderRadius: rs(14),
    backgroundColor: Colors.teal, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: Colors.teal, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  updateBtnDisabled: { backgroundColor: Colors.textLight, shadowOpacity: 0 },
  updateBtnText:     { ...Typography.btn, color: Colors.textWhite },

  footnote:     { ...Typography.caption, color: Colors.textLight, textAlign: 'center' },
});
