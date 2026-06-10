import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Network from 'expo-network';
import useOfflineStore from '../../store/offlineStore';
import useAuthStore from '../../store/authStore';
import { Colors } from '../../constants/colors';
import { rs } from '../../constants/layout';
import { Typography } from '../../constants/typography';

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const queue    = useOfflineStore(s => s.queue);
  const syncing  = useOfflineStore(s => s.syncing);
  const syncAll  = useOfflineStore(s => s.syncAll);
  const deviceId = useAuthStore(s => s.deviceId);
  const slideAnim = useRef(new Animated.Value(-rs(48))).current;

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const state = await Network.getNetworkStateAsync();
        const online = !!(state.isConnected && state.isInternetReachable !== false);
        if (!mounted) return;
        setIsOnline(online);
        if (online && queue.length > 0 && !syncing) {
          syncAll(deviceId);
        }
      } catch {}
    };
    check();
    const t = setInterval(check, 8000);
    return () => { mounted = false; clearInterval(t); };
  }, [queue.length, syncing]);

  const shouldShow = !isOnline || (isOnline && queue.length > 0);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: shouldShow ? 0 : -rs(48),
      useNativeDriver: true, tension: 80, friction: 10,
    }).start();
  }, [shouldShow]);

  if (!shouldShow && !syncing) return null;

  const bgColor = !isOnline ? Colors.error : Colors.warning;
  const iconName = !isOnline ? 'cloud-offline-outline' : syncing ? 'sync-outline' : 'cloud-upload-outline';
  const message = !isOnline
    ? `No connection${queue.length > 0 ? ` · ${queue.length} record${queue.length > 1 ? 's' : ''} pending` : ''}`
    : syncing
      ? `Syncing ${queue.length} record${queue.length > 1 ? 's' : ''}...`
      : `${queue.length} pending · tap to sync`;

  return (
    <Animated.View style={[styles.banner, { backgroundColor: bgColor, transform: [{ translateY: slideAnim }] }]}>
      <Ionicons name={iconName} size={rs(15)} color="#fff" />
      <Text style={styles.text} numberOfLines={1}>{message}</Text>
      {isOnline && !syncing && queue.length > 0 && (
        <TouchableOpacity onPress={() => syncAll(deviceId)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.retryText}>Sync Now</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: rs(8),
    paddingHorizontal: rs(16), paddingVertical: rs(8),
    minHeight: rs(36),
  },
  text:      { ...Typography.body3, color: '#fff', flex: 1 },
  retryText: { ...Typography.body3, color: '#fff', fontFamily: 'Poppins_600SemiBold', textDecorationLine: 'underline' },
});
