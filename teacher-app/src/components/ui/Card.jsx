import React from 'react';
import { View, StyleSheet } from 'react-native';
import { rs } from '../../constants/layout';

export function Card({ children, style, padding }) {
  return (
    <View style={[styles.card, padding !== undefined && { padding }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: rs(18),
    padding: rs(18),
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },
});
