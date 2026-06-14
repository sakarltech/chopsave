import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export function OTPVerifyScreen({ phone, onSuccess }: { phone: string; onSuccess: () => void }) {
  const [otp, setOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (otp.length !== 6) { Alert.alert('Error', 'Enter 6-digit code'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/otp/verify', { phone, otp, fullName: fullName || undefined });
      useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);
      useAuthStore.getState().setUser(data.user);
      onSuccess();
    } catch (e: any) { Alert.alert('Error', e.response?.data?.error || 'Verification failed'); }
    finally { setLoading(false); }
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>Verify Your Number</Text>
      <Text style={s.sub}>Code sent to {phone}</Text>
      <TextInput style={s.input} placeholder="000000" keyboardType="number-pad" value={otp} onChangeText={setOtp} maxLength={6} />
      <TextInput style={s.input} placeholder="Full name (new users)" value={fullName} onChangeText={setFullName} />
      <TouchableOpacity style={s.btn} onPress={handleVerify} disabled={loading}>
        <Text style={s.btnText}>{loading ? 'Verifying...' : 'Verify & Continue'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  sub: { fontSize: 14, color: '#666', marginBottom: 24 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 16, fontSize: 18, marginBottom: 12 },
  btn: { backgroundColor: '#16a34a', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
