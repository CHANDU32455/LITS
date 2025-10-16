import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useAuth } from '@/lib/auth-context';

export default function Index() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 12, fontSize: 16, color: '#64748b' }}>Loading...</Text>
      </View>
    );
  }

  return null; // The root layout will handle redirects
}