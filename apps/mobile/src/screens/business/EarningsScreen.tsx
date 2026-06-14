import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function EarningsScreen() {
  return (
    <View style={s.container}>
      <Text style={s.text}>💰 Earnings & Payouts — Coming in next iteration</Text>
      <Text style={s.sub}>Request payouts to your Nigerian bank account, view earnings breakdown</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' },
  text: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  sub: { fontSize: 14, color: '#666', textAlign: 'center', paddingHorizontal: 32 },
});
