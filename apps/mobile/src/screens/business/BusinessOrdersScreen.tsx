import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { api } from '../../services/api';

export function BusinessOrdersScreen() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => { fetchOrders(); }, []);
  const fetchOrders = () => api.get('/business/orders').then(r => setOrders(r.data.orders)).catch(() => {});

  const markReady = async (id: string) => {
    try { await api.patch(`/business/orders/${id}/ready`); Alert.alert('Done', 'Marked as ready'); fetchOrders(); }
    catch (e: any) { Alert.alert('Error', e.response?.data?.error || 'Failed'); }
  };

  return (
    <View style={s.container}>
      <Text style={s.header}>Today's Orders</Text>
      <FlatList
        data={orders}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={s.card}>
            <Text style={s.name}>{item.consumerName} · ...{item.pickupCodeLast4}</Text>
            <Text style={s.listing}>{item.listingTitle} × {item.quantity}</Text>
            <Text style={s.status}>{item.status}</Text>
            {item.status === 'confirmed' && (
              <TouchableOpacity style={s.readyBtn} onPress={() => markReady(item.id)}>
                <Text style={s.readyText}>Mark Ready</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>No orders today</Text>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { fontSize: 24, fontWeight: 'bold', padding: 16, backgroundColor: '#fff' },
  card: { backgroundColor: '#fff', margin: 8, marginHorizontal: 16, padding: 16, borderRadius: 12, elevation: 2 },
  name: { fontSize: 16, fontWeight: '600' },
  listing: { fontSize: 14, color: '#444', marginTop: 4 },
  status: { fontSize: 12, color: '#16a34a', textTransform: 'uppercase', marginTop: 4 },
  readyBtn: { backgroundColor: '#16a34a', padding: 10, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  readyText: { color: '#fff', fontWeight: '600' },
  empty: { textAlign: 'center', padding: 32, color: '#999' },
});
