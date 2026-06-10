import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, Platform, Image, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../src/store/authStore';
import useAttendanceStore from '../../src/store/attendanceStore';
import useOfflineStore from '../../src/store/offlineStore';
import { attendanceService } from '../../src/api/attendance.service';
import { settingsService } from '../../src/api/settings.service';
import { teacherService } from '../../src/api/teacher.service';
import { Colors } from '../../src/constants/colors';
import { rs } from '../../src/constants/layout';
import { getGreeting, getTodayString } from '../../src/utils/formatDate';

const { width: SW } = Dimensions.get('window');
// Issue 8: true 2×2 grid — two equal columns with gap
const GRID_GAP   = rs(12);
const GRID_PAD   = rs(16);
const CARD_W     = (SW - GRID_PAD * 2 - GRID_GAP) / 2;

const BLUE   = '#2563EB';
const GREEN  = '#22C55E';
const RED    = '#EF4444';
const ORANGE = '#F97316';
const PURPLE = '#8B5CF6';

// Issue 8: exactly 4 items in 2×2
const QUICK = [
  { icon: 'calendar',            label: 'Attendance\nHistory', color: BLUE,   bg: '#EFF6FF', route: '/(tabs)/history'  },
  { icon: 'chatbubble-ellipses', label: 'Inquiry',             color: ORANGE, bg: '#FFF7ED', route: '/profile/inquiry' },
  { icon: 'person-circle',       label: 'My Profile',          color: PURPLE, bg: '#F5F3FF', route: '/(tabs)/profile'  },
  { icon: 'shield-checkmark',    label: 'Privacy Policy',      color: RED,    bg: '#FFF1F2', route: '/profile/privacy' },
];

