import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { api } from '../../services/api';

export function PhoneEntryScreen({ onOtpSent }: { onOtpSent: (phone: string) => void }) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (phone.length < 11) { Alert.alert('Error', 'Enter a valid Nigerian phone number'); return; }
    setLoading(true);
    try { await api.post('/auth/otp/send', { phone }); onOtpSent(phone); }
    catch (e: any) { Alert.alert('Error', e.response?.data?.error || 'Failed to send OTP'); }
    finally { setLoading(false); }
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>Welcome to ChopSave 🍛</Text>
      <Text style={s.sub}>Chop Well. Waste Nothing.</Text>
      <TextInput style={s.input} placeholder="08X XXXX XXXX" keyboardType="phone-pad" value={phone} onChangeText={setPhone} maxLength={14} />
      <TouchableOpacity style={s.btn} onPress={handleSend} disabled={loading}>
        <Text style={s.btnText}>{loading ? 'Sending...' : 'Send OTP'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  sub: { fontSize: 16, color: '#666', marginBottom: 32 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 16, fontSize: 18, marginBottom: 16 },
  btn: { backgroundColor: '#16a34a', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
