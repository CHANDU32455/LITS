import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useAuth, AuthProvider } from '@/lib/auth-context';
import { View, ActivityIndicator, Text } from 'react-native';
import { router } from 'expo-router';

function RootLayoutNav() {
  const { session, user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (session && !user) {
        // User is authenticated but has no profile - redirect to complete profile
        console.log('Redirecting to complete profile');
        router.replace('/(auth)/complete-profile');
      } else if (session && user) {
        // User is fully authenticated - redirect to main app
        console.log('Redirecting to main app');
        router.replace('/(tabs)/analytics');
      } else if (!session) {
        // No session - redirect to auth screen
        console.log('Redirecting to auth');
        router.replace('/(auth)/login');
      }
    }
  }, [session, user, isLoading]);

  // Show loading screen while checking auth state
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 12, fontSize: 16, color: '#64748b' }}>Checking authentication...</Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}