import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

import useAuthStore from '../../src/store/authStore';
import useAttendanceStore from '../../src/store/attendanceStore';
import useOfflineStore from '../../src/store/offlineStore';
import { teacherService } from '../../src/api/teacher.service';
import { Toast } from '../../src/components/ui/Toast';
import { Colors } from '../../src/constants/colors';
import { rs } from '../../src/constants/layout';
import { Typography } from '../../src/constants/typography';
import { PhotoActionSheet, LogoutModal, DeleteAccountModal } from '../../src/components/ui/PremiumModal';

const APP_VERSION = '1.0.0';
const BLUE = '#2563EB';

export default function ProfileScreen() {
  const insets       = useSafeAreaInsets();
  const router       = useRouter();
  const user         = useAuthStore(s => s.user);
  const updateUser   = useAuthStore(s => s.updateUser);
  const clearAuth    = useAuthStore(s => s.clearAuth);
  const clearAttendance = useAttendanceStore(s => s.clear);
  const clearOffline = useOfflineStore(s => s.clearAll);
  const [profile,        setProfile]        = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [loggingOut,     setLoggingOut]     = useState(false);
  const [showPhotoSheet, setShowPhotoSheet] = useState(false);
  const [showLogout,     setShowLogout]     = useState(false);
  const [showDelete,     setShowDelete]     = useState(false);

  const schoolName   = profile?.school?.name || user?.school?.name || user?.schoolName || null;
  const schoolLogo   = profile?.school?.logoUrl || null;
  const profilePhoto = profile?.profileImageUrl || user?.profileImageUrl || null;
  const initials     = (profile?.name || user?.name || 'T').trim().split(/\s+/).map(w => w[0]).slice(0,2).join('').toUpperCase();

  useEffect(() => {
    teacherService.getMyProfile()
      .then(r => { if (r?.teacher) setProfile(r.teacher); })
      .catch(() => {});
  }, []);

  // Issue 3+4: Gallery only. Modal closes FIRST (via PremiumModal's setTimeout),
  // then this runs — ensuring no open-modal-blocking-system-picker issue.
  const handlePhotoUpload = useCallback(async () => {
    // Request permission first
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow photo library access in Settings.');
      return;
    }
    // Open gallery
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const uri = result.assets[0].uri;
    setUploadingPhoto(true);
    try {
      const data = await teacherService.uploadPhoto(uri);
      if (data?.teacher) {
        setProfile(data.teacher);
        await updateUser({ profileImageUrl: data.teacher.profileImageUrl });
      }
      Toast.show({ message: 'Profile photo updated!', type: 'success' });
    } catch {
      Toast.show({ message: 'Upload failed. Please try again.', type: 'error' });
    } finally {
      setUploadingPhoto(false);
    }
  }, []);

  const doLogout = async () => {
    setLoggingOut(true);
    try { await clearAuth(); clearAttendance(); clearOffline().catch(()=>{}); }
    finally { router.replace('/auth/login'); }
  };

  const doDeleteRequest = async () => {
    setShowDelete(false);
    try {
      await teacherService.requestDeletion('Teacher-initiated request');
      Toast.show({ message: 'Deletion request sent to admin.', type: 'success' });
    } catch (err) { Toast.show({ message: err?.message || 'Failed to submit.', type: 'error' }); }
  };

  const ACCOUNT_MENU = [
    { icon: 'lock-closed-outline',        label: 'Change Password',      route: '/profile/change-password', color: BLUE },
    { icon: 'chatbubble-ellipses-outline', label: 'Inquiry',             route: '/profile/inquiry',         color: '#F97316' },
    { icon: 'information-circle-outline',  label: 'About App',           route: '/profile/about',           color: '#8B5CF6', value: `v${APP_VERSION}` },
    { icon: 'document-text-outline',       label: 'Privacy Policy',      route: '/profile/privacy',         color: '#EF4444' },
    { icon: 'reader-outline',              label: 'Terms & Conditions',  route: '/profile/terms',           color: '#22C55E' },
  ];

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + rs(30) }]}>

        {/* ── Premium Profile Header ─────────────────────────────────────── */}
        <LinearGradient
          colors={['#1E40AF','#2563EB','#3B82F6']}
          start={{x:0,y:0}} end={{x:1,y:1}}
          style={styles.profileHeader}
        >
          {/* Blobs */}
          <View style={[styles.hBlob, { width: rs(140), height: rs(140), right: rs(-40), top: rs(-50), opacity: 0.10 }]} />
          <View style={[styles.hBlob, { width: rs(80), height: rs(80), left: rs(20), bottom: rs(-20), opacity: 0.07 }]} />

          {/* School */}
          {(schoolLogo || schoolName) && (
            <View style={styles.schoolRow}>
              {schoolLogo && <Image source={{ uri: schoolLogo }} style={styles.schoolLogo} resizeMode="contain" />}
              {schoolName && <Text style={styles.schoolNameText} numberOfLines={1}>{schoolName}</Text>}
            </View>
          )}

          {/* Avatar */}
          <TouchableOpacity onPress={() => setShowPhotoSheet(true)} disabled={uploadingPhoto} style={styles.photoWrap} activeOpacity={0.85}>
            {profilePhoto
              ? <Image source={{ uri: profilePhoto }} style={styles.avatarPhoto} />
              : (
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </View>
              )
            }
            <View style={styles.photoEditBadge}>
              <Ionicons name={uploadingPhoto ? 'refresh-outline' : 'camera'} size={rs(13)} color="#fff" />
            </View>
          </TouchableOpacity>

          <Text style={styles.userName} numberOfLines={1}>{profile?.name || user?.name || 'Teacher'}</Text>

          <View style={styles.metaList}>
            {(profile?.email || user?.email) && (
              <View style={styles.metaRow}>
                <Ionicons name="mail-outline" size={rs(12)} color="rgba(255,255,255,0.7)" />
                <Text style={styles.metaText} numberOfLines={1}>{profile?.email || user?.email}</Text>
              </View>
            )}
            {(profile?.phone || user?.phone) && (
              <View style={styles.metaRow}>
                <Ionicons name="call-outline" size={rs(12)} color="rgba(255,255,255,0.7)" />
                <Text style={styles.metaText}>{profile?.phone || user?.phone}</Text>
              </View>
            )}
          </View>

          {/* Premium badge */}
          <View style={styles.teacherBadge}>
            <Ionicons name="school-outline" size={rs(11)} color={BLUE} />
            <Text style={styles.teacherBadgeText}>Verified Teacher</Text>
          </View>
        </LinearGradient>

        {/* ── Account Menu ──────────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.menuCard}>
          {ACCOUNT_MENU.map((item, i) => (
            <React.Fragment key={item.label}>
              <MenuRow
                icon={item.icon}
                label={item.label}
                value={item.value}
                color={item.color}
                onPress={() => router.push(item.route)}
              />
              {i < ACCOUNT_MENU.length - 1 && <MenuDivider />}
            </React.Fragment>
          ))}
        </View>

        {/* ── Danger Zone ───────────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>Account Management</Text>
        <View style={styles.menuCard}>
          <MenuRow icon="log-out-outline"   label="Log Out"                 onPress={() => setShowLogout(true)}  danger loading={loggingOut} />
          <MenuDivider />
          <MenuRow icon="trash-outline"     label="Request Account Deletion" onPress={() => setShowDelete(true)} danger />
        </View>

        <Text style={styles.footerText}>TeacherAttendance v{APP_VERSION}</Text>
        <Text style={styles.footerSub}>Every Check-In, Every Day Counts</Text>
      </ScrollView>

      {/* ── Premium Modals ─────────────────────────────────────────────── */}
      <PhotoActionSheet
        visible={showPhotoSheet}
        onUpload={handlePhotoUpload}
        onCancel={() => setShowPhotoSheet(false)}
      />
      <LogoutModal
        visible={showLogout}
        loading={loggingOut}
        onConfirm={() => { setShowLogout(false); doLogout(); }}
        onCancel={() => setShowLogout(false)}
      />
      <DeleteAccountModal
        visible={showDelete}
        onConfirm={doDeleteRequest}
        onCancel={() => setShowDelete(false)}
      />
    </View>
  );
}

