import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { rs } from '../../constants/layout';

const BLUE = '#2563EB';

export function Button({ title, onPress, loading, disabled, style, variant = 'primary', icon }) {
  const isDisabled = disabled || loading;

  if (variant === 'outline') {
    return (
      <TouchableOpacity
        style={[styles.outlineBtn, isDisabled && { opacity: 0.5 }, style]}
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.82}
      >
        {loading
          ? <ActivityIndicator color={BLUE} size="small" />
          : <Text style={styles.outlineText}>{title}</Text>
        }
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.wrap, isDisabled && { opacity: 0.55 }, style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={[BLUE, '#1D4ED8']}
        start={{x:0,y:0}} end={{x:1,y:0}}
        style={styles.grad}
      >
        {loading
          ? <ActivityIndicator color="#fff" size="small" />
          : (
            <View style={styles.row}>
              <Text style={styles.text}>{title}</Text>
            </View>
          )
        }
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: rs(16), overflow: 'hidden',
    shadowColor: BLUE, shadowOffset:{width:0,height:4}, shadowOpacity:0.25, shadowRadius:12, elevation:6,
  },
  grad:       { height: rs(52), justifyContent: 'center', alignItems: 'center' },
  row:        { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  text:       { fontSize: rs(15), fontFamily: 'Poppins_600SemiBold', color: '#fff' },

  outlineBtn: { height: rs(52), borderRadius: rs(16), borderWidth: 1.5, borderColor: BLUE, justifyContent: 'center', alignItems: 'center' },
  outlineText:{ fontSize: rs(15), fontFamily: 'Poppins_600SemiBold', color: BLUE },
});
