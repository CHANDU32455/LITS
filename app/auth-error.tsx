// app/auth-error.tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { router } from 'expo-router';
import { XCircle, RefreshCw } from 'lucide-react-native';

export default function AuthError() {
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Parse error from URL hash
    const parseErrorFromUrl = () => {
      if (typeof window !== 'undefined' && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const errorDesc = hashParams.get('error_description') || hashParams.get('error') || 'Unknown error';
        setError(decodeURIComponent(errorDesc.replace(/\+/g, ' ')));
      }
    };

    parseErrorFromUrl();
  }, []);

  const handleRetry = () => {
    // Redirect back to signup/login
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <XCircle size={64} color="#ef4444" />
      <Text style={styles.title}>Authentication Error</Text>
      <Text style={styles.errorText}>{error}</Text>
      
      <TouchableOpacity style={styles.button} onPress={handleRetry}>
        <RefreshCw size={20} color="#fff" />
        <Text style={styles.buttonText}>Try Again</Text>
      </TouchableOpacity>
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
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});