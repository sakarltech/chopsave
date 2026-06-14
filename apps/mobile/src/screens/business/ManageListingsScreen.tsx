import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function ManageListingsScreen() {
  return (
    <View style={s.container}>
      <Text style={s.text}>📋 Manage Listings — Coming in next iteration</Text>
      <Text style={s.sub}>Edit, pause, resume, close, or delete your active listings</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' },
  text: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  sub: { fontSize: 14, color: '#666', textAlign: 'center', paddingHorizontal: 32 },
});
