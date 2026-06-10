import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Layout, rs } from '../../constants/layout';
import { Typography } from '../../constants/typography';

export function Input({
  label, value, onChangeText, placeholder,
  secureTextEntry = false, keyboardType = 'default',
  autoCapitalize = 'none', autoCorrect = false,
  leftIcon, error, editable = true,
  style, inputStyle,
  returnKeyType, onSubmitEditing, inputRef,
}) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = secureTextEntry;
  const borderColor = error ? Colors.error : focused ? Colors.borderFocus : Colors.border;

  return (
    <View style={[styles.wrapper, style]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={[styles.container, { borderColor }]}>
        {leftIcon && (
          <View style={styles.leftIcon}>
            <Ionicons name={leftIcon} size={rs(18)} color={focused ? Colors.teal : Colors.textLight} />
          </View>
        )}

        <TextInput
          ref={inputRef}
          style={[styles.input, !leftIcon && styles.inputNoIcon, inputStyle]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textLight}
          secureTextEntry={isPassword && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          editable={editable}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />

        {isPassword && (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={() => setShowPassword(v => !v)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={showPassword ? 'eye-outline' : 'eye-off-outline'}
              size={rs(18)}
              color={Colors.textLight}
            />
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: rs(16) },
  label: {
    ...Typography.label,
    color: Colors.textDark,
    marginBottom: rs(6),
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: Layout.inputHeight,
    borderWidth: 1.5,
    borderRadius: Layout.inputRadius,
    backgroundColor: Colors.bgCard,
    paddingHorizontal: rs(14),
  },
  leftIcon: { marginRight: rs(10) },
  rightIcon: { marginLeft: rs(8), padding: rs(2) },
  input: {
    flex: 1,
    ...Typography.body1,
    color: Colors.textDark,
    height: '100%',
  },
  inputNoIcon: {},
  error: {
    ...Typography.body3,
    color: Colors.error,
    marginTop: rs(4),
    marginLeft: rs(4),
  },
});
