import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../../src/api/auth.service';
import useAuthStore from '../../src/store/authStore';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { Toast } from '../../src/components/ui/Toast';
import { Colors } from '../../src/constants/colors';
import { rs } from '../../src/constants/layout';
import { Typography } from '../../src/constants/typography';

export default function LoginScreen() {
  const insets   = useSafeAreaInsets();
  const router   = useRouter();
  const setAuth  = useAuthStore(s => s.setAuth);
  const deviceId = useAuthStore(s => s.deviceId);

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState({});

  const passwordRef = useRef(null);

  const validate = () => {
    const e = {};
    if (!email.trim())       e.email    = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
                             e.email    = 'Enter a valid email address';
    if (!password)           e.password = 'Password is required';
    else if (password.length < 6)
                             e.password = 'Password must be at least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const data = await authService.login({
        email:    email.toLowerCase().trim(),
        password,
        deviceId: deviceId || undefined,
      });

      if (data.user?.role && data.user.role !== 'teacher') {
        Toast.show({
          message: 'This app is for teachers only. Please use the web dashboard.',
          type: 'error',
          duration: 5000,
        });
        return;
      }

      await setAuth(data.token, data.user);
      router.replace('/(tabs)');
    } catch (err) {
      const msg = err?.message || 'Login failed. Please try again.';
      Toast.show({ message: msg, type: 'error' });
      if (err?.status === 401 || msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('credentials')) {
        setErrors({ password: 'Invalid email or password' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.kav}
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + rs(40) }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        {/* Navy header with wave */}
        <LinearGradient
          colors={[Colors.navy, '#0D3F85']}
          style={[styles.header, { paddingTop: insets.top + rs(24) }]}
        >
          <View style={styles.logoCircle}>
            <Ionicons name="location" size={rs(30)} color={Colors.teal} />
          </View>
          <Text style={styles.brandRow}>
            <Text style={styles.brandW}>Teacher</Text>
            <Text style={styles.brandT}>Attendance</Text>
            <Text style={styles.brandDot}>.com</Text>
          </Text>
          <View style={styles.taglineRow}>
            <View style={styles.taglineLine} />
            <Text style={styles.tagline}>Every Check-In, Every Day Counts</Text>
            <View style={styles.taglineLine} />
          </View>
        </LinearGradient>

        {/* Wave transition */}
        <View style={styles.waveWrap}>
          <View style={styles.waveShape} />
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Login to your teacher account</Text>

          <Input
            placeholder="Email or Phone Number"
            value={email}
            onChangeText={v => { setEmail(v); setErrors(e => ({ ...e, email: undefined })); }}
            leftIcon="person-outline"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.email}
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />

          <Input
            inputRef={passwordRef}
            placeholder="Password"
            value={password}
            onChangeText={v => { setPassword(v); setErrors(e => ({ ...e, password: undefined })); }}
            leftIcon="lock-closed-outline"
            secureTextEntry
            error={errors.password}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

           

          <Button title="Login" onPress={handleLogin} loading={loading} />

          
        </View>

        {/* Secure badge */}
        <View style={styles.secureBadge}>
          <Ionicons name="shield-checkmark-outline" size={rs(15)} color={Colors.textMid} />
          <Text style={styles.secureText}>Secure & Protected</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  kav:          { flex: 1, backgroundColor: Colors.navy },
  scroll:       { flexGrow: 1, backgroundColor: Colors.bg },

  header:       { alignItems: 'center', paddingHorizontal: rs(24), paddingBottom: rs(52) },
  logoCircle:   {
    width: rs(72), height: rs(72), borderRadius: rs(36),
    backgroundColor: 'rgba(19,198,179,0.15)',
    borderWidth: 2, borderColor: 'rgba(19,198,179,0.3)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: rs(14),
  },
  brandRow:     { marginBottom: rs(8), textAlign: 'center' },
  brandW:       { ...Typography.brand, color: Colors.textWhite },
  brandT:       { ...Typography.brand, color: Colors.teal },
  brandDot:     { fontSize: rs(14), color: Colors.tealAccent, fontFamily: 'Poppins_500Medium' },
  taglineRow:   { flexDirection: 'row', alignItems: 'center', width: '100%' },
  taglineLine:  { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  tagline:      { ...Typography.caption, color: 'rgba(255,255,255,0.65)', marginHorizontal: rs(10) },

  waveWrap:     { height: rs(32), overflow: 'hidden', backgroundColor: Colors.navy },
  waveShape:    { height: rs(64), backgroundColor: Colors.bg, borderTopLeftRadius: rs(32), borderTopRightRadius: rs(32), marginTop: -rs(32) },

  form:         { paddingHorizontal: rs(24), paddingTop: rs(8) },
  title:        { ...Typography.h2, color: Colors.textDark, marginBottom: rs(4) },
  subtitle:     { ...Typography.body2, color: Colors.textMid, marginBottom: rs(24) },

  rememberRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: rs(-4), marginBottom: rs(20) },
  rememberLeft: { flexDirection: 'row', alignItems: 'center' },
  tick:         { width: rs(18), height: rs(18), borderRadius: rs(4), backgroundColor: Colors.teal, justifyContent: 'center', alignItems: 'center', marginRight: rs(8) },
  rememberText: { ...Typography.body2, color: Colors.textMid },
  forgotText:   { ...Typography.body2, color: Colors.teal, fontFamily: 'Poppins_500Medium' },

  noAccount:    { ...Typography.body2, color: Colors.textMid, textAlign: 'center', marginTop: rs(20) },
  contactLink:  { color: Colors.navy, fontFamily: 'Poppins_600SemiBold' },

  secureBadge:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: rs(24) },
  secureText:   { ...Typography.body2, color: Colors.textMid, marginLeft: rs(6) },
});
