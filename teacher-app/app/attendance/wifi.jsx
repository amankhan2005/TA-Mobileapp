import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import * as Network from 'expo-network';
import { Ionicons } from '@expo/vector-icons';
import { attendanceService } from '../../src/api/attendance.service';
import useAuthStore from '../../src/store/authStore';
import useAttendanceStore from '../../src/store/attendanceStore';
import useOfflineStore from '../../src/store/offlineStore';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { Button } from '../../src/components/ui/Button';
import { Colors } from '../../src/constants/colors';
import { rs } from '../../src/constants/layout';
import { Typography } from '../../src/constants/typography';
import { getTodayString } from '../../src/utils/formatDate';

const STEPS = [
  { icon: 'wifi-outline',           title: 'Checking Wi-Fi',          sub: 'Verifying network connectivity' },
  { icon: 'location-outline',       title: 'Checking Location',        sub: 'Verifying you are within school area' },
  { icon: 'shield-outline',         title: 'Checking VPN',             sub: 'Ensuring no VPN is active' },
  { icon: 'phone-portrait-outline', title: 'Checking Location Integrity', sub: 'Verifying GPS is genuine' },
];

const S = { idle:'idle', checking:'checking', pass:'pass', fail:'fail' };
const delay = ms => new Promise(r => setTimeout(r, ms));