const fmtDate = () => {
  const d = new Date();
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${String(d.getDate()).padStart(2,'0')} ${months[d.getMonth()]}, ${d.getFullYear()}`;
};

// Issue 11: Attendance Streak component
function StreakSection({ history }) {
  if (!history || history.length === 0) return null;

  // Compute current streak (consecutive days up to today)
  const dateSet = new Set(history.map(r => r.date));
  const today   = new Date();
  let streak = 0;
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue; // skip weekends
    if (dateSet.has(key)) streak++;
    else break;
  }

  const label = streak === 0 ? 'Start your streak today!' : streak === 1 ? '1 day streak' : `${streak} day streak`;
  const emoji = streak >= 10 ? '🔥' : streak >= 5 ? '⚡' : streak >= 1 ? '✅' : '📅';
  const pct   = Math.min(streak / 20, 1); // goal = 20 days
  const barColor = streak >= 15 ? GREEN : streak >= 7 ? ORANGE : BLUE;

  return (
    <View style={styles.streakCard}>
      <View style={styles.streakTop}>
        <View>
          <Text style={styles.streakLabel}>Attendance Streak</Text>
          <Text style={styles.streakVal}>{emoji} {label}</Text>
        </View>
        <View style={[styles.streakBadge, { backgroundColor: streak > 0 ? '#FFF7ED' : '#F8FAFC' }]}>
          <Text style={[styles.streakBadgeNum, { color: streak > 0 ? ORANGE : '#94A3B8' }]}>{streak}</Text>
          <Text style={[styles.streakBadgeSub, { color: streak > 0 ? ORANGE : '#94A3B8' }]}>days</Text>
        </View>
      </View>
      <View style={styles.streakTrack}>
        <View style={[styles.streakFill, { width: `${pct * 100}%`, backgroundColor: barColor }]} />
      </View>
      <Text style={styles.streakGoal}>Goal: 20 days</Text>
    </View>
  );
}

export default function HomeScreen() {
  const insets   = useSafeAreaInsets();
  const router   = useRouter();
  const user       = useAuthStore(s => s.user);
  const updateUser = useAuthStore(s => s.updateUser);
  const { todayRecord, setTodayRecord, history } = useAttendanceStore();
  const pendingQueue = useOfflineStore(s => s.queue);

  const [refreshing,    setRefreshing]    = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [settings,      setSettings]      = useState(null);
  const [monthStats,    setMonthStats]    = useState(null);

  const today = getTodayString();
  const now   = new Date();
  const isMarked  = (todayRecord?.date === today) || pendingQueue.some(e => e.date === today);
  const isPending = !todayRecord && pendingQueue.some(e => e.date === today);

  const wifi  = settings?.wifiAttendanceEnabled ?? true;
  const qr    = settings?.qrAttendanceEnabled   ?? true;
  const both  = wifi && qr;
  const onlyQ = !wifi && qr;

  const schoolName = user?.school?.name || user?.schoolName || 'Your School';
  const schoolLogo = user?.school?.logoUrl || null;

  const computeStats = useCallback((records) => {
    const mn = now.getMonth() + 1;
    const yr = now.getFullYear();
    let workdays = 0;
    for (let d = 1; d <= now.getDate(); d++) {
      const dow = new Date(yr, mn - 1, d).getDay();
      if (dow !== 0 && dow !== 6) workdays++;
    }
    const present = records.length;
    const absent  = Math.max(0, workdays - present);
    const pct     = workdays > 0 ? Math.round((present / workdays) * 100) : 0;
    return { present, absent, workdays, pct };
  }, [now]);

  const fetchAll = useCallback(async () => {
    try {
      const [hist, sett, prof] = await Promise.all([
        attendanceService.getHistory({ month: now.getMonth() + 1, year: now.getFullYear() }),
        settingsService.getSettings().catch(() => null),
        teacherService.getMyProfile().catch(() => null),
      ]);
      const records = hist.records || [];
      setTodayRecord(records.find(r => r.date === today) || null);
      setMonthStats(computeStats(records));
      if (sett?.settings) setSettings(sett.settings);
      if (prof?.teacher?.school) {
        await updateUser({ school: prof.teacher.school, schoolName: prof.teacher.school?.name });
      }
    } catch {
      setTodayRecord(null);
    } finally {
      setLoadingStatus(false);
    }
  }, [today]);

  useEffect(() => { fetchAll(); }, []);
  const onRefresh = async () => { setRefreshing(true); await fetchAll(); setRefreshing(false); };

  return (
    <View style={styles.screen}>

      {/* ─── HEADER ──────────────────────────────────────────────────── */}
      <LinearGradient
        colors={['#1E3A8A', '#2563EB']}
        start={{ x: 0.1, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + rs(14) }]}
      >
        <View style={styles.glowShape} />

        <View style={styles.headerRow}>
          {/* Issue 9: slightly larger avatar */}
          <TouchableOpacity
            style={styles.avatarWrap}
            onPress={() => router.push('/(tabs)/profile')}
            activeOpacity={0.82}
          >
            {user?.profileImageUrl
              ? <Image source={{ uri: user.profileImageUrl }} style={styles.avatarImg} />
              : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitials}>
                    {(user?.name || 'T').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                  </Text>
                </View>
              )
            }
            <View style={styles.onlineDot} />
          </TouchableOpacity>

          {/* Greeting block */}
          <View style={styles.greetBlock}>
            <Text style={styles.greetLine}>{getGreeting()}</Text>
            {/* Issue 9: full name clearly */}
            <Text style={styles.greetName} numberOfLines={1}>
              {user?.name || 'Teacher'}
            </Text>
            {/* School row */}
            <View style={styles.schoolRow}>
              {schoolLogo
                ? <Image source={{ uri: schoolLogo }} style={styles.schoolLogo} resizeMode="contain" />
                : <Ionicons name="business-outline" size={rs(10)} color="rgba(255,255,255,0.50)" />
              }
              <Text style={styles.schoolName} numberOfLines={1}>{schoolName}</Text>
            </View>
          </View>

          {/* Bell */}
          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() => router.push('/profile/inquiry')}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="notifications-outline" size={rs(20)} color="rgba(255,255,255,0.9)" />
            <View style={styles.bellDot} />
          </TouchableOpacity>
        </View>

        <View style={styles.scallop} />
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: rs(100) + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} colors={[BLUE]} />
        }
      >

        {/* ─── ATTENDANCE CARD ─────────────────────────────────────── */}
        <View style={styles.card}>
          {loadingStatus ? (
            <View style={styles.skeleton} />
          ) : isMarked && !isPending ? (
            <MarkedState record={todayRecord} onHistory={() => router.push('/(tabs)/history')} />
          ) : isPending ? (
            <PendingState />
          ) : (
            <NotMarkedState
              both={both} onlyQ={onlyQ}
              wifi={wifi} qr={qr}
              onMark={() => router.push('/attendance/router')}
              onWifi={() => router.push('/attendance/wifi')}
              onQR={() => router.push('/attendance/qr')}
            />
          )}
        </View>

        {/* ─── QUICK ACTIONS — 2×2 GRID ───────────────────────────── */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        {/* Issue 8: 2×2 flex-wrap grid with fixed card width */}
        <View style={styles.quickGrid}>
          {QUICK.map((q, i) => (
            <TouchableOpacity
              key={i}
              style={styles.quickCard}
              onPress={() => router.push(q.route)}
              activeOpacity={0.78}
            >
              <View style={[styles.quickIcon, { backgroundColor: q.bg }]}>
                <Ionicons name={q.icon} size={rs(26)} color={q.color} />
              </View>
              <Text style={styles.quickLabel} numberOfLines={2}>{q.label}</Text>
              <View style={[styles.quickArrow, { backgroundColor: q.bg }]}>
                <Ionicons name="arrow-forward" size={rs(14)} color={q.color} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ─── THIS MONTH — ISSUE 10 POLISH ───────────────────────── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>This Month</Text>
            <View style={styles.datePill}>
              <Ionicons name="calendar-outline" size={rs(11)} color="#64748B" />
              <Text style={styles.datePillText}>{fmtDate()}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <StatBox icon="checkmark-circle" iconColor={GREEN}  iconBg="#F0FDF4"
              value={monthStats ? String(monthStats.present) : '—'} label="Present" />
            <View style={styles.statSep} />
            <StatBox icon="close-circle"     iconColor={RED}    iconBg="#FFF5F5"
              value={monthStats ? String(monthStats.absent) : '—'} label="Absent" />
            <View style={styles.statSep} />
            
            <View style={styles.statSep} />
            <StatBox icon="pie-chart"        iconColor={BLUE}   iconBg="#F0F5FF"
              value={monthStats ? `${monthStats.pct}%` : '—'} label="Rate" />
          </View>

          {monthStats && (
            <View style={styles.progressBlock}>
              <View style={styles.progressTrack}>
                <View style={[
                  styles.progressFill,
                  { width: `${monthStats.pct}%`,
                    backgroundColor: monthStats.pct >= 80 ? GREEN : monthStats.pct >= 60 ? ORANGE : RED }
                ]} />
              </View>
              <View style={styles.progressLabels}>
                <Text style={styles.progressNote}>{monthStats.pct}% this month</Text>
                <Text style={[styles.progressGoal, { color: monthStats.pct >= 80 ? GREEN : ORANGE }]}>
                  {monthStats.pct >= 90 ? 'Excellent' : monthStats.pct >= 80 ? 'Great work' : monthStats.pct >= 60 ? 'Keep going' : 'Needs attention'}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* ─── STREAK SECTION — ISSUE 11 ──────────────────────────── */}
        <StreakSection history={history} />

      </ScrollView>
    </View>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatBox({ icon, iconColor, iconBg, value, label }) {
  return (
    <View style={styles.statBox}>
      <View style={[styles.statIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={rs(16)} color={iconColor} />
      </View>
      <Text style={[styles.statValue, { color: iconColor }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function NotMarkedState({ both, onlyQ, wifi, qr, onMark, onWifi, onQR }) {
  const iosGuide = Platform.OS === 'ios' && wifi && !qr;
  return (
    <View>
      <View style={styles.attHeadRow}>
        <View style={{ flex: 1, marginRight: rs(12) }}>
          <Text style={styles.attTitle}>Mark Attendance</Text>
          <Text style={styles.attSub}>
            {iosGuide ? 'Use QR for reliable check-in on iOS.'
              : both  ? 'Choose your preferred method.'
              : onlyQ ? 'Scan the QR code in your classroom.'
              :         'Connect to school WiFi to mark attendance.'}
          </Text>
        </View>
        <View style={styles.secureTag}>
          <Ionicons name="shield-checkmark" size={rs(9)} color="#fff" />
          <Text style={styles.secureTagText}>Secure</Text>
        </View>
      </View>

      {both ? (
        <View style={styles.modePair}>
          <TouchableOpacity style={[styles.modeBtn, styles.modeBtnQR]} onPress={onQR} activeOpacity={0.82}>
            <View style={styles.modeIconWrap}>
              <Ionicons name="qr-code" size={rs(28)} color={RED} />
            </View>
            <Text style={styles.modeBtnTitle}>QR Attendance</Text>
            <Text style={styles.modeBtnSub}>Scan code at school</Text>
            <View style={[styles.modeArrow, { backgroundColor: RED }]}>
              <Ionicons name="arrow-forward" size={rs(13)} color="#fff" />
            </View>
          </TouchableOpacity>

          <View style={styles.orCol}>
            <View style={styles.orLine} />
            <View style={styles.orCircle}><Text style={styles.orText}>OR</Text></View>
            <View style={styles.orLine} />
          </View>

          <TouchableOpacity style={[styles.modeBtn, styles.modeBtnWifi]} onPress={onWifi} activeOpacity={0.82}>
            <View style={[styles.modeIconWrap, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="wifi" size={rs(28)} color={GREEN} />
            </View>
            <Text style={[styles.modeBtnTitle, { color: '#14532D' }]}>WiFi Attendance</Text>
            <Text style={styles.modeBtnSub}>Connect to school WiFi</Text>
            <View style={[styles.modeArrow, { backgroundColor: GREEN }]}>
              <Ionicons name="arrow-forward" size={rs(13)} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.singleBtn} onPress={onMark} activeOpacity={0.85}>
          <Ionicons name={onlyQ ? 'qr-code' : 'wifi'} size={rs(18)} color="#fff" />
          <Text style={styles.singleBtnText}>{onlyQ ? 'Scan QR Code' : 'Mark via WiFi'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function MarkedState({ record, onHistory }) {
  const icon  = record?.mode === 'qr' ? 'qr-code' : 'wifi';
  const label = record?.mode === 'qr' ? 'QR Code'  : 'Wi-Fi';
  return (
    <View style={styles.markedRow}>
      <View style={styles.markedIconBox}>
        <Ionicons name="checkmark" size={rs(22)} color={GREEN} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.markedTitle}>You marked your attendance</Text>
        <View style={styles.markedMeta}>
          <Ionicons name={icon} size={rs(11)} color="#94A3B8" />
          <Text style={styles.markedSub}>Verified via {label}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.markedHistBtn} onPress={onHistory} activeOpacity={0.75}>
        <Text style={styles.markedHistText}>History</Text>
        <Ionicons name="chevron-forward" size={rs(11)} color={BLUE} />
      </TouchableOpacity>
    </View>
  );
}

function PendingState() {
  return (
    <View style={styles.pendingRow}>
      <View style={styles.pendingIcon}>
        <Ionicons name="cloud-upload-outline" size={rs(22)} color={ORANGE} />
      </View>
      <View>
        <Text style={styles.pendingTitle}>Queued for sync</Text>
        <Text style={styles.pendingSub}>Will submit automatically when online.</Text>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },

  // Header
  header:     { paddingHorizontal: rs(20), paddingBottom: rs(30), overflow: 'hidden', position: 'relative' },
  glowShape:  { position: 'absolute', width: rs(200), height: rs(200), borderRadius: rs(100), backgroundColor: '#60A5FA', right: rs(-70), top: rs(-80), opacity: 0.10 },
  scallop:    { position: 'absolute', bottom: -rs(16), left: -rs(20), right: -rs(20), height: rs(32), backgroundColor: '#F8FAFC', borderTopLeftRadius: rs(24), borderTopRightRadius: rs(24) },
  headerRow:  { flexDirection: 'row', alignItems: 'center', gap: rs(12) },

  // Issue 9: bigger avatar (52→56)
  avatarWrap:    { position: 'relative', flexShrink: 0 },
  avatarImg:     { width: rs(56), height: rs(56), borderRadius: rs(28), borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.50)' },
  avatarFallback:{ width: rs(56), height: rs(56), borderRadius: rs(28), backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.34)', justifyContent: 'center', alignItems: 'center' },
  avatarInitials:{ color: '#fff', fontSize: rs(17), fontFamily: 'Poppins_700Bold' },
  onlineDot:     { position: 'absolute', bottom: 1, right: 1, width: rs(12), height: rs(12), borderRadius: rs(6), backgroundColor: '#4ADE80', borderWidth: 2, borderColor: '#1E3A8A' },

  greetBlock: { flex: 1, minWidth: 0 },
  greetLine:  { color: 'rgba(255,255,255,0.60)', fontSize: rs(12), fontFamily: 'Poppins_400Regular' },
  greetName:  { color: '#fff', fontSize: rs(18), fontFamily: 'Poppins_700Bold', letterSpacing: -0.2, lineHeight: rs(25) },
  schoolRow:  { flexDirection: 'row', alignItems: 'center', gap: rs(4), marginTop: rs(3) },
  schoolLogo: { width: rs(12), height: rs(12), borderRadius: rs(3) },
  schoolName: { color: 'rgba(255,255,255,0.55)', fontSize: rs(11), fontFamily: 'Poppins_400Regular', flex: 1 },

  bellBtn: { width: rs(40), height: rs(40), borderRadius: rs(20), backgroundColor: 'rgba(255,255,255,0.13)', justifyContent: 'center', alignItems: 'center', position: 'relative', flexShrink: 0 },
  bellDot: { position: 'absolute', top: rs(9), right: rs(9), width: rs(7), height: rs(7), borderRadius: rs(4), backgroundColor: '#F87171', borderWidth: 1.5, borderColor: '#1E3A8A' },

  // Scroll
  scroll:        { flex: 1, marginTop: -rs(14) },
  scrollContent: { paddingHorizontal: GRID_PAD, paddingTop: rs(4) },

  // Card
  card: {
    backgroundColor: '#fff', borderRadius: rs(20), padding: rs(20), marginBottom: rs(16),
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: rs(14), elevation: 4,
  },
  skeleton: { height: rs(120), borderRadius: rs(12), backgroundColor: '#F1F5F9' },

  // Attendance card
  attHeadRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: rs(16) },
  attTitle:   { fontSize: rs(16), fontFamily: 'Poppins_700Bold', color: '#0F172A', marginBottom: rs(3) },
  attSub:     { fontSize: rs(12), fontFamily: 'Poppins_400Regular', color: '#64748B', lineHeight: rs(18) },
  secureTag:  { flexDirection: 'row', alignItems: 'center', gap: rs(3), backgroundColor: GREEN, borderRadius: rs(7), paddingHorizontal: rs(7), paddingVertical: rs(3), flexShrink: 0 },
  secureTagText: { color: '#fff', fontSize: rs(8), fontFamily: 'Poppins_600SemiBold' },

  modePair:    { flexDirection: 'row', gap: rs(8) },
  modeBtn:     { flex: 1, borderRadius: rs(16), padding: rs(14), alignItems: 'center', gap: rs(8), minHeight: rs(172) },
  modeBtnQR:   { backgroundColor: '#FFF5F5', borderWidth: 1, borderColor: '#FEE2E2' },
  modeBtnWifi: { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#DCFCE7' },
  modeIconWrap:{ width: rs(58), height: rs(58), borderRadius: rs(29), backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center', marginBottom: rs(2) },
  modeBtnTitle:{ fontSize: rs(12), fontFamily: 'Poppins_700Bold', color: '#7F1D1D', textAlign: 'center' },
  modeBtnSub:  { fontSize: rs(10), fontFamily: 'Poppins_400Regular', color: '#64748B', textAlign: 'center', lineHeight: rs(14), flex: 1 },
  modeArrow:   { width: rs(42), height: rs(30), borderRadius: rs(15), justifyContent: 'center', alignItems: 'center' },

  orCol:    { width: rs(26), alignItems: 'center', justifyContent: 'center' },
  orLine:   { flex: 1, width: 1, backgroundColor: '#E2E8F0' },
  orCircle: { width: rs(24), height: rs(24), borderRadius: rs(12), backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', marginVertical: rs(4) },
  orText:   { fontSize: rs(7), fontFamily: 'Poppins_700Bold', color: '#94A3B8' },

  singleBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(8), backgroundColor: BLUE, borderRadius: rs(14), paddingVertical: rs(14) },
  singleBtnText: { fontSize: rs(14), fontFamily: 'Poppins_600SemiBold', color: '#fff' },

  markedRow:     { flexDirection: 'row', alignItems: 'center', gap: rs(14), paddingVertical: rs(4) },
  markedIconBox: { width: rs(48), height: rs(48), borderRadius: rs(24), backgroundColor: '#F0FDF4', borderWidth: 1.5, borderColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center' },
  markedTitle:   { fontSize: rs(14), fontFamily: 'Poppins_600SemiBold', color: '#0F172A' },
  markedMeta:    { flexDirection: 'row', alignItems: 'center', gap: rs(4), marginTop: rs(3) },
  markedSub:     { fontSize: rs(11), fontFamily: 'Poppins_400Regular', color: '#94A3B8' },
  markedHistBtn: { flexDirection: 'row', alignItems: 'center', gap: rs(2), paddingHorizontal: rs(10), paddingVertical: rs(6), borderRadius: rs(99), backgroundColor: '#EFF6FF' },
  markedHistText:{ fontSize: rs(12), fontFamily: 'Poppins_500Medium', color: BLUE },

  pendingRow:  { flexDirection: 'row', alignItems: 'center', gap: rs(14), paddingVertical: rs(6) },
  pendingIcon: { width: rs(48), height: rs(48), borderRadius: rs(24), backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center' },
  pendingTitle:{ fontSize: rs(14), fontFamily: 'Poppins_600SemiBold', color: '#0F172A' },
  pendingSub:  { fontSize: rs(12), fontFamily: 'Poppins_400Regular', color: '#94A3B8', marginTop: rs(2) },

  // Section title
  sectionTitle: { fontSize: rs(15), fontFamily: 'Poppins_700Bold', color: '#0F172A', marginBottom: rs(12) },

  // Issue 8: 2×2 grid
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP, marginBottom: rs(16) },
  quickCard: {
    width: CARD_W,
    backgroundColor: '#fff', borderRadius: rs(18),
    padding: rs(16), alignItems: 'center', gap: rs(8),
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: rs(10), elevation: 3,
  },
  quickIcon:  { width: rs(52), height: rs(52), borderRadius: rs(15), justifyContent: 'center', alignItems: 'center' },
  quickLabel: { fontSize: rs(12), fontFamily: 'Poppins_600SemiBold', color: '#0F172A', textAlign: 'center', lineHeight: rs(17) },
  quickArrow: { width: rs(28), height: rs(28), borderRadius: rs(14), justifyContent: 'center', alignItems: 'center' },

  // Stats card — Issue 10
  cardHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: rs(18) },
  cardTitle:    { fontSize: rs(15), fontFamily: 'Poppins_700Bold', color: '#0F172A' },
  datePill:     { flexDirection: 'row', alignItems: 'center', gap: rs(4), backgroundColor: '#F8FAFC', borderRadius: rs(99), paddingHorizontal: rs(9), paddingVertical: rs(4), borderWidth: 1, borderColor: '#E2E8F0' },
  datePillText: { fontSize: rs(11), fontFamily: 'Poppins_500Medium', color: '#64748B' },

  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statBox:  { flex: 1, alignItems: 'center', gap: rs(5) },
  statIcon: { width: rs(38), height: rs(38), borderRadius: rs(19), justifyContent: 'center', alignItems: 'center' },
  statValue:{ fontSize: rs(20), fontFamily: 'Poppins_700Bold', lineHeight: rs(26) },
  statLabel:{ fontSize: rs(10), fontFamily: 'Poppins_400Regular', color: '#94A3B8', textAlign: 'center' },
  statSep:  { width: 1, height: rs(44), backgroundColor: '#F1F5F9' },

  progressBlock:  { marginTop: rs(18) },
  progressTrack:  { height: rs(5), backgroundColor: '#F1F5F9', borderRadius: rs(3), overflow: 'hidden', marginBottom: rs(7) },
  progressFill:   { height: '100%', borderRadius: rs(3) },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressNote:   { fontSize: rs(11), fontFamily: 'Poppins_400Regular', color: '#94A3B8' },
  progressGoal:   { fontSize: rs(11), fontFamily: 'Poppins_600SemiBold' },

  // Issue 11: Streak card
  streakCard: {
    backgroundColor: '#fff', borderRadius: rs(20), padding: rs(20), marginBottom: rs(16),
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: rs(14), elevation: 4,
  },
  streakTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: rs(14) },
  streakLabel:     { fontSize: rs(13), fontFamily: 'Poppins_500Medium', color: '#94A3B8', marginBottom: rs(3) },
  streakVal:       { fontSize: rs(15), fontFamily: 'Poppins_700Bold', color: '#0F172A' },
  streakBadge:     { width: rs(56), height: rs(56), borderRadius: rs(28), justifyContent: 'center', alignItems: 'center' },
  streakBadgeNum:  { fontSize: rs(22), fontFamily: 'Poppins_800ExtraBold', lineHeight: rs(26) },
  streakBadgeSub:  { fontSize: rs(10), fontFamily: 'Poppins_500Medium' },
  streakTrack:     { height: rs(6), backgroundColor: '#F1F5F9', borderRadius: rs(3), overflow: 'hidden', marginBottom: rs(7) },
  streakFill:      { height: '100%', borderRadius: rs(3) },
  streakGoal:      { fontSize: rs(11), fontFamily: 'Poppins_400Regular', color: '#CBD5E1', textAlign: 'right' },
});