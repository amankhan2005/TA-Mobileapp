import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { rs } from '../../constants/layout';
import { Typography } from '../../constants/typography';

const VARIANTS = {
  marked:    { bg: Colors.successLight, text: Colors.success,    label: 'Marked' },
  notMarked: { bg: Colors.errorLight,   text: Colors.error,      label: 'Not Marked' },
  pending:   { bg: Colors.warningLight, text: Colors.warning,    label: 'Pending' },
  absent:    { bg: '#F1F5F9',           text: Colors.textMid,    label: 'Absent' },
  wifi:      { bg: Colors.tealLight,    text: Colors.teal,       label: 'Wi-Fi' },
  qr:        { bg: Colors.tealLight,    text: Colors.teal,       label: 'QR Code' },
};

export function Badge({ variant = 'notMarked', label, style }) {
  const v = VARIANTS[variant] || VARIANTS.notMarked;
  const displayLabel = label || v.label;
  return (
    <View style={[styles.badge, { backgroundColor: v.bg }, style]}>
      <Text style={[styles.text, { color: v.text }]}>{displayLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: rs(12),
    paddingVertical: rs(4),
    borderRadius: rs(999),
    alignSelf: 'flex-start',
  },
  text: {
    ...Typography.body3,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: rs(11),
  },
});
