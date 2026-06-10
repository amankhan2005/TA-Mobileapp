import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../../src/api/auth.service';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { Toast } from '../../src/components/ui/Toast';
import { Colors } from '../../src/constants/colors';
import { rs } from '../../src/constants/layout';
import { Typography } from '../../src/constants/typography';

const REQUIREMENTS = [
  { label: 'At least 8 characters',    test: v => v.length >= 8 },
  { label: 'One uppercase letter',      test: v => /[A-Z]/.test(v) },
  { label: 'One number',               test: v => /[0-9]/.test(v) },
  { label: 'One special character',    test: v => /[^A-Za-z0-9]/.test(v) },
];

export default function ChangePasswordScreen() {
  const insets = useSafeAreaInsets();
  const router  = useRouter();

  const [current,  setCurrent]  = useState('');
  const [newPass,  setNewPass]  = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState({});
  const [success,  setSuccess]  = useState(false);

  const newRef     = useRef(null);
  const confirmRef = useRef(null);

  const reqsMet = REQUIREMENTS.map(r => r.test(newPass));
  const allReqs = reqsMet.every(Boolean);

  const validate = () => {
    const e = {};
    if (!current)          e.current = 'Current password is required';
    if (!newPass)          e.newPass = 'New password is required';
    else if (!allReqs)     e.newPass = 'Password does not meet all requirements';
    if (newPass === current) e.newPass = 'New password must differ from current password';
    if (!confirm)          e.confirm = 'Please confirm your new password';
    else if (confirm !== newPass) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await authService.changePassword({ currentPassword: current, newPassword: newPass });
      setSuccess(true);
      Toast.show({ message: 'Password updated successfully!', type: 'success' });
      setTimeout(() => router.back(), 1500);
    } catch (err) {
      const msg = err?.message || 'Failed to update password. Please try again.';
      if (msg.toLowerCase().includes('current') || msg.toLowerCase().includes('incorrect')) {
        setErrors({ current: 'Current password is incorrect' });
      } else {
        Toast.show({ message: msg, type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.kav}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <ScreenHeader title="Change Password" />

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + rs(40) }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {success ? (
            <SuccessView />
          ) : (
            <>
              <Text style={styles.subtitle}>Enter your current password and choose a strong new one.</Text>

              <Input
                label="Current Password"
                placeholder="Current Password"
                value={current}
                onChangeText={v => { setCurrent(v); setErrors(e => ({ ...e, current: '' })); }}
                secureTextEntry
                leftIcon="lock-closed-outline"
                error={errors.current}
                returnKeyType="next"
                onSubmitEditing={() => newRef.current?.focus()}
              />
              <Input
                inputRef={newRef}
                label="New Password"
                placeholder="New Password"
                value={newPass}
                onChangeText={v => { setNewPass(v); setErrors(e => ({ ...e, newPass: '' })); }}
                secureTextEntry
                leftIcon="lock-open-outline"
                error={errors.newPass}
                returnKeyType="next"
                onSubmitEditing={() => confirmRef.current?.focus()}
              />
              <Input
                inputRef={confirmRef}
                label="Confirm New Password"
                placeholder="Confirm New Password"
                value={confirm}
                onChangeText={v => { setConfirm(v); setErrors(e => ({ ...e, confirm: '' })); }}
                secureTextEntry
                leftIcon="shield-checkmark-outline"
                error={errors.confirm}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />

              {/* Password requirements checklist */}
              {newPass.length > 0 && (
                <View style={styles.reqBox}>
                  <Text style={styles.reqTitle}>Password must contain:</Text>
                  {REQUIREMENTS.map((req, i) => (
                    <View key={i} style={styles.reqRow}>
                      <Ionicons
                        name={reqsMet[i] ? 'checkmark-circle' : 'ellipse-outline'}
                        size={rs(16)}
                        color={reqsMet[i] ? Colors.success : Colors.textLight}
                      />
                      <Text style={[styles.reqText, reqsMet[i] && styles.reqTextMet]}>
                        {req.label}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              <Button
                title="Update Password"
                onPress={handleSubmit}
                loading={loading}
                disabled={!current || !newPass || !confirm}
                style={styles.btn}
              />
            </>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

function SuccessView() {
  return (
    <View style={styles.successView}>
      <View style={styles.successIcon}>
        <Ionicons name="checkmark-circle" size={rs(64)} color={Colors.success} />
      </View>
      <Text style={styles.successTitle}>Password Updated!</Text>
      <Text style={styles.successSub}>Your password has been changed successfully.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  kav:          { flex: 1 },
  screen:       { flex: 1, backgroundColor: Colors.bg },
  scroll:       { padding: rs(20) },
  subtitle:     { ...Typography.body1, color: Colors.textMid, marginBottom: rs(24), lineHeight: rs(22) },
  btn:          { marginTop: rs(8) },

  reqBox:       {
    backgroundColor: '#F8FAFC', borderRadius: rs(12),
    padding: rs(14), marginBottom: rs(20),
    borderWidth: 1, borderColor: Colors.border,
  },
  reqTitle:     { ...Typography.body2, color: Colors.textMid, marginBottom: rs(10), fontFamily: 'Poppins_500Medium' },
  reqRow:       { flexDirection: 'row', alignItems: 'center', gap: rs(8), marginBottom: rs(6) },
  reqText:      { ...Typography.body2, color: Colors.textLight },
  reqTextMet:   { color: Colors.success },

  successView:  { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: rs(60), gap: rs(12) },
  successIcon:  { marginBottom: rs(8) },
  successTitle: { ...Typography.h2, color: Colors.textDark },
  successSub:   { ...Typography.body1, color: Colors.textMid, textAlign: 'center' },
});
