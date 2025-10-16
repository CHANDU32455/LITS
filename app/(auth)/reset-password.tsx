import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { Lock, Eye, EyeOff, CheckCircle, ArrowLeft } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordScreen() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const params = useLocalSearchParams();

  useEffect(() => {
    // Check if we have a valid session for password reset
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        Alert.alert('Error', 'Invalid or expired reset link. Please request a new one.');
        router.replace('/(auth)/forgot-password');
      }
    };

    checkSession();
  }, []);

  const validateForm = () => {
    const newErrors = {
      newPassword: '',
      confirmPassword: '',
    };

    if (!newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return !newErrors.newPassword && !newErrors.confirmPassword;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      setIsSuccess(true);
      
      // Auto-redirect to login after 3 seconds
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 3000);

    } catch (error: any) {
      console.error('Password reset error:', error);
      Alert.alert('Error', error.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.replace('/(auth)/login');
  };

  if (isSuccess) {
    return (
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Password Reset</Text>
          </View>

          {/* Success Card */}
          <View style={styles.card}>
            <View style={styles.successIcon}>
              <CheckCircle size={64} color="#22c55e" />
            </View>
            
            <Text style={styles.successTitle}>Password Updated</Text>
            <Text style={styles.successMessage}>
              Your password has been successfully reset.
            </Text>
            <Text style={styles.instructions}>
              Redirecting you to login page...
            </Text>

            <TouchableOpacity
              style={styles.backToLoginButton}
              onPress={handleBackToLogin}
            >
              <Text style={styles.backToLoginText}>Go to Login Now</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackToLogin}
          >
            <ArrowLeft size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.title}>New Password</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Create New Password</Text>
          <Text style={styles.cardSubtitle}>
            Please enter your new password below.
          </Text>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password *</Text>
              <View style={[
                styles.inputContainer,
                errors.newPassword && styles.inputError
              ]}>
                <Lock size={20} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNewPassword}
                  autoComplete="password-new"
                  editable={!isLoading}
                />
                <TouchableOpacity 
                  style={styles.eyeIcon}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  disabled={isLoading}
                >
                  {showNewPassword ? (
                    <EyeOff size={20} color="#6b7280" />
                  ) : (
                    <Eye size={20} color="#6b7280" />
                  )}
                </TouchableOpacity>
              </View>
              {errors.newPassword && (
                <Text style={styles.errorText}>{errors.newPassword}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password *</Text>
              <View style={[
                styles.inputContainer,
                errors.confirmPassword && styles.inputError
              ]}>
                <Lock size={20} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoComplete="password-new"
                  editable={!isLoading}
                />
                <TouchableOpacity 
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} color="#6b7280" />
                  ) : (
                    <Eye size={20} color="#6b7280" />
                  )}
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                (!newPassword || !confirmPassword || isLoading) && styles.submitButtonDisabled
              ]}
              onPress={handleResetPassword}
              disabled={!newPassword || !confirmPassword || isLoading}
            >
              <Text style={styles.submitButtonText}>
                {isLoading ? 'Updating...' : 'Reset Password'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Secure authentication • Enterprise-grade security
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    marginTop: Platform.OS === 'ios' ? 60 : 20,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  inputIcon: {
    marginLeft: 12,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#1e293b',
  },
  eyeIcon: {
    padding: 12,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  successIcon: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#22c55e',
    textAlign: 'center',
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  instructions: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  backToLoginButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  backToLoginText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
});