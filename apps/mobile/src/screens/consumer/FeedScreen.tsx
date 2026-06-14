import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { api } from '../../services/api';

export function FeedScreen() {
  const [listings, setListings] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchListings(); }, []);

  const fetchListings = async () => {
    try {
      const { data } = await api.get('/listings/nearby', { params: { lat: 6.5244, lng: 3.3792, radius: 5000 } });
      setListings(data.listings);
    } catch (e) { console.error(e); }
  };

  return (
    <View style={s.container}>
      <Text style={s.header}>🍛 Near You</Text>
      <FlatList
        data={listings}
        keyExtractor={(i) => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await fetchListings(); setRefreshing(false); }} />}
        renderItem={({ item }) => (
          <View style={s.card}>
            <Text style={s.biz}>{item.business.name}</Text>
            <Text style={s.price}>₦{item.discountPrice.toLocaleString()}</Text>
            <Text style={s.meta}>{Math.round(item.distanceMetres/1000*10)/10}km · {item.quantityRemaining} left</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>No food nearby. Check back later!</Text>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { fontSize: 24, fontWeight: 'bold', padding: 16, backgroundColor: '#fff' },
  card: { backgroundColor: '#fff', margin: 8, marginHorizontal: 16, padding: 16, borderRadius: 12, elevation: 2 },
  biz: { fontSize: 16, fontWeight: '600' },
  price: { fontSize: 20, fontWeight: 'bold', color: '#16a34a', marginTop: 4 },
  meta: { fontSize: 12, color: '#888', marginTop: 4 },
  empty: { textAlign: 'center', padding: 32, color: '#999' },
});
