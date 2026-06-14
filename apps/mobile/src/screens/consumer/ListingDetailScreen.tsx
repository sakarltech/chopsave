import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function ListingDetailScreen() {
  return (
    <View style={s.container}>
      <Text style={s.text}>📋 Listing Detail — Coming in next iteration</Text>
      <Text style={s.sub}>Full listing info, photos, dietary tags, and Reserve button</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  text: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  sub: { fontSize: 14, color: '#666', textAlign: 'center', paddingHorizontal: 32 },
});
