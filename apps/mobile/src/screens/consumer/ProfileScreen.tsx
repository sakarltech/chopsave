import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';

export function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => { try { await api.post('/auth/logout', { refreshToken: useAuthStore.getState().refreshToken }); } catch {} logout(); };
  const handleDelete = () => Alert.alert('Delete Account', 'This cannot be undone.', [{ text: 'Cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => { await api.delete('/users/me'); logout(); } }]);

  return (
    <View style={s.container}>
      <Text style={s.header}>Profile</Text>
      <View style={s.card}>
        <Text style={s.name}>{user?.displayName || user?.fullName}</Text>
        <Text style={s.phone}>{user?.phone || user?.email}</Text>
      </View>
      <TouchableOpacity style={s.btn} onPress={handleLogout}><Text style={s.btnText}>Log Out</Text></TouchableOpacity>
      <TouchableOpacity onPress={handleDelete}><Text style={s.del}>Delete Account</Text></TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 24 },
  name: { fontSize: 20, fontWeight: '600', marginBottom: 4 },
  phone: { fontSize: 14, color: '#666' },
  btn: { backgroundColor: '#f3f4f6', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  btnText: { fontSize: 16, fontWeight: '600' },
  del: { fontSize: 14, color: '#ef4444', textAlign: 'center', marginTop: 12 },
});
