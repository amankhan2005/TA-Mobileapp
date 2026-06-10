/**
 * Super Admin — App Version Management Screen
 *
 * This is a standalone screen that can be:
 *  a) Part of a future Super Admin mobile panel
 *  b) Served as reference for the web admin panel implementation
 *  c) Used via deep link: teacherattendance://admin/app-version
 *
 * Features:
 *  - View current active version config
 *  - Create new version config (with live validation)
 *  - View version history
 *  - Toggle force/optional update type
 *  - Activate historical records
 *  - Audit-logged via backend
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, RefreshControl, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import client from '../../src/api/client';
import useAuthStore from '../../src/store/authStore';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { Toast } from '../../src/components/ui/Toast';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { Colors } from '../../src/constants/colors';
import { rs } from '../../src/constants/layout';
import { Typography } from '../../src/constants/typography';

const SEMVER_RE = /^\d+\.\d+\.\d+$/;

export default function AppVersionAdminScreen() {
  const safeInsets = useSafeAreaInsets();
  const router   = useRouter();
  const user     = useAuthStore(s => s.user);

  // Block non-superAdmins
  useEffect(() => {
    if (user?.role && user.role !== 'superAdmin') {
      router.replace('/(tabs)');
    }
  }, [user]);

  const [active,    setActive]    = useState(null);
  const [history,   setHistory]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);
  const [showForm,  setShowForm]  = useState(false);
  const [saving,    setSaving]    = useState(false);

  // Form state
  const [form, setForm] = useState({
    latestVersion:  '',
    minimumVersion: '',
    updateType:     'optional',
    title:          'Update Available',
    message:        'A new version of TeacherAttendance is available. Please update for the latest features.',
    androidUrl:     '',
    iosUrl:         '',
  });
  const [formErrors, setFormErrors] = useState({});

  const fetchData = useCallback(async () => {
    try {
      const [activeRes, historyRes] = await Promise.all([
        client.get('/api/app-version'),
        client.get('/api/app-version/history'),
      ]);
      setActive(activeRes.data?.data || null);
      setHistory(historyRes.data?.versions || []);
    } catch (err) {
      Toast.show({ message: err?.message || 'Failed to load version config', type: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const field = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const clearErr = (key) => setFormErrors(e => ({ ...e, [key]: undefined }));

  const validate = () => {
    const e = {};
    if (!SEMVER_RE.test(form.latestVersion))
      e.latestVersion = 'Must be semver format, e.g. 1.2.0';
    if (!SEMVER_RE.test(form.minimumVersion))
      e.minimumVersion = 'Must be semver format, e.g. 1.1.0';
    if (!form.title.trim())
      e.title = 'Title is required';
    if (!form.message.trim())
      e.message = 'Message is required';
    if (form.androidUrl && !/^https?:\/\//.test(form.androidUrl))
      e.androidUrl = 'Must be a valid URL (https://...)';
    if (form.iosUrl && !/^https?:\/\//.test(form.iosUrl))
      e.iosUrl = 'Must be a valid URL (https://...)';

    // Cross-field: minimum <= latest
    if (!e.latestVersion && !e.minimumVersion) {
      const toNum = v => v.split('.').map(Number);
      const [lM,lm,lp] = toNum(form.latestVersion);
      const [mM,mm,mp] = toNum(form.minimumVersion);
      const latest  = lM*1e6+lm*1e3+lp;
      const minimum = mM*1e6+mm*1e3+mp;
      if (minimum > latest) e.minimumVersion = 'minimumVersion cannot exceed latestVersion';
    }

    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await client.post('/api/app-version', form);
      Toast.show({ message: 'Version config created and activated.', type: 'success' });
      setShowForm(false);
      setForm(f => ({ ...f, latestVersion: '', minimumVersion: '' }));
      await fetchData();
    } catch (err) {
      Toast.show({ message: err?.message || 'Failed to create version config', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = (id, version) => {
    Alert.alert(
      'Activate Version',
      `Set v${version} as the active version config? This will deactivate the current config.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Activate', onPress: async () => {
          try {
            await client.patch(`/api/app-version/${id}/activate`);
            Toast.show({ message: `v${version} is now active.`, type: 'success' });
            fetchData();
          } catch (err) {
            Toast.show({ message: err?.message || 'Failed to activate', type: 'error' });
          }
        }},
      ]
    );
  };

  const handleDelete = (id, version) => {
    Alert.alert(
      'Delete Config',
      `Delete v${version} from history? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await client.delete(`/api/app-version/${id}`);
            Toast.show({ message: `v${version} deleted.`, type: 'success' });
            fetchData();
          } catch (err) {
            Toast.show({ message: err?.message || 'Failed to delete', type: 'error' });
          }
        }},
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.kav}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.screen, { paddingTop: safeInsets.top }]}>
        <ScreenHeader title="App Version Management" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scroll, { paddingBottom: safeInsets.bottom + rs(32) }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.teal} colors={[Colors.teal]} />}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Active Config ─────────────────────────────────────────── */}
          <Text style={styles.sectionLabel}>ACTIVE CONFIGURATION</Text>

          {loading ? (
            <View style={styles.loadingCard}>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : active ? (
            <ActiveConfigCard config={active} />
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="information-circle-outline" size={rs(32)} color={Colors.textLight} />
              <Text style={styles.emptyTitle}>No Config Set</Text>
              <Text style={styles.emptyText}>Create a version config below to enable force update.</Text>
            </View>
          )}

          {/* ── Create New Config ─────────────────────────────────────── */}
          <TouchableOpacity
            style={styles.toggleFormBtn}
            onPress={() => setShowForm(v => !v)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={showForm ? 'chevron-up-circle' : 'add-circle'}
              size={rs(20)}
              color={Colors.teal}
            />
            <Text style={styles.toggleFormText}>
              {showForm ? 'Cancel' : 'Create New Version Config'}
            </Text>
          </TouchableOpacity>

          {showForm && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>New Version Configuration</Text>
              <Text style={styles.formNote}>
                Creating a new config automatically deactivates the current one.
              </Text>

              <View style={styles.versionRow}>
                <View style={styles.versionInput}>
                  <Input
                    label="Latest Version"
                    placeholder="e.g. 1.2.0"
                    value={form.latestVersion}
                    onChangeText={v => { field('latestVersion', v); clearErr('latestVersion'); }}
                    error={formErrors.latestVersion}
                    autoCapitalize="none"
                    keyboardType="numbers-and-punctuation"
                    returnKeyType="next"
                  />
                </View>
                <View style={styles.versionInput}>
                  <Input
                    label="Minimum Version"
                    placeholder="e.g. 1.1.0"
                    value={form.minimumVersion}
                    onChangeText={v => { field('minimumVersion', v); clearErr('minimumVersion'); }}
                    error={formErrors.minimumVersion}
                    autoCapitalize="none"
                    keyboardType="numbers-and-punctuation"
                    returnKeyType="next"
                  />
                </View>
              </View>

              {/* Update type toggle */}
              <Text style={styles.inputLabel}>Update Type</Text>
              <View style={styles.typeRow}>
                {['optional', 'force'].map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.typeBtn, form.updateType === type && styles.typeBtnActive]}
                    onPress={() => field('updateType', type)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={type === 'force' ? 'warning-outline' : 'information-circle-outline'}
                      size={rs(16)}
                      color={form.updateType === type ? Colors.textWhite : Colors.textMid}
                    />
                    <Text style={[styles.typeBtnText, form.updateType === type && styles.typeBtnTextActive]}>
                      {type === 'optional' ? 'Optional' : 'Force Update'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {form.updateType === 'force' && (
                <View style={styles.forceWarning}>
                  <Ionicons name="warning" size={rs(14)} color={Colors.warning} />
                  <Text style={styles.forceWarningText}>
                    Force update will block users on older versions immediately on their next app launch.
                  </Text>
                </View>
              )}

              <Input
                label="Update Title"
                placeholder="e.g. Important Update"
                value={form.title}
                onChangeText={v => { field('title', v); clearErr('title'); }}
                error={formErrors.title}
                returnKeyType="next"
              />
              <Input
                label="Update Message"
                placeholder="Explain why users should update..."
                value={form.message}
                onChangeText={v => { field('message', v); clearErr('message'); }}
                error={formErrors.message}
                returnKeyType="next"
              />

              <Text style={styles.urlSection}>Store URLs (optional)</Text>
              <Input
                label="Android Play Store URL"
                placeholder="https://play.google.com/store/apps/..."
                value={form.androidUrl}
                onChangeText={v => { field('androidUrl', v); clearErr('androidUrl'); }}
                error={formErrors.androidUrl}
                leftIcon="logo-google-playstore"
                keyboardType="url"
                autoCapitalize="none"
                returnKeyType="next"
              />
              <Input
                label="iOS App Store URL"
                placeholder="https://apps.apple.com/app/..."
                value={form.iosUrl}
                onChangeText={v => { field('iosUrl', v); clearErr('iosUrl'); }}
                error={formErrors.iosUrl}
                leftIcon="logo-apple"
                keyboardType="url"
                autoCapitalize="none"
                returnKeyType="done"
              />

              <Button
                title="Create & Activate"
                onPress={handleCreate}
                loading={saving}
                disabled={saving}
                style={styles.createBtn}
              />
            </View>
          )}

          {/* ── History ───────────────────────────────────────────────── */}
          {history.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: rs(24) }]}>VERSION HISTORY</Text>
              {history.map((v) => (
                <HistoryRow
                  key={v._id}
                  record={v}
                  onActivate={() => handleActivate(v._id, v.latestVersion)}
                  onDelete={() => handleDelete(v._id, v.latestVersion)}
                />
              ))}
            </>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

