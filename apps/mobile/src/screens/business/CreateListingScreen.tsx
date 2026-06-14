import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { api } from '../../services/api';

export function CreateListingScreen() {
  const [type, setType] = useState<'surprise_bag' | 'itemised'>('surprise_bag');
  const [title, setTitle] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!discountPrice) { Alert.alert('Error', 'Price is required'); return; }
    setLoading(true);
    try {
      const now = new Date();
      const pickupStart = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
      const pickupEnd = new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString();

      await api.post('/listings', {
        type,
        title: title || `${type === 'surprise_bag' ? 'Surprise Bag' : 'Food Items'}`,
        originalPrice: originalPrice ? parseFloat(originalPrice) : parseFloat(discountPrice) * 2.5,
        discountPrice: parseFloat(discountPrice),
        quantityTotal: parseInt(quantity, 10),
        pickupStart,
        pickupEnd,
        foodCategories: ['local_dishes'],
        dietaryTags: [],
      });
      Alert.alert('Success', 'Listing created! Consumers can now see it.');
    } catch (e: any) { Alert.alert('Error', e.response?.data?.error || 'Failed to create listing'); }
    finally { setLoading(false); }
  };

  return (
    <ScrollView style={s.container}>
      <Text style={s.header}>Create Listing</Text>
      <View style={s.typeRow}>
        <TouchableOpacity style={[s.typeBtn, type === 'surprise_bag' && s.typeBtnActive]} onPress={() => setType('surprise_bag')}>
          <Text style={type === 'surprise_bag' ? s.typeTxtActive : s.typeTxt}>🎁 Surprise Bag</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.typeBtn, type === 'itemised' && s.typeBtnActive]} onPress={() => setType('itemised')}>
          <Text style={type === 'itemised' ? s.typeTxtActive : s.typeTxt}>📋 Itemised</Text>
        </TouchableOpacity>
      </View>
      <TextInput style={s.input} placeholder="Title (optional)" value={title} onChangeText={setTitle} />
      <TextInput style={s.input} placeholder="Discount price (₦)" keyboardType="numeric" value={discountPrice} onChangeText={setDiscountPrice} />
      <TextInput style={s.input} placeholder="Original price (₦)" keyboardType="numeric" value={originalPrice} onChangeText={setOriginalPrice} />
      <TextInput style={s.input} placeholder="Quantity" keyboardType="numeric" value={quantity} onChangeText={setQuantity} />
      <TouchableOpacity style={s.btn} onPress={handleCreate} disabled={loading}>
        <Text style={s.btnText}>{loading ? 'Creating...' : 'Publish Listing'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  typeBtn: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  typeBtnActive: { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
  typeTxt: { fontSize: 14, color: '#666' },
  typeTxtActive: { fontSize: 14, color: '#16a34a', fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 12 },
  btn: { backgroundColor: '#16a34a', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
