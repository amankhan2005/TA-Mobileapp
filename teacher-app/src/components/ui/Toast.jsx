import React, { useEffect, useRef } from 'react';
import { Animated, Text, View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { rs } from '../../constants/layout';
import { Typography } from '../../constants/typography';

// Simple self-contained toast — shown via ToastProvider
let _showToast = null;
export const Toast = { show: (opts) => _showToast?.(opts) };

export function ToastProvider() {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = React.useState(null);
  const anim = useRef(new Animated.Value(0)).current;
  const timer = useRef(null);

  _showToast = ({ message, type = 'info', duration = 3000 }) => {
    clearTimeout(timer.current);
    setToast({ message, type });
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }).start();
    timer.current = setTimeout(() => {
      Animated.timing(anim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => setToast(null));
    }, duration);
  };

  if (!toast) return null;

  const iconMap = { success: 'checkmark-circle', error: 'close-circle', info: 'information-circle', warning: 'warning' };
  const colorMap = { success: Colors.success, error: Colors.error, info: Colors.teal, warning: Colors.warning };

  return (
    <Animated.View
      style={[
        styles.container,
        { bottom: insets.bottom + rs(80), opacity: anim, transform: [{ scale: anim }] },
      ]}
    >
      <Ionicons name={iconMap[toast.type]} size={rs(20)} color={colorMap[toast.type]} />
      <Text style={styles.text}>{toast.message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: rs(20),
    right: rs(20),
    backgroundColor: Colors.textDark,
    borderRadius: rs(12),
    padding: rs(14),
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(10),
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  text: { ...Typography.body2, color: Colors.textWhite, flex: 1 },
});
