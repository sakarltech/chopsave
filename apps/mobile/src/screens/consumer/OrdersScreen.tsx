import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { api } from '../../services/api';

export function OrdersScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  useEffect(() => { api.get('/reservations').then(r => setOrders(r.data.reservations)).catch(() => {}); }, []);

  return (
    <View style={s.container}>
      <Text style={s.header}>Your Orders</Text>
      <FlatList
        data={orders}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={s.card}>
            <Text style={s.biz}>{item.businessName}</Text>
            <Text style={s.status}>{item.status}</Text>
            <Text style={s.price}>₦{item.amountPaid?.toLocaleString()}</Text>
            {['confirmed','ready'].includes(item.status) && <Text style={s.code}>{item.pickupCode}</Text>}
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>No orders yet</Text>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { fontSize: 24, fontWeight: 'bold', padding: 16, backgroundColor: '#fff' },
  card: { backgroundColor: '#fff', margin: 8, marginHorizontal: 16, padding: 16, borderRadius: 12, elevation: 2 },
  biz: { fontSize: 16, fontWeight: '600' },
  status: { fontSize: 12, color: '#16a34a', textTransform: 'uppercase', marginTop: 2 },
  price: { fontSize: 18, fontWeight: 'bold', marginTop: 4 },
  code: { fontSize: 20, fontWeight: 'bold', color: '#16a34a', letterSpacing: 4, marginTop: 8, textAlign: 'center' },
  empty: { textAlign: 'center', padding: 32, color: '#999' },
});