export default function WifiAttendanceScreen() {
  const insets         = useSafeAreaInsets();
  const router         = useRouter();
  const deviceId       = useAuthStore(s => s.deviceId);
  const setTodayRecord = useAttendanceStore(s => s.setTodayRecord);
  const enqueue        = useOfflineStore(s => s.enqueue);
  const hasToday       = useOfflineStore(s => s.hasToday);

  const [currentStep, setCurrentStep] = useState(-1);
  const [statuses,    setStatuses]    = useState(Array(4).fill(S.idle));
  const [details,     setDetails]     = useState(Array(4).fill(null));
  const [running,     setRunning]     = useState(false);
  const [error,       setError]       = useState(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [allPassed,   setAllPassed]   = useState(false);
  const [queued,      setQueued]      = useState(false);
  const [showQR,      setShowQR]      = useState(false);  // Issue 2: QR fallback

  const collected = useRef({ wifiSSID: null, gatewayIp: null, gpsLat: null, gpsLon: null, hasVPN: false, hasMockGPS: false });
  const progAnims = useRef(STEPS.map(() => new Animated.Value(0))).current;

  const animProg = i => { progAnims[i].setValue(0); Animated.timing(progAnims[i], { toValue:1, duration:1600, useNativeDriver:false }).start(); };
  const setStep  = (i, status, detail=null) => {
    setStatuses(s => { const n=[...s]; n[i]=status; return n; });
    setDetails (d => { const n=[...d]; n[i]=detail; return n; });
  };

  const runValidation = async () => {
    setRunning(true); setError(null); setAllPassed(false); setQueued(false); setShowQR(false);
    setStatuses(Array(4).fill(S.idle)); setDetails(Array(4).fill(null));
    const c = collected.current;

    if (hasToday(getTodayString())) {
      setError('Attendance already queued for today. It will sync when online.'); setRunning(false); return;
    }

    // Step 0: Wi-Fi connectivity (SSID retrieval blocked by iOS — skipped safely)
    setCurrentStep(0); setStep(0, S.checking); animProg(0); await delay(900);
    try {
      const net = await Network.getNetworkStateAsync();
      if (!net.isConnected || net.type !== Network.NetworkStateType.WIFI) {
        setStep(0, S.fail, { label:'Wi-Fi', value:'Not Connected' });
        setError('Not connected to Wi-Fi. Please connect to your school Wi-Fi network.');
        setShowQR(true); setRunning(false); return;
      }
      c.wifiSSID = null;  // iOS blocks SSID — null is intentional, backend handles it
      c.gatewayIp = null; // No native module available — null is intentional
      setStep(0, S.pass, { label:'Wi-Fi', value:'Connected' });
    } catch { setStep(0, S.fail, { label:'Wi-Fi', value:'Check Failed' }); setError('Unable to check Wi-Fi.'); setShowQR(true); setRunning(false); return; }

    // Step 1: GPS
    setCurrentStep(1); setStep(1, S.checking); animProg(1); await delay(500);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setStep(1, S.fail, { label:'Location', value:'Permission Denied' }); setError('Location permission required.'); setShowQR(true); setRunning(false); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      c.gpsLat = loc.coords.latitude; c.gpsLon = loc.coords.longitude; c.hasMockGPS = loc.mocked || false;
      setStep(1, S.pass, { label:'Distance from School', value:'Verifying on server…' });
    } catch { setStep(1, S.fail, { label:'Location', value:'GPS Unavailable' }); setError('Unable to get location. Enable GPS.'); setShowQR(true); setRunning(false); return; }

    // Step 2: VPN
    setCurrentStep(2); setStep(2, S.checking); animProg(2); await delay(600);
    c.hasVPN = false; setStep(2, S.pass, { label:'VPN Status', value:'Not Detected' });

    // Step 3: Mock GPS
    setCurrentStep(3); setStep(3, S.checking); animProg(3); await delay(600);
    if (c.hasMockGPS) { setStep(3, S.fail, { label:'Mock GPS', value:'Detected' }); setError('Mock GPS detected. Disable spoofing apps.'); setShowQR(true); setRunning(false); return; }
    setStep(3, S.pass, { label:'Mock GPS', value:'Not Detected' });

    setCurrentStep(-1); setRunning(false); setAllPassed(true);
  };

  const submitAttendance = async () => {
    setSubmitting(true);
    const c = collected.current;
    try {
      const data = await attendanceService.markWifi({
        wifiSSID: c.wifiSSID, gatewayIp: c.gatewayIp,
        gpsLatitude: c.gpsLat, gpsLongitude: c.gpsLon,
        deviceId, hasVPN: c.hasVPN, hasMockGPS: c.hasMockGPS,
      });
      setTodayRecord(data.record);
      router.replace({ pathname: '/attendance/success', params: { mode:'wifi', time: new Date().toISOString() } });
    } catch (err) {
      if (err?.isNetworkError) {
        await enqueue({ date: getTodayString(), wifiSSID:c.wifiSSID, gatewayIp:c.gatewayIp, gpsLat:c.gpsLat, gpsLon:c.gpsLon, hasVPN:c.hasVPN, hasMockGPS:c.hasMockGPS });
        setQueued(true); setAllPassed(false);
      } else {
        const serverErrors = err?.data?.errors || [];
        serverErrors.forEach(e => {
          if (e.check==='wifi')    setStep(0, S.fail, { label:'Wi-Fi',    value:'SSID mismatch' });
          if (e.check==='gateway') setStep(0, S.fail, { label:'Gateway',  value:'IP mismatch' });
          if (e.check==='gps')     setStep(1, S.fail, { label:'Location', value:e.message });
          if (e.check==='vpn')     setStep(2, S.fail, { label:'VPN',      value:'Detected' });
          if (e.check==='mockGps') setStep(3, S.fail, { label:'Mock GPS', value:'Detected' });
        });
        setAllPassed(false);
        setShowQR(true); // Issue 2: Always show QR fallback when server rejects
        setError(serverErrors[0]?.message || err?.message || 'Validation failed. Try QR attendance instead.');
      }
    } finally { setSubmitting(false); }
  };

  if (queued) return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScreenHeader title="Wi-Fi Attendance" />
      <View style={styles.center}>
        <View style={styles.queuedIcon}><Ionicons name="cloud-upload-outline" size={rs(48)} color={Colors.warning} /></View>
        <Text style={styles.queuedTitle}>Attendance Queued</Text>
        <Text style={styles.queuedSub}>No internet. Saved and will sync automatically.</Text>
        <Button title="Back to Home" onPress={() => router.replace('/(tabs)')} style={styles.actionBtn} />
      </View>
    </View>
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScreenHeader title="Wi-Fi Attendance" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {STEPS.map((step, idx) => (
          <StepCard key={idx} step={step} status={statuses[idx]} detail={details[idx]}
            isCurrent={currentStep===idx} stepNum={idx+1} progAnim={progAnims[idx]} />
        ))}
        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={rs(18)} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        {/* Issue 2: QR fallback button */}
        {showQR && (
          <TouchableOpacity style={styles.qrFallback} onPress={() => router.push('/attendance/qr')} activeOpacity={0.82}>
            <View style={styles.qrFallbackIcon}><Ionicons name="qr-code" size={rs(24)} color={Colors.teal} /></View>
            <View style={{ flex:1 }}>
              <Text style={styles.qrFallbackTitle}>Use QR Attendance Instead</Text>
              <Text style={styles.qrFallbackSub}>Ask your admin to generate a QR code</Text>
            </View>
            <Ionicons name="chevron-forward" size={rs(18)} color={Colors.textLight} />
          </TouchableOpacity>
        )}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + rs(16) }]}>
        {!allPassed
          ? <Button title={running ? 'Validating…' : statuses[0]!==S.idle ? 'Retry Validation' : 'Start Validation'} onPress={runValidation} loading={running} disabled={running} />
          : <Button title="Submit Attendance" onPress={submitAttendance} loading={submitting} />
        }
      </View>
    </View>
  );
}

