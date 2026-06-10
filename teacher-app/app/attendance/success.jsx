import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, BackHandler, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../src/components/ui/Button';
import { Colors } from '../../src/constants/colors';
import { rs } from '../../src/constants/layout';
import { Typography } from '../../src/constants/typography';
import { formatTime, formatDateDisplay } from '../../src/utils/formatDate';

export default function SuccessScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { mode, time } = useLocalSearchParams();

  // Animations
  const circleScale = useRef(new Animated.Value(0)).current;
  const contentOp   = useRef(new Animated.Value(0)).current;
  const checkScale  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Prevent Android back gesture on success screen
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    Animated.sequence([
      Animated.delay(150),
      Animated.spring(circleScale, { toValue: 1, useNativeDriver: true, tension: 55, friction: 5 }),
      Animated.spring(checkScale,  { toValue: 1, useNativeDriver: true, tension: 70, friction: 6 }),
      Animated.timing(contentOp,   { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  const markedAt   = time ? new Date(time) : new Date();
  const modeLabel  = mode === 'qr' ? 'QR Code' : 'Wi-Fi';
  const modeIcon   = mode === 'qr' ? 'qr-code' : 'wifi';

  const rows = [
    { label: 'Mode', value: modeLabel, icon: modeIcon },
    { label: 'Time', value: formatTime(markedAt) },
    { label: 'Date', value: formatDateDisplay(markedAt) },
  ];

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom + rs(32) }]}>
      {/* Animated checkmark circle */}
      <View style={styles.heroArea}>
        <Animated.View style={[styles.outerRing, { transform: [{ scale: circleScale }] }]}>
          <Animated.View style={[styles.innerCircle, { transform: [{ scale: checkScale }] }]}>
            <Ionicons name="checkmark" size={rs(44)} color={Colors.textWhite} />
          </Animated.View>
        </Animated.View>
      </View>

      <Animated.View style={[styles.content, { opacity: contentOp }]}>
        <Text style={styles.title}>Attendance Marked{'\n'}Successfully!</Text>

        {/* Details card */}
        <View style={styles.card}>
          {rows.map((row, i) => (
            <View key={i} style={[styles.row, i > 0 && styles.rowBorder]}>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <View style={styles.rowRight}>
                {row.icon && <Ionicons name={row.icon} size={rs(14)} color={Colors.textMid} style={{ marginRight: rs(4) }} />}
                <Text style={styles.rowValue}>{row.value}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Actions */}
        <Button
          title="Back to Home"
          onPress={() => router.replace('/(tabs)')}
          style={styles.btnPrimary}
        />
        <Button
          title="View History"
          onPress={() => router.replace('/(tabs)/history')}
          variant="outline"
          style={styles.btnSecondary}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:      { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: rs(24) },
  heroArea:    { alignItems: 'center', marginTop: rs(48), marginBottom: rs(28) },

  outerRing:   {
    width: rs(112), height: rs(112), borderRadius: rs(56),
    backgroundColor: Colors.successLight,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: Colors.success, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 20, elevation: 10,
  },
  innerCircle: {
    width: rs(84), height: rs(84), borderRadius: rs(42),
    backgroundColor: Colors.success,
    justifyContent: 'center', alignItems: 'center',
  },

  content:     {},
  title:       { ...Typography.h2, color: Colors.textDark, textAlign: 'center', marginBottom: rs(28), lineHeight: rs(36) },

  card:        { backgroundColor: Colors.bgCard, borderRadius: rs(16), overflow: 'hidden', marginBottom: rs(28), shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 12, elevation: 4 },
  row:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: rs(16) },
  rowBorder:   { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border },
  rowLabel:    { ...Typography.body2, color: Colors.textMid },
  rowRight:    { flexDirection: 'row', alignItems: 'center' },
  rowValue:    { ...Typography.label, color: Colors.textDark },

  btnPrimary:  { marginBottom: rs(12) },
  btnSecondary:{},
});
