import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordHandler() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing reset request...');

  useEffect(() => {
    const handleResetPassword = async () => {
      try {
        console.log('Checking for existing session...');
        
        // Check current session first
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('Already have session for:', session.user.email);
          setStatus('success');
          setMessage('Redirecting to password reset...');
          
          setTimeout(() => {
            router.replace({ pathname: '/reset-password' } as any);
          }, 1000);
          return;
        }

        // If no session, try to get from URL hash
        const urlParams = new URLSearchParams(window.location.hash.substring(1));
        const access_token = urlParams.get('access_token');
        const refresh_token = urlParams.get('refresh_token');
        const type = urlParams.get('type');

        console.log('Hash params:', { access_token, refresh_token, type });

        if (type === 'recovery' && access_token && refresh_token) {
          const { data: { session: newSession }, error } = await supabase.auth.setSession({
            access_token,
            refresh_token
          });

          if (error) throw error;
          
          if (newSession?.user) {
            console.log('Password reset session established');
            setStatus('success');
            setMessage('Redirecting to password reset...');
            
            setTimeout(() => {
              router.replace({ pathname: '/reset-password' } as any);
            }, 1000);
            return;
          }
        }

        throw new Error('No valid reset session found');

      } catch (error: any) {
        console.log('Reset password handler failed:', error);
        setStatus('error');
        setMessage('Please request a new reset link from the login screen.');
        
        setTimeout(() => {
          router.replace({ pathname: '/(auth)/login' } as any);
        }, 3000);
      }
    };

    handleResetPassword();
  }, []);

  return (
    <View style={styles.container}>
      {status === 'loading' && (
        <>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.title}>Verifying Reset Link</Text>
          <Text style={styles.text}>{message}</Text>
        </>
      )}
      
      {status === 'success' && (
        <>
          <Text style={[styles.title, styles.successText]}>Reset Verified</Text>
          <Text style={[styles.text, styles.successText]}>{message}</Text>
        </>
      )}
      
      {status === 'error' && (
        <>
          <Text style={[styles.title, styles.errorText]}>Reset Failed</Text>
          <Text style={[styles.text, styles.errorText]}>{message}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  title: {
    marginTop: 16,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 22,
  },
  successText: {
    color: '#22c55e',
  },
  errorText: {
    color: '#ef4444',
  },
});