import { Tabs } from 'expo-router';
import { View, Text, TouchableOpacity, StatusBar, Platform, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '@/lib/auth-context';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';

export default function TabLayout() {
  const { logout, user } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [rotation] = useState(new Animated.Value(0));

  // More robust Admin check
  const isAdmin = user?.position?.toLowerCase() === 'admin';

  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    // Start rotation animation
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();

    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
      rotation.stopAnimation();
    }
  };

  const rotationInterpolate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const CustomHeader = () => (
    <SafeAreaView edges={['top']} style={{ backgroundColor: '#2563eb' }}>
      <StatusBar barStyle="light-content" backgroundColor="#2563eb" />
      <View
        style={{
          height: 60,
          backgroundColor: '#2563eb',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingTop: Platform.OS === 'ios' ? 0 : 8,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="shield-checkmark" size={24} color="#fff" style={{ marginRight: 8 }} />
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>
            Safety First
          </Text>
        </View>

        <TouchableOpacity 
          onPress={handleLogout} 
          style={{ padding: 8 }}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <Animated.View style={{ transform: [{ rotate: rotationInterpolate }] }}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                  stroke="#ffffff"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Animated.View>
          ) : (
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
                stroke="#ffffff"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="m16 17 5-5-5-5"
                stroke="#ffffff"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M21 12H9"
                stroke="#ffffff"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  // ... (rest of your icon components remain the same)
  const AnalyticsIcon = ({ size, color }: { size: number; color: string }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 3v18h18"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="m19 9-5 5-4-4-3 3"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  const ReportIcon = ({ size, color }: { size: number; color: string }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  const InjuriesIcon = ({ size, color }: { size: number; color: string }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  const PreventiveIcon = ({ size, color }: { size: number; color: string }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  const UsersIcon = ({ size, color }: { size: number; color: string }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M23 21v-2a4 4 0 0 0-3-3.87"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 3.13a4 4 0 0 1 0 7.75"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  const ProfileIcon = ({ size, color }: { size: number; color: string }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  return (
    <Tabs
      screenOptions={{
        header: () => <CustomHeader />,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 85 : 60,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          paddingHorizontal: 8,
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ size, color }) => (
            <AnalyticsIcon size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reportInjury"
        options={{
          title: 'Report',
          tabBarIcon: ({ size, color }) => (
            <ReportIcon size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="injuries"
        options={{
          title: 'Injuries',
          tabBarIcon: ({ size, color }) => (
            <InjuriesIcon size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="preventive"
        options={{
          title: 'Preventive',
          tabBarIcon: ({ size, color }) => (
            <PreventiveIcon size={size} color={color} />
          ),
        }}
      />
      
      {/* Only show Users tab for Admin users */}
      {isAdmin ? (
        <Tabs.Screen
          name="users"
          options={{
            title: 'Users',
            tabBarIcon: ({ size, color }) => (
              <UsersIcon size={size} color={color} />
            ),
          }}
        />
      ) : (
        // Hide the users tab completely for non-admin users
        <Tabs.Screen
          name="users"
          options={{
            href: null, // This completely removes the tab from navigation
          }}
        />
      )}
      
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => (
            <ProfileIcon size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}