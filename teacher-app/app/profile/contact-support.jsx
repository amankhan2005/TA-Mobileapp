import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { settingsService } from '../../src/api/settings.service';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { Colors } from '../../src/constants/colors';
import { rs } from '../../src/constants/layout';
import { Typography } from '../../src/constants/typography';

export default function ContactSupportScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [support, setSupport] = useState({ phone:null, email:null, whatsapp:null });

  useEffect(() => {
    settingsService.getSettings()
      .then(r => {
        const s = r.settings || {};
        setSupport({ phone: s.supportPhone||null, email: s.supportEmail||null, whatsapp: s.supportWhatsApp||null });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const open = (url) => Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open app.'));

  const hasAny = support.phone || support.email || support.whatsapp;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScreenHeader title="Contact Support" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + rs(32) }]}>
        <View style={styles.banner}>
          <View style={styles.bannerIcon}><Ionicons name="headset-outline" size={rs(38)} color={Colors.teal} /></View>
          <Text style={styles.bannerTitle}>School Support</Text>
          <Text style={styles.bannerSub}>Contact your school admin for help with attendance or account issues.</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.teal} size="large" style={{ marginTop:rs(40) }} />
        ) : !hasAny ? (
          <View style={styles.empty}>
            <Ionicons name="information-circle-outline" size={rs(36)} color={Colors.textLight} />
            <Text style={styles.emptyTitle}>No contact configured</Text>
            <Text style={styles.emptySub}>Your school admin hasn't set up support contacts yet. Please reach out to them directly.</Text>
          </View>
        ) : (
          <View style={styles.cards}>
            {support.phone && (
              <TouchableOpacity style={styles.card} onPress={() => open(`tel:${support.phone}`)} activeOpacity={0.82}>
                <View style={[styles.cardIcon,{backgroundColor:'#DCFCE7'}]}><Ionicons name="call" size={rs(24)} color="#16A34A"/></View>
                <View style={{flex:1}}><Text style={styles.cardLabel}>Call School Admin</Text><Text style={styles.cardValue}>{support.phone}</Text></View>
                <Ionicons name="chevron-forward" size={rs(20)} color={Colors.textLight}/>
              </TouchableOpacity>
            )}
            {support.email && (
              <TouchableOpacity style={styles.card} onPress={() => open(`mailto:${support.email}`)} activeOpacity={0.82}>
                <View style={[styles.cardIcon,{backgroundColor:'#DBEAFE'}]}><Ionicons name="mail" size={rs(24)} color="#2563EB"/></View>
                <View style={{flex:1}}><Text style={styles.cardLabel}>Email School Admin</Text><Text style={styles.cardValue}>{support.email}</Text></View>
                <Ionicons name="chevron-forward" size={rs(20)} color={Colors.textLight}/>
              </TouchableOpacity>
            )}
            {support.whatsapp && (
              <TouchableOpacity style={styles.card} onPress={() => open(`https://wa.me/${support.whatsapp.replace(/\D/g,'')}`)} activeOpacity={0.82}>
                <View style={[styles.cardIcon,{backgroundColor:'#DCFCE7'}]}><Ionicons name="logo-whatsapp" size={rs(24)} color="#25D366"/></View>
                <View style={{flex:1}}><Text style={styles.cardLabel}>WhatsApp School Admin</Text><Text style={styles.cardValue}>{support.whatsapp}</Text></View>
                <Ionicons name="chevron-forward" size={rs(20)} color={Colors.textLight}/>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:      { flex:1, backgroundColor:Colors.bg },
  content:     { padding:rs(16) },
  banner:      { backgroundColor:Colors.tealLight, borderRadius:rs(20), padding:rs(24), alignItems:'center', marginBottom:rs(24) },
  bannerIcon:  { width:rs(72), height:rs(72), borderRadius:rs(36), backgroundColor:Colors.bgCard, justifyContent:'center', alignItems:'center', marginBottom:rs(14) },
  bannerTitle: { ...Typography.h3, color:Colors.textDark, marginBottom:rs(8) },
  bannerSub:   { ...Typography.body2, color:Colors.textMid, textAlign:'center', lineHeight:rs(20) },
  cards:       { gap:rs(12) },
  card:        { flexDirection:'row', alignItems:'center', gap:rs(14), backgroundColor:Colors.bgCard, borderRadius:rs(16), padding:rs(16) },
  cardIcon:    { width:rs(52), height:rs(52), borderRadius:rs(26), justifyContent:'center', alignItems:'center', flexShrink:0 },
  cardLabel:   { ...Typography.label, color:Colors.textDark, marginBottom:rs(2) },
  cardValue:   { ...Typography.body2, color:Colors.textMid },
  empty:       { alignItems:'center', padding:rs(32), gap:rs(10) },
  emptyTitle:  { ...Typography.h4, color:Colors.textDark },
  emptySub:    { ...Typography.body2, color:Colors.textMid, textAlign:'center', lineHeight:rs(20) },
});
