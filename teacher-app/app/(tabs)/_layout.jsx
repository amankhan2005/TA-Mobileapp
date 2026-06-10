import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { OfflineBanner } from '../../src/components/ui/OfflineBanner';
import { rs } from '../../src/constants/layout';

const ACTIVE   = '#2563EB';
const INACTIVE = '#94A3B8';

// Issue 7: icons only — no text labels
function TabIcon({ iconName, focused }) {
  return (
    <View style={[ss.pill, focused && ss.pillActive]}>
      <Ionicons
        name={focused ? iconName : `${iconName}-outline`}
        size={rs(23)}
        color={focused ? ACTIVE : INACTIVE}
      />
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1 }}>
      <OfflineBanner />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: {
            position: 'absolute',
            backgroundColor: 'rgba(255,255,255,0.97)',
            borderTopWidth: 0,
            height: rs(62) + insets.bottom,
            paddingBottom: insets.bottom,
            paddingTop: rs(8),
            shadowColor: '#0F172A',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.07,
            shadowRadius: 20,
            elevation: 28,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{ tabBarIcon: ({ focused }) => <TabIcon iconName="home" focused={focused} /> }}
        />
        <Tabs.Screen
          name="history"
          options={{ tabBarIcon: ({ focused }) => <TabIcon iconName="calendar" focused={focused} /> }}
        />
        <Tabs.Screen
          name="support"
          options={{ tabBarIcon: ({ focused }) => <TabIcon iconName="chatbubble-ellipses" focused={focused} /> }}
        />
        <Tabs.Screen
          name="profile"
          options={{ tabBarIcon: ({ focused }) => <TabIcon iconName="person" focused={focused} /> }}
        />
        <Tabs.Screen name="center-placeholder" options={{ href: null }} />
        <Tabs.Screen name="inquiry-slot"       options={{ href: null }} />
      </Tabs>
    </View>
  );
}

const ss = StyleSheet.create({
  pill:       { width: rs(52), height: rs(36), borderRadius: rs(18), justifyContent: 'center', alignItems: 'center' },
  pillActive: { backgroundColor: `${ACTIVE}12` },
});