function ActiveConfigCard({ config }) {
  const isForce = config.updateType === 'force';
  return (
    <LinearGradient
      colors={isForce ? ['#7F1D1D', '#991B1B'] : [Colors.navy, Colors.navyLight]}
      style={styles.activeCard}
    >
      <View style={styles.activeHeader}>
        <View>
          <Text style={styles.activeVersion}>v{config.latestVersion}</Text>
          <Text style={styles.activeMinimum}>Min required: v{config.minimumVersion}</Text>
        </View>
        <View style={[styles.activeBadge, { backgroundColor: isForce ? '#DC2626' : Colors.teal }]}>
          <Ionicons name={isForce ? 'warning' : 'information-circle'} size={rs(12)} color="#fff" />
          <Text style={styles.activeBadgeText}>{isForce ? 'FORCE' : 'OPTIONAL'}</Text>
        </View>
      </View>

      <View style={styles.activeDivider} />

      <Text style={styles.activeTitle}>{config.title}</Text>
      <Text style={styles.activeMessage}>{config.message}</Text>

      <View style={styles.activeUrls}>
        <View style={styles.activeUrl}>
          <Ionicons name="logo-google-playstore" size={rs(12)} color="rgba(255,255,255,0.6)" />
          <Text style={styles.activeUrlText} numberOfLines={1}>
            {config.androidUrl || 'Not set'}
          </Text>
        </View>
        <View style={styles.activeUrl}>
          <Ionicons name="logo-apple" size={rs(12)} color="rgba(255,255,255,0.6)" />
          <Text style={styles.activeUrlText} numberOfLines={1}>
            {config.iosUrl || 'Not set'}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

function HistoryRow({ record, onActivate, onDelete }) {
  const isActive = record.isActive;
  const isForce  = record.updateType === 'force';
  const date     = new Date(record.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <View style={[styles.historyRow, isActive && styles.historyRowActive]}>
      <View style={styles.historyLeft}>
        <View style={styles.historyVersionRow}>
          <Text style={styles.historyVersion}>v{record.latestVersion}</Text>
          <View style={[styles.historyBadge, { backgroundColor: isForce ? Colors.errorLight : Colors.tealLight }]}>
            <Text style={[styles.historyBadgeText, { color: isForce ? Colors.error : Colors.teal }]}>
              {isForce ? 'FORCE' : 'OPTIONAL'}
            </Text>
          </View>
          {isActive && (
            <View style={styles.activePill}>
              <Text style={styles.activePillText}>ACTIVE</Text>
            </View>
          )}
        </View>
        <Text style={styles.historyMeta}>
          Min: v{record.minimumVersion} · {date}
        </Text>
        {record.createdBy && (
          <Text style={styles.historyCreatedBy}>By {record.createdBy}</Text>
        )}
      </View>

      <View style={styles.historyActions}>
        {!isActive && (
          <TouchableOpacity
            style={styles.historyBtn}
            onPress={onActivate}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="checkmark-circle-outline" size={rs(22)} color={Colors.teal} />
          </TouchableOpacity>
        )}
        {!isActive && (
          <TouchableOpacity
            style={styles.historyBtn}
            onPress={onDelete}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={rs(22)} color={Colors.error} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  kav:         { flex: 1 },
  screen:      { flex: 1, backgroundColor: Colors.bg },
  scroll:      { padding: rs(16) },

  sectionLabel:{ ...Typography.caption, color: Colors.textLight, fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: rs(10) },

  loadingCard: { backgroundColor: Colors.bgCard, borderRadius: rs(14), padding: rs(24),
    alignItems: 'center', marginBottom: rs(16) },
  loadingText: { ...Typography.body2, color: Colors.textMid },

  emptyCard:   { backgroundColor: Colors.bgCard, borderRadius: rs(14), padding: rs(24),
    alignItems: 'center', marginBottom: rs(16), gap: rs(8) },
  emptyTitle:  { ...Typography.h4, color: Colors.textMid },
  emptyText:   { ...Typography.body2, color: Colors.textLight, textAlign: 'center' },

  // Active config card
  activeCard:  { borderRadius: rs(16), padding: rs(20), marginBottom: rs(16) },
  activeHeader:{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  activeVersion:{ ...Typography.h2, color: '#fff' },
  activeMinimum:{ ...Typography.body2, color: 'rgba(255,255,255,0.65)' },
  activeBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: rs(10),
    paddingVertical: rs(4), borderRadius: rs(20), gap: rs(4) },
  activeBadgeText:{ ...Typography.caption, color: '#fff', fontFamily: 'Poppins_700Bold' },
  activeDivider:{ height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: rs(14) },
  activeTitle: { ...Typography.h4, color: '#fff', marginBottom: rs(4) },
  activeMessage:{ ...Typography.body2, color: 'rgba(255,255,255,0.8)', lineHeight: rs(20) },
  activeUrls:  { marginTop: rs(12), gap: rs(4) },
  activeUrl:   { flexDirection: 'row', alignItems: 'center', gap: rs(6) },
  activeUrlText:{ ...Typography.caption, color: 'rgba(255,255,255,0.55)', flex: 1 },

  // Toggle form
  toggleFormBtn:{ flexDirection: 'row', alignItems: 'center', gap: rs(8),
    paddingVertical: rs(12), marginBottom: rs(4) },
  toggleFormText:{ ...Typography.label, color: Colors.teal },

  // Form card
  formCard:    { backgroundColor: Colors.bgCard, borderRadius: rs(16), padding: rs(20),
    marginBottom: rs(16), shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1, shadowRadius: 12, elevation: 4 },
  formTitle:   { ...Typography.h4, color: Colors.textDark, marginBottom: rs(4) },
  formNote:    { ...Typography.body2, color: Colors.textMid, marginBottom: rs(20), lineHeight: rs(20) },
  versionRow:  { flexDirection: 'row', gap: rs(12) },
  versionInput:{ flex: 1 },
  inputLabel:  { ...Typography.label, color: Colors.textDark, marginBottom: rs(8) },

  typeRow:     { flexDirection: 'row', gap: rs(10), marginBottom: rs(16) },
  typeBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: rs(6), paddingVertical: rs(12), borderRadius: rs(12),
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.bg },
  typeBtnActive:{ backgroundColor: Colors.navy, borderColor: Colors.navy },
  typeBtnText: { ...Typography.label, color: Colors.textMid },
  typeBtnTextActive:{ color: Colors.textWhite },

  forceWarning:{ flexDirection: 'row', alignItems: 'flex-start', gap: rs(8),
    backgroundColor: Colors.warningLight, borderRadius: rs(10), padding: rs(12), marginBottom: rs(16) },
  forceWarningText:{ ...Typography.body2, color: Colors.warning, flex: 1, lineHeight: rs(18) },

  urlSection:  { ...Typography.label, color: Colors.textMid, marginTop: rs(4), marginBottom: rs(12) },
  createBtn:   { marginTop: rs(8) },

  // History
  historyRow:  { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard,
    borderRadius: rs(12), padding: rs(14), marginBottom: rs(8),
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1, shadowRadius: 6, elevation: 2 },
  historyRowActive:{ borderWidth: 1.5, borderColor: Colors.teal },
  historyLeft: { flex: 1 },
  historyVersionRow:{ flexDirection: 'row', alignItems: 'center', gap: rs(8), marginBottom: rs(4) },
  historyVersion:{ ...Typography.h4, color: Colors.textDark },
  historyBadge:{ paddingHorizontal: rs(8), paddingVertical: rs(2), borderRadius: rs(99) },
  historyBadgeText:{ ...Typography.caption, fontFamily: 'Poppins_600SemiBold' },
  activePill:  { backgroundColor: Colors.teal, paddingHorizontal: rs(7), paddingVertical: rs(2),
    borderRadius: rs(99) },
  activePillText:{ ...Typography.caption, color: '#fff', fontFamily: 'Poppins_700Bold' },
  historyMeta: { ...Typography.body2, color: Colors.textMid },
  historyCreatedBy:{ ...Typography.caption, color: Colors.textLight, marginTop: rs(2) },
  historyActions:{ flexDirection: 'row', gap: rs(4) },
  historyBtn:  { padding: rs(4) },
});