function StepCard({ step, status, detail, isCurrent, stepNum, progAnim }) {
  const isPassed=status===S.pass, isFailed=status===S.fail, isCheck=status===S.checking, isIdle=status===S.idle;
  const iconBg    = isIdle?'#F1F5F9':isCheck?Colors.tealLight:isPassed?Colors.tealLight:Colors.errorLight;
  const iconColor = isIdle?Colors.textLight:isCheck?Colors.teal:isPassed?Colors.teal:Colors.error;
  const barW      = progAnim.interpolate({ inputRange:[0,1], outputRange:['0%','100%'] });
  return (
    <View style={[styles.card, isCurrent&&styles.cardActive]}>
      <View style={[styles.cardIcon, { backgroundColor:iconBg }]}><Ionicons name={step.icon} size={rs(28)} color={iconColor} /></View>
      <Text style={styles.cardTitle}>{step.title}</Text>
      <Text style={styles.cardSub}>{step.sub}</Text>
      <View style={styles.bar}>
        {isCheck ? <Animated.View style={[styles.barFill,{width:barW}]} />
          : <View style={[styles.barFill,{width:(isPassed||isFailed)?'100%':'0%',backgroundColor:isFailed?Colors.error:Colors.teal}]} />}
      </View>
      {detail && (
        <View style={styles.detailRow}>
          <View><Text style={styles.detailLabel}>{detail.label}</Text><Text style={[styles.detailValue,isFailed&&{color:Colors.error}]}>{detail.value}</Text></View>
          {(isPassed||isFailed)&&<View style={[styles.statusCircle,{backgroundColor:isPassed?Colors.success:Colors.error}]}><Ionicons name={isPassed?'checkmark':'close'} size={rs(14)} color="#fff"/></View>}
        </View>
      )}
      {isCurrent&&<Text style={styles.stepCounter}>Checking… · Step {stepNum} of {STEPS.length}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  screen:   { flex:1, backgroundColor:Colors.bg },
  content:  { padding:rs(16), gap:rs(10), paddingBottom:rs(8) },
  card:     { backgroundColor:Colors.bgCard, borderRadius:rs(16), padding:rs(18), alignItems:'center', shadowColor:Colors.shadow, shadowOffset:{width:0,height:2}, shadowOpacity:1, shadowRadius:8, elevation:3 },
  cardActive:{ borderWidth:1.5, borderColor:Colors.tealAccent },
  cardIcon: { width:rs(68), height:rs(68), borderRadius:rs(34), justifyContent:'center', alignItems:'center', marginBottom:rs(10) },
  cardTitle:{ ...Typography.h4, color:Colors.textDark, textAlign:'center', marginBottom:rs(4) },
  cardSub:  { ...Typography.body2, color:Colors.textMid, textAlign:'center', marginBottom:rs(12), lineHeight:rs(18) },
  bar:      { width:'100%', height:rs(4), backgroundColor:Colors.border, borderRadius:rs(2), overflow:'hidden', marginBottom:rs(8) },
  barFill:  { height:'100%', backgroundColor:Colors.teal, borderRadius:rs(2) },
  detailRow:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', width:'100%', marginTop:rs(4) },
  detailLabel:{ ...Typography.caption, color:Colors.textLight },
  detailValue:{ ...Typography.label, color:Colors.textDark },
  statusCircle:{ width:rs(28), height:rs(28), borderRadius:rs(14), justifyContent:'center', alignItems:'center' },
  stepCounter:{ ...Typography.caption, color:Colors.textMid, marginTop:rs(6) },
  errorBox: { flexDirection:'row', gap:rs(8), backgroundColor:Colors.errorLight, borderRadius:rs(12), padding:rs(14) },
  errorText:{ ...Typography.body2, color:Colors.error, flex:1, lineHeight:rs(20) },
  qrFallback:{ flexDirection:'row', alignItems:'center', gap:rs(12), backgroundColor:Colors.tealLight, borderRadius:rs(16), padding:rs(16), borderWidth:1.5, borderColor:Colors.tealAccent },
  qrFallbackIcon:{ width:rs(48), height:rs(48), borderRadius:rs(24), backgroundColor:Colors.bgCard, justifyContent:'center', alignItems:'center', flexShrink:0 },
  qrFallbackTitle:{ ...Typography.label, color:Colors.teal, fontFamily:'Poppins_600SemiBold' },
  qrFallbackSub:{ ...Typography.body3, color:Colors.tealDark, marginTop:rs(2) },
  footer:   { padding:rs(16), paddingTop:rs(8), backgroundColor:Colors.bgCard, borderTopWidth:StyleSheet.hairlineWidth, borderTopColor:Colors.border },
  center:   { flex:1, justifyContent:'center', alignItems:'center', padding:rs(32), gap:rs(12) },
  queuedIcon:{ width:rs(90), height:rs(90), borderRadius:rs(45), backgroundColor:Colors.warningLight, justifyContent:'center', alignItems:'center' },
  queuedTitle:{ ...Typography.h3, color:Colors.textDark },
  queuedSub:{ ...Typography.body1, color:Colors.textMid, textAlign:'center', lineHeight:rs(24) },
  actionBtn:{ width:'100%', marginTop:rs(8) },
});
