import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { api } from '../../services/api';

export function BusinessDashboardScreen({ businessId }: { businessId?: string }) {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (businessId) {
      api.get(`/businesses/${businessId}/stats`).then(r => setStats(r.data)).catch(() => {});
    }
  }, [businessId]);

  if (!stats) return <View style={s.container}><Text style={s.loading}>Loading dashboard...</Text></View>;

  return (
    <ScrollView style={s.container}>
      <Text style={s.header}>Dashboard</Text>
      <View style={s.grid}>
        <View style={s.stat}><Text style={s.statVal}>{stats.activeListings}</Text><Text style={s.statLabel}>Active Listings</Text></View>
        <View style={s.stat}><Text style={s.statVal}>{stats.todayReservations}</Text><Text style={s.statLabel}>Today's Orders</Text></View>
        <View style={s.stat}><Text style={s.statVal}>₦{stats.todayRevenue?.toLocaleString()}</Text><Text style={s.statLabel}>Today's Revenue</Text></View>
        <View style={s.stat}><Text style={s.statVal}>{stats.totalCompleted}</Text><Text style={s.statLabel}>All-Time Pickups</Text></View>
      </View>
      <View style={s.impact}>
        <Text style={s.impactTitle}>🌍 Your Impact</Text>
        <Text style={s.impactVal}>{stats.foodSavedKg?.toFixed(1)} kg food saved</Text>
        <Text style={s.impactVal}>{stats.co2SavedKg?.toFixed(1)} kg CO₂ avoided</Text>
      </View>
      <View style={s.earnings}>
        <Text style={s.earningsTitle}>💰 Earnings</Text>
        <Text>Gross: ₦{stats.grossRevenue?.toLocaleString()}</Text>
        <Text>Commission: ₦{stats.commissionTotal?.toLocaleString()}</Text>
        <Text style={s.net}>Net: ₦{stats.netRevenue?.toLocaleString()}</Text>
        <Text style={s.balance}>Balance: ₦{stats.payoutBalance?.toLocaleString()}</Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  loading: { padding: 32, textAlign: 'center', color: '#999' },
  header: { fontSize: 24, fontWeight: 'bold', padding: 16, backgroundColor: '#fff' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 8 },
  stat: { width: '50%', padding: 8 },
  statVal: { fontSize: 24, fontWeight: 'bold', color: '#16a34a' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 2 },
  impact: { backgroundColor: '#ecfdf5', margin: 16, padding: 16, borderRadius: 12 },
  impactTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  impactVal: { fontSize: 14, color: '#166534', marginBottom: 4 },
  earnings: { backgroundColor: '#fff', margin: 16, padding: 16, borderRadius: 12 },
  earningsTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  net: { fontWeight: '600', marginTop: 4 },
  balance: { fontSize: 18, fontWeight: 'bold', color: '#16a34a', marginTop: 8 },
});