function MenuRow({ icon, label, value, color = '#2563EB', onPress, danger = false, loading = false }) {
  const iconColor = danger ? '#EF4444' : color;
  const iconBg    = danger ? '#FEE2E2' : `${color}18`;
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.72} disabled={loading}>
      <View style={[styles.menuIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={loading ? 'refresh-outline' : icon} size={rs(18)} color={iconColor} />
      </View>
      <Text style={[styles.menuLabel, danger && { color: '#EF4444' }]}>{label}</Text>
      <View style={styles.menuRight}>
        {value && <Text style={styles.menuValue}>{value}</Text>}
        {!loading && <Ionicons name="chevron-forward" size={rs(16)} color={danger ? '#EF4444' : '#CBD5E1'} />}
      </View>
    </TouchableOpacity>
  );
}

function MenuDivider() { return <View style={styles.divider} />; }

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { paddingHorizontal: rs(16) },

  profileHeader: {
    borderRadius: rs(22), padding: rs(24), alignItems: 'center',
    marginBottom: rs(20), overflow: 'hidden',
    shadowColor: '#1E40AF', shadowOffset:{width:0,height:6}, shadowOpacity:0.20, shadowRadius:24, elevation:8,
  },
  hBlob:       { position: 'absolute', borderRadius: 999, backgroundColor: '#fff' },
  schoolRow:   { flexDirection: 'row', alignItems: 'center', gap: rs(8), marginBottom: rs(16), maxWidth: '100%' },
  schoolLogo:  { width: rs(30), height: rs(30), borderRadius: rs(8) },
  schoolNameText:{ fontSize: rs(12), fontFamily: 'Poppins_500Medium', color: 'rgba(255,255,255,0.80)', flex: 1 },

  photoWrap:      { position: 'relative', marginBottom: rs(14) },
  avatarPhoto:    { width: rs(84), height: rs(84), borderRadius: rs(42), borderWidth: 3, borderColor: 'rgba(255,255,255,0.6)' },
  avatarCircle:   { width: rs(84), height: rs(84), borderRadius: rs(42), backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)', justifyContent: 'center', alignItems: 'center' },
  avatarInitials: { fontSize: rs(28), fontFamily: 'Poppins_700Bold', color: '#fff' },
  photoEditBadge: { position: 'absolute', bottom: 0, right: 0, width: rs(28), height: rs(28), borderRadius: rs(14), backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center', borderWidth: 2.5, borderColor: '#fff' },

  userName:    { fontSize: rs(20), fontFamily: 'Poppins_700Bold', color: '#fff', marginBottom: rs(8), maxWidth: '90%' },
  metaList:    { alignItems: 'center', gap: rs(5), maxWidth: '100%', marginBottom: rs(14) },
  metaRow:     { flexDirection: 'row', alignItems: 'center', gap: rs(6) },
  metaText:    { fontSize: rs(12), fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.82)', maxWidth: rs(220) },

  teacherBadge:    { flexDirection: 'row', alignItems: 'center', gap: rs(5), backgroundColor: '#fff', borderRadius: rs(99), paddingHorizontal: rs(12), paddingVertical: rs(5) },
  teacherBadgeText:{ fontSize: rs(11), fontFamily: 'Poppins_600SemiBold', color: '#2563EB' },

  sectionLabel: { fontSize: rs(11), fontFamily: 'Poppins_600SemiBold', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: rs(8), marginLeft: rs(4), marginTop: rs(4) },
  menuCard:     { backgroundColor: '#fff', borderRadius: rs(18), overflow: 'hidden', marginBottom: rs(16), shadowColor: '#0F172A', shadowOffset:{width:0,height:2}, shadowOpacity:0.07, shadowRadius:10, elevation:4 },
  menuRow:      { flexDirection: 'row', alignItems: 'center', gap: rs(12), paddingVertical: rs(14), paddingHorizontal: rs(16) },
  menuIcon:     { width: rs(40), height: rs(40), borderRadius: rs(20), justifyContent: 'center', alignItems: 'center' },
  menuLabel:    { fontSize: rs(14), fontFamily: 'Poppins_500Medium', color: '#0F172A', flex: 1 },
  menuRight:    { flexDirection: 'row', alignItems: 'center', gap: rs(6) },
  menuValue:    { fontSize: rs(12), fontFamily: 'Poppins_400Regular', color: '#94A3B8' },
  divider:      { height: StyleSheet.hairlineWidth, backgroundColor: '#F1F5F9', marginLeft: rs(68) },

  footerText: { fontSize: rs(12), fontFamily: 'Poppins_500Medium', color: '#94A3B8', textAlign: 'center', marginTop: rs(8) },
  footerSub:  { fontSize: rs(11), fontFamily: 'Poppins_400Regular', color: '#CBD5E1', textAlign: 'center', marginTop: rs(3) },
});
