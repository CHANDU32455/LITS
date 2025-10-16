// components/ProtectedRoute.tsx
import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { View, ActivityIndicator, Text } from 'react-native';
import { router } from 'expo-router';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  // Show loading indicator while checking authentication
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 12, color: '#64748b' }}>Loading...</Text>
      </View>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    router.replace('/(auth)/login');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 12, color: '#64748b' }}>Redirecting to login...</Text>
      </View>
    );
  }

  // Render children if authenticated
  return <>{children}</>;
}