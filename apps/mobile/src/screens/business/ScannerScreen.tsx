import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { api } from '../../services/api';

export function ScannerScreen() {
  const [code, setCode] = useState('');
  const [reservationId, setReservationId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCollect = async () => {
    if (!code || !reservationId) { Alert.alert('Error', 'Enter reservation ID and pickup code'); return; }
    setLoading(true);
    try {
      await api.post(`/reservations/${reservationId}/collect`, { pickupCode: code });
      Alert.alert('Success', 'Collection confirmed!');
      setCode(''); setReservationId('');
    } catch (e: any) { Alert.alert('Error', e.response?.data?.error || 'Invalid code'); }
    finally { setLoading(false); }
  };

  return (
    <View style={s.container}>
      <Text style={s.header}>Confirm Pickup</Text>
      <Text style={s.sub}>Enter the customer's pickup code to confirm collection</Text>
      <TextInput style={s.input} placeholder="Reservation ID" value={reservationId} onChangeText={setReservationId} />
      <TextInput style={s.input} placeholder="Pickup Code (6 chars)" value={code} onChangeText={(t) => setCode(t.toUpperCase())} maxLength={6} autoCapitalize="characters" />
      <TouchableOpacity style={s.btn} onPress={handleCollect} disabled={loading}>
        <Text style={s.btnText}>{loading ? 'Confirming...' : 'Confirm Collection'}</Text>
      </TouchableOpacity>
      <Text style={s.note}>Camera scanner coming in next update</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  sub: { fontSize: 14, color: '#666', marginBottom: 24 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 16, fontSize: 18, marginBottom: 12 },
  btn: { backgroundColor: '#16a34a', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  note: { textAlign: 'center', color: '#999', marginTop: 16, fontSize: 12 },
});
