import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function CheckoutScreen() {
  return (
    <View style={s.container}>
      <Text style={s.text}>💳 Checkout — Coming in next iteration</Text>
      <Text style={s.sub}>Payment method selection (card, bank transfer, USSD) via Paystack</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  text: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  sub: { fontSize: 14, color: '#666', textAlign: 'center', paddingHorizontal: 32 },
});
