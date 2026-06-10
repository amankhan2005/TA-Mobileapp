import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { rs } from '../../constants/layout';

export function ScreenHeader({ title, onBack, rightElement }) {
  const router = useRouter();

  // Issue 6 fix: safe back navigation — never call router.back() blind
  const handleBack = onBack || (() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  });

  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={handleBack}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="chevron-back" size={rs(22)} color="#0F172A" />
      </TouchableOpacity>
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      <View style={styles.rightSlot}>{rightElement || null}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: rs(16), paddingVertical: rs(12),
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F1F5F9',
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
    gap: rs(8),
  },
  backBtn:   { width: rs(38), height: rs(38), borderRadius: rs(19), backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  title:     { flex: 1, fontSize: rs(16), fontFamily: 'Poppins_700Bold', color: '#0F172A', textAlign: 'center' },
  rightSlot: { width: rs(38), flexShrink: 0 },
});
