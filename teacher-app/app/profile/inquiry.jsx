import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { Colors } from '../../src/constants/colors';
import { rs } from '../../src/constants/layout';
import { inquiryService } from '../../src/api/inquiry.service';
import { InquirySuccessModal } from '../../src/components/ui/PremiumModal';

const fmtDate = d => {
  if (!d) return '';
  const dt = new Date(d);
  const m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${String(dt.getDate()).padStart(2,'0')} ${m[dt.getMonth()]} ${dt.getFullYear()}, ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;
};

const CATS = [
  { id: 'attendance_issue',  label: 'Attendance Issue', icon: 'calendar-outline'          },
  { id: 'leave_request',     label: 'Leave Request',    icon: 'time-outline'               },
  { id: 'technical_issue',   label: 'Technical Issue',  icon: 'construct-outline'          },
  { id: 'general_support',   label: 'General Support',  icon: 'help-circle-outline'        },
  { id: 'other',             label: 'Other',            icon: 'ellipsis-horizontal-outline'},
];

const STATUS = {
  open:        { bg: '#FEF3C7', text: '#D97706',  label: 'Open'       },
  in_progress: { bg: '#DBEAFE', text: '#2563EB',  label: 'In Progress'},
  resolved:    { bg: '#DCFCE7', text: '#16A34A',  label: 'Resolved'   },
  closed:      { bg: '#F1F5F9', text: '#64748B',  label: 'Closed'     },
};

const BLUE   = '#2563EB';
const GREEN  = '#22C55E';
const ORANGE = '#F97316';

