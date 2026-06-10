import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { attendanceService } from '../../src/api/attendance.service';
import useAttendanceStore from '../../src/store/attendanceStore';
import { Colors } from '../../src/constants/colors';
import { rs } from '../../src/constants/layout';
import {
  MONTHS, MONTHS_SHORT, DAYS_SHORT,
  getDaysInMonth, getFirstDayOfMonth, getTodayString, formatTime,
} from '../../src/utils/formatDate';

const SIDE_PAD = rs(16);
const CARD_PAD = rs(16);
const CELL     = Math.floor((Dimensions.get('window').width - SIDE_PAD * 2 - CARD_PAD * 2) / 7);

const BLUE   = '#2563EB';
const GREEN  = '#22C55E';
const RED    = '#EF4444';
const ORANGE = '#F59E0B';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { history, setHistory } = useAttendanceStore();
  const now = new Date();

  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const today = getTodayString();
  const presentSet = new Set(history.map(r => r.date));

  const fetchHistory = useCallback(async (y, m) => {
    try {
      const data = await attendanceService.getHistory({ month: m + 1, year: y });
      setHistory(data.records || [], m + 1, y);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { setLoading(true); fetchHistory(year, month); }, [year, month]);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (year === now.getFullYear() && month === now.getMonth()) return;
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };
  const canGoNext = !(year === now.getFullYear() && month === now.getMonth());

  const daysInMonth    = getDaysInMonth(year, month);
  const firstDayOfWeek = getFirstDayOfMonth(year, month); // 0=Sun…6=Sat
  const cells = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const dateStr   = d => `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const isPresent = d => presentSet.has(dateStr(d));
  const isToday   = d => dateStr(d) === today;
  const isWeekend = d => { const dow = new Date(year, month, d).getDay(); return dow === 0 || dow === 6; };

  const workdays    = Array.from({ length: daysInMonth }, (_, i) => i + 1).filter(d => !isWeekend(d)).length;
  const presentDays = history.length;
  const pct         = workdays > 0 ? Math.round((presentDays / workdays) * 100) : 0;
  const pctColor    = pct >= 80 ? GREEN : pct >= 60 ? ORANGE : RED;

  const onRefresh = () => { setRefreshing(true); fetchHistory(year, month); };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>

      {/* ─── Month nav header ──────────────────────────────────────────── */}
      <LinearGradient
        colors={['#1E3A8A','#2563EB']}
        start={{x:0,y:0}} end={{x:1,y:0}}
        style={styles.navHeader}
      >
        <TouchableOpacity onPress={prevMonth} style={styles.navBtn} hitSlop={{top:14,bottom:14,left:14,right:14}}>
          <Ionicons name="chevron-back" size={rs(20)} color="rgba(255,255,255,0.9)" />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{MONTHS[month]} {year}</Text>
        <TouchableOpacity
          onPress={nextMonth}
          style={[styles.navBtn, !canGoNext && styles.navBtnOff]}
          hitSlop={{top:14,bottom:14,left:14,right:14}}
          disabled={!canGoNext}
        >
          <Ionicons name="chevron-forward" size={rs(20)} color={canGoNext ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.25)'} />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} colors={[BLUE]} />}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: rs(20) }]}
      >

        {/* ─── Calendar card ──────────────────────────────────────────── */}
        <View style={styles.calCard}>
          {/* Day headers */}
          <View style={styles.dayHeaderRow}>
            {DAYS_SHORT.map((d, i) => (
              <View key={d} style={styles.cellBox}>
                <Text style={[styles.dayHeaderText, i === 0 || i === 6 ? styles.dayHeaderWeekend : null]}>{d}</Text>
              </View>
            ))}
          </View>

          {/* Divider */}
          <View style={styles.calDivider} />

          {loading ? (
            <View style={styles.loadBox}><ActivityIndicator size="large" color={BLUE} /></View>
          ) : (
            <View style={styles.calGrid}>
              {cells.map((day, idx) =>
                day === null ? (
                  <View key={`e${idx}`} style={styles.cellBox} />
                ) : (
                  <View key={day} style={styles.cellBox}>
                    <View style={[
                      styles.dayCel,
                      isPresent(day) && styles.dayCelPresent,
                      isToday(day) && !isPresent(day) && styles.dayCelToday,
                    ]}>
                      <Text style={[
                        styles.dayText,
                        isPresent(day) && styles.dayTextPresent,
                        isToday(day) && !isPresent(day) && styles.dayTextToday,
                        isWeekend(day) && !isPresent(day) && !isToday(day) && styles.dayTextWeekend,
                      ]}>
                        {day}
                      </Text>
                    </View>
                  </View>
                )
              )}
            </View>
          )}

          {/* Legend */}
          <View style={styles.legend}>
            <LegendItem color={BLUE}     label="Present" type="fill" />
            <LegendItem color="#CBD5E1"  label="Absent"  type="fill" />
            <LegendItem color={BLUE}     label="Today"   type="ring" />
          </View>
        </View>

        {/* ─── Records ────────────────────────────────────────────────── */}
        {!loading && history.length > 0 && (
          <View style={styles.recordsSection}>
            <Text style={styles.recordsSectionTitle}>Attendance Records</Text>
            {[...history]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((rec, i) => <RecordRow key={rec._id || i} record={rec} />)
            }
          </View>
        )}

        {!loading && history.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="calendar-outline" size={rs(36)} color={BLUE} />
            </View>
            <Text style={styles.emptyTitle}>No records</Text>
            <Text style={styles.emptyText}>No attendance recorded for {MONTHS_SHORT[month]} {year}.</Text>
          </View>
        )}
      </ScrollView>

      {/* ─── Stats footer ───────────────────────────────────────────── */}
      <View style={[styles.statsFooter, { paddingBottom: insets.bottom + rs(10) }]}>
        <FooterStat label="Present" value={String(presentDays)} color={GREEN} />
        <View style={styles.footerSep} />
        <FooterStat label="Working Days" value={String(workdays)} color={BLUE} />
        <View style={styles.footerSep} />
        <FooterStat label="Attendance" value={`${pct}%`} color={pctColor} />
      </View>
    </View>
  );
}

function LegendItem({ color, label, type }) {
  return (
    <View style={styles.legendItem}>
      <View style={[
        styles.legendDot,
        type === 'fill' ? { backgroundColor: color } : { borderWidth: 2, borderColor: color, backgroundColor: 'transparent' },
      ]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function FooterStat({ label, value, color }) {
  return (
    <View style={styles.footerStatItem}>
      <Text style={[styles.footerStatVal, { color }]}>{value}</Text>
      <Text style={styles.footerStatLabel}>{label}</Text>
    </View>
  );
}

function RecordRow({ record }) {
  const modeIcon  = record.mode === 'qr' ? 'qr-code-outline' : 'wifi-outline';
  const modeLabel = record.mode === 'qr' ? 'QR Code' : 'Wi-Fi';
  const markedAt  = record.markedAt ? new Date(record.markedAt) : null;
  const timeStr   = markedAt ? formatTime(markedAt) : '—';
  const [y, m, d] = record.date.split('-');
  const dateLabel = `${MONTHS_SHORT[parseInt(m) - 1]} ${parseInt(d)}, ${y}`;

  return (
    <View style={styles.recordRow}>
      <View style={[styles.recordIconBox, { backgroundColor: record.isSuspicious ? '#FFF5F5' : '#F0F5FF' }]}>
        <Ionicons name={modeIcon} size={rs(17)} color={record.isSuspicious ? RED : BLUE} />
      </View>
      <View style={styles.recordInfo}>
        <Text style={styles.recordDate}>{dateLabel}</Text>
        <Text style={styles.recordMode}>{modeLabel}</Text>
      </View>
      <View style={styles.recordRight}>
        <Text style={styles.recordTime}>{timeStr}</Text>
        <View style={[styles.recordBadge, { backgroundColor: record.isSuspicious ? '#FFF5F5' : '#F0FDF4' }]}>
          <Text style={[styles.recordBadgeText, { color: record.isSuspicious ? RED : GREEN }]}>
            {record.isSuspicious ? 'Flagged' : 'Present'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },

  navHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: rs(20), paddingVertical: rs(14) },
  navBtn:     { width: rs(36), height: rs(36), borderRadius: rs(18), backgroundColor: 'rgba(255,255,255,0.14)', justifyContent: 'center', alignItems: 'center' },
  navBtnOff:  { opacity: 0.4 },
  monthTitle: { fontSize: rs(17), fontFamily: 'Poppins_700Bold', color: '#fff', letterSpacing: -0.2 },

  scrollContent: { paddingHorizontal: SIDE_PAD, paddingTop: rs(16) },

  // ── Calendar card ──────────────────────────────────────────────────────────
  calCard: {
    backgroundColor: '#fff', borderRadius: rs(20), paddingHorizontal: CARD_PAD, paddingTop: rs(16), paddingBottom: rs(12),
    marginBottom: rs(18),
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: rs(12), elevation: 4,
  },

  dayHeaderRow:    { flexDirection: 'row', marginBottom: rs(6) },
  cellBox:         { width: CELL, height: CELL, justifyContent: 'center', alignItems: 'center' },
  dayHeaderText:   { fontSize: rs(11), fontFamily: 'Poppins_600SemiBold', color: '#94A3B8', textAlign: 'center' },
  dayHeaderWeekend:{ color: '#CBD5E1' },

  calDivider: { height: 1, backgroundColor: '#F8FAFC', marginBottom: rs(4) },
  loadBox:    { height: rs(200), justifyContent: 'center', alignItems: 'center' },
  calGrid:    { flexDirection: 'row', flexWrap: 'wrap' },

  dayCel:          { width: CELL - rs(4), height: CELL - rs(4), borderRadius: (CELL - rs(4)) / 2, justifyContent: 'center', alignItems: 'center' },
  // Present: soft filled blue — not heavy solid
  dayCelPresent:   { backgroundColor: BLUE },
  // Today: clean ring, no fill
  dayCelToday:     { borderWidth: 1.5, borderColor: BLUE },

  dayText:         { fontSize: rs(13), fontFamily: 'Poppins_400Regular', color: '#475569' },
  dayTextPresent:  { color: '#fff', fontFamily: 'Poppins_600SemiBold' },
  dayTextToday:    { color: BLUE, fontFamily: 'Poppins_600SemiBold' },
  dayTextWeekend:  { color: '#CBD5E1' },

  legend:     { flexDirection: 'row', justifyContent: 'center', gap: rs(20), marginTop: rs(12), paddingTop: rs(10), borderTopWidth: 1, borderTopColor: '#F8FAFC' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: rs(6) },
  legendDot:  { width: rs(9), height: rs(9), borderRadius: rs(5) },
  legendText: { fontSize: rs(11), fontFamily: 'Poppins_400Regular', color: '#94A3B8' },

  // ── Records ────────────────────────────────────────────────────────────────
  recordsSection:     { marginBottom: rs(8) },
  recordsSectionTitle:{ fontSize: rs(14), fontFamily: 'Poppins_700Bold', color: '#0F172A', marginBottom: rs(10) },

  recordRow:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: rs(14), padding: rs(14), marginBottom: rs(8), shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: rs(6), elevation: 2 },
  recordIconBox: { width: rs(40), height: rs(40), borderRadius: rs(20), justifyContent: 'center', alignItems: 'center', marginRight: rs(12) },
  recordInfo:    { flex: 1 },
  recordDate:    { fontSize: rs(13), fontFamily: 'Poppins_600SemiBold', color: '#0F172A', marginBottom: rs(2) },
  recordMode:    { fontSize: rs(11), fontFamily: 'Poppins_400Regular', color: '#94A3B8' },
  recordRight:   { alignItems: 'flex-end', gap: rs(4) },
  recordTime:    { fontSize: rs(12), fontFamily: 'Poppins_600SemiBold', color: '#0F172A' },
  recordBadge:   { paddingHorizontal: rs(8), paddingVertical: rs(2), borderRadius: rs(99) },
  recordBadgeText: { fontSize: rs(10), fontFamily: 'Poppins_700Bold' },

  emptyState:  { alignItems: 'center', paddingVertical: rs(48) },
  emptyIconBox:{ width: rs(72), height: rs(72), borderRadius: rs(36), backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginBottom: rs(14) },
  emptyTitle:  { fontSize: rs(16), fontFamily: 'Poppins_600SemiBold', color: '#0F172A', marginBottom: rs(5) },
  emptyText:   { fontSize: rs(13), fontFamily: 'Poppins_400Regular', color: '#94A3B8', textAlign: 'center' },

  // ── Footer stats ────────────────────────────────────────────────────────────
  statsFooter:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingTop: rs(12), paddingHorizontal: rs(16), borderTopWidth: 1, borderTopColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: rs(8), elevation: 8 },
  footerStatItem: { flex: 1, alignItems: 'center', gap: rs(2) },
  footerStatVal:  { fontSize: rs(18), fontFamily: 'Poppins_700Bold' },
  footerStatLabel:{ fontSize: rs(10), fontFamily: 'Poppins_400Regular', color: '#94A3B8', textAlign: 'center' },
  footerSep:      { width: 1, height: rs(36), backgroundColor: '#F1F5F9' },
});
