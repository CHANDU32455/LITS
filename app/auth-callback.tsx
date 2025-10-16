import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { CheckCircle, XCircle, Lock } from 'lucide-react-native';

export default function ResetPasswordHandler() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing reset request...');

  useEffect(() => {
    const handleResetPassword = async () => {
      try {
        console.log('Starting password reset handler...');
        
        // Get parameters from URL hash
        const urlParams = new URLSearchParams(window.location.hash.substring(1));
        const access_token = urlParams.get('access_token');
        const refresh_token = urlParams.get('refresh_token');
        const type = urlParams.get('type');
        const error = urlParams.get('error');
        const error_description = urlParams.get('error_description');

        console.log('URL params:', { access_token, refresh_token, type, error, error_description });

        // Handle errors
        if (error) {
          throw new Error(error_description || `Authentication error: ${error}`);
        }

        // Verify this is a password reset flow
        if (type !== 'recovery') {
          throw new Error('Invalid reset link type');
        }

        if (!access_token || !refresh_token) {
          throw new Error('Invalid password reset link - missing tokens');
        }

        // Set the session with the tokens
        const { data: { session }, error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token
        });

        if (sessionError) throw sessionError;
        if (!session?.user) throw new Error('Invalid password reset session');

        console.log('Password reset session established for:', session.user.email);
        setStatus('success');
        setMessage('Password reset verified! Redirecting to set new password...');
        
        // Redirect to reset password page
        setTimeout(() => {
          router.replace('/reset-password');
        }, 1500);

      } catch (error: any) {
        console.error('Password reset handler failed:', error);
        setStatus('error');
        
        if (error.message?.includes('Invalid reset link')) {
          setMessage('Invalid or expired password reset link. Please request a new one.');
        } else if (error.message?.includes('already confirmed')) {
          setMessage('This reset link has already been used. Please request a new one.');
        } else {
          setMessage(error.message || 'Failed to process reset link. Please try again.');
        }
        
        setTimeout(() => {
          router.replace('/(auth)/forgot-password');
        }, 4000);
      }
    };

    handleResetPassword();
  }, []);

  const getIcon = () => {
    if (status === 'success') {
      return <Lock size={64} color="#22c55e" />;
    }
    if (status === 'error') {
      return <XCircle size={64} color="#ef4444" />;
    }
    return null;
  };

  const getTitle = () => {
    if (status === 'success') return 'Reset Link Verified';
    if (status === 'error') return 'Reset Failed';
    return 'Verifying Reset Link';
  };

  return (
    <View style={styles.container}>
      {status === 'loading' && (
        <>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.title}>{getTitle()}</Text>
          <Text style={styles.text}>{message}</Text>
        </>
      )}
      
      {(status === 'success' || status === 'error') && (
        <>
          {getIcon()}
          <Text style={[styles.title, status === 'success' ? styles.successText : styles.errorText]}>
            {getTitle()}
          </Text>
          <Text style={[styles.text, status === 'success' ? styles.successText : styles.errorText]}>
            {message}
          </Text>
        </>
      )}
      
      {status === 'error' && (
        <Text style={styles.helpText}>
          You will be redirected to request a new link...
        </Text>
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
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    color: '#64748b',
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
  helpText: {
    marginTop: 16,
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
});