export default function InquiryScreen() {
  const insets = useSafeAreaInsets();
  const [tab,       setTab]       = useState('new');
  const [cat,       setCat]       = useState('general_support');
  const [sub,       setSub]       = useState('');
  const [msg,       setMsg]       = useState('');
  const [loading,   setLoading]   = useState(false);
  const [list,      setList]      = useState([]);
  const [fetching,  setFetching]  = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  const load = useCallback(async () => {
    try { const d = await inquiryService.getMyInquiries(); setList(d.inquiries || []); }
    catch {} finally { setFetching(false); }
  }, []);

  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!sub.trim()) { Alert.alert('Required', 'Enter a subject.'); return; }
    if (!msg.trim()) { Alert.alert('Required', 'Describe your issue.'); return; }
    setLoading(true);
    try {
      await inquiryService.submit({ category: cat, subject: sub.trim(), message: msg.trim() });
      setSub(''); setMsg(''); setCat('general_support');
      setShowSuccess(true);
      load();
    } catch (err) { Alert.alert('Error', err?.message || 'Failed.'); }
    finally { setLoading(false); }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScreenHeader title="Support Inquiry" />

      {/* Premium tabs */}
      <View style={styles.tabBar}>
        {[
          { id: 'new',     label: 'New Request',                                 icon: 'add-circle-outline'         },
          { id: 'history', label: `History${list.length ? ` (${list.length})` : ''}`, icon: 'time-outline' },
        ].map(t => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tab, tab === t.id && styles.tabActive]}
            onPress={() => setTab(t.id)}
          >
            <Ionicons name={t.icon} size={rs(15)} color={tab === t.id ? BLUE : '#94A3B8'} />
            <Text style={[styles.tabLabel, tab === t.id && styles.tabLabelActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'new' ? (
        <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + rs(40) }]}
            showsVerticalScrollIndicator={false}
          >
            {/* Category */}
            <Text style={styles.fieldLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={styles.catContent}>
              {CATS.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.catChip, cat === c.id && styles.catChipActive]}
                  onPress={() => setCat(c.id)}
                >
                  <Ionicons name={c.icon} size={rs(13)} color={cat === c.id ? '#fff' : '#64748B'} />
                  <Text style={[styles.catChipText, cat === c.id && styles.catChipTextActive]}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Subject */}
            <Text style={styles.fieldLabel}>Subject <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={sub}
              onChangeText={setSub}
              placeholder="Brief description of your issue"
              placeholderTextColor="#CBD5E1"
              maxLength={200}
            />

            {/* Message */}
            <Text style={styles.fieldLabel}>Details <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={msg}
              onChangeText={setMsg}
              placeholder="Describe your issue in detail…"
              placeholderTextColor="#CBD5E1"
              multiline
              numberOfLines={5}
              maxLength={2000}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{msg.length}/2000</Text>

            {/* Submit */}
            <TouchableOpacity style={styles.submitBtn} onPress={submit} disabled={loading} activeOpacity={0.85}>
              <LinearGradient colors={[BLUE,'#1D4ED8']} style={styles.submitGrad}>
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <>
                      <Ionicons name="send" size={rs(16)} color="#fff" />
                      <Text style={styles.submitText}>Submit Inquiry</Text>
                    </>
                }
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + rs(40) }]}
          showsVerticalScrollIndicator={false}
        >
          {fetching ? (
            <View style={styles.loadBox}><ActivityIndicator color={BLUE} size="large" /></View>
          ) : list.length === 0 ? (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="chatbubble-ellipses-outline" size={rs(40)} color={BLUE} />
              </View>
              <Text style={styles.emptyTitle}>No Inquiries Yet</Text>
              <Text style={styles.emptyText}>Submit a request to get help from your admin.</Text>
            </View>
          ) : (
            list.map(inq => {
              const sc = STATUS[inq.status] || STATUS.open;
              const c  = CATS.find(x => x.id === inq.category);
              return (
                <View key={inq._id} style={styles.inqCard}>
                  <View style={styles.inqCardTop}>
                    <View style={styles.inqCatRow}>
                      <View style={styles.inqCatIcon}>
                        <Ionicons name={c?.icon || 'help-circle-outline'} size={rs(13)} color={BLUE} />
                      </View>
                      <Text style={styles.inqCatText}>{c?.label || inq.category}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                      <Text style={[styles.statusText, { color: sc.text }]}>{sc.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.inqSubject} numberOfLines={1}>{inq.subject}</Text>
                  <Text style={styles.inqMessage} numberOfLines={2}>{inq.message}</Text>
                  {inq.adminReply && (
                    <View style={styles.adminReply}>
                      <View style={styles.adminReplyHeader}>
                        <Ionicons name="person-circle" size={rs(14)} color={GREEN} />
                        <Text style={styles.adminReplyLabel}>Admin Reply</Text>
                      </View>
                      <Text style={styles.adminReplyText}>{inq.adminReply}</Text>
                    </View>
                  )}
                  <Text style={styles.inqDate}>{fmtDate(inq.createdAt)}</Text>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
      <InquirySuccessModal
        visible={showSuccess}
        onClose={() => { setShowSuccess(false); setTab('history'); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },

  tabBar:          { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E2E8F0' },
  tab:             { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(6), paddingVertical: rs(13), borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive:       { borderBottomColor: BLUE },
  tabLabel:        { fontSize: rs(13), fontFamily: 'Poppins_500Medium', color: '#94A3B8' },
  tabLabelActive:  { color: BLUE, fontFamily: 'Poppins_600SemiBold' },

  content: { padding: rs(16) },

  fieldLabel: { fontSize: rs(13), fontFamily: 'Poppins_600SemiBold', color: '#0F172A', marginBottom: rs(8), marginTop: rs(16) },
  required:   { color: '#EF4444' },

  catScroll:        { marginHorizontal: -rs(16) },
  catContent:       { paddingHorizontal: rs(16), gap: rs(8) },
  catChip:          { flexDirection: 'row', alignItems: 'center', gap: rs(5), paddingHorizontal: rs(13), paddingVertical: rs(8), borderRadius: rs(99), backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E2E8F0' },
  catChipActive:    { backgroundColor: BLUE, borderColor: BLUE },
  catChipText:      { fontSize: rs(12), fontFamily: 'Poppins_500Medium', color: '#64748B' },
  catChipTextActive:{ color: '#fff', fontFamily: 'Poppins_600SemiBold' },

  input: {
    backgroundColor: '#fff', borderRadius: rs(14), borderWidth: 1.5, borderColor: '#E2E8F0',
    paddingHorizontal: rs(14), paddingVertical: rs(13),
    fontSize: rs(14), fontFamily: 'Poppins_400Regular', color: '#0F172A',
  },
  textarea:   { height: rs(130), paddingTop: rs(13) },
  charCount:  { fontSize: rs(11), fontFamily: 'Poppins_400Regular', color: '#94A3B8', textAlign: 'right', marginTop: rs(5) },

  submitBtn:  { marginTop: rs(22) },
  submitGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(8), borderRadius: rs(16), paddingVertical: rs(15), shadowColor: BLUE, shadowOffset:{width:0,height:4}, shadowOpacity:0.28, shadowRadius:12, elevation:6 },
  submitText: { fontSize: rs(15), fontFamily: 'Poppins_600SemiBold', color: '#fff' },

  loadBox:      { height: rs(200), justifyContent: 'center', alignItems: 'center' },
  emptyBox:     { alignItems: 'center', paddingVertical: rs(56) },
  emptyIconWrap:{ width: rs(80), height: rs(80), borderRadius: rs(40), backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginBottom: rs(16) },
  emptyTitle:   { fontSize: rs(16), fontFamily: 'Poppins_700Bold', color: '#0F172A', marginBottom: rs(6) },
  emptyText:    { fontSize: rs(13), fontFamily: 'Poppins_400Regular', color: '#64748B', textAlign: 'center' },

  inqCard: {
    backgroundColor: '#fff', borderRadius: rs(16), padding: rs(16), marginBottom: rs(12),
    shadowColor: '#0F172A', shadowOffset:{width:0,height:2}, shadowOpacity:0.07, shadowRadius:10, elevation:4,
  },
  inqCardTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: rs(8) },
  inqCatRow:     { flexDirection: 'row', alignItems: 'center', gap: rs(6) },
  inqCatIcon:    { width: rs(24), height: rs(24), borderRadius: rs(12), backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  inqCatText:    { fontSize: rs(11), fontFamily: 'Poppins_500Medium', color: '#64748B' },
  statusBadge:   { paddingHorizontal: rs(9), paddingVertical: rs(3), borderRadius: rs(99) },
  statusText:    { fontSize: rs(10), fontFamily: 'Poppins_700Bold' },
  inqSubject:    { fontSize: rs(14), fontFamily: 'Poppins_700Bold', color: '#0F172A', marginBottom: rs(5) },
  inqMessage:    { fontSize: rs(12), fontFamily: 'Poppins_400Regular', color: '#64748B', lineHeight: rs(18), marginBottom: rs(10) },
  adminReply:    { backgroundColor: '#F0FDF4', borderRadius: rs(10), padding: rs(12), marginBottom: rs(8), borderLeftWidth: 3, borderLeftColor: '#22C55E' },
  adminReplyHeader: { flexDirection: 'row', alignItems: 'center', gap: rs(5), marginBottom: rs(5) },
  adminReplyLabel:  { fontSize: rs(11), fontFamily: 'Poppins_600SemiBold', color: '#16A34A' },
  adminReplyText:   { fontSize: rs(12), fontFamily: 'Poppins_400Regular', color: '#15803D', lineHeight: rs(18) },
  inqDate:       { fontSize: rs(10), fontFamily: 'Poppins_400Regular', color: '#94A3B8' },
});
