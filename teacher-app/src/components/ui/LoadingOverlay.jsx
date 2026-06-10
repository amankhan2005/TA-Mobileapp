import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { rs } from '../../constants/layout';
import { Typography } from '../../constants/typography';

export function LoadingOverlay({ message = 'Please wait...' }) {
  return (
    <View style={styles.overlay}>
      <View style={styles.box}>
        <ActivityIndicator size="large" color={Colors.teal} />
        <Text style={styles.text}>{message}</Text>
      </View>
    </View>
  );
}

export function InlineLoader({ color = Colors.teal, size = 'large' }) {
  return (
    <View style={styles.inline}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,52,117,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  box: {
    backgroundColor: Colors.bgCard,
    borderRadius: rs(16),
    padding: rs(28),
    alignItems: 'center',
    gap: rs(16),
    minWidth: rs(180),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  text: { ...Typography.label, color: Colors.textMid, textAlign: 'center' },
  inline: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: rs(40) },
});
