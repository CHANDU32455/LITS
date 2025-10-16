import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

type AuthMode = 'login' | 'signup';

export default function AuthScreen() {
  const { user, login, isLoading, isLoggingIn } = useAuth();
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [touched, setTouched] = useState({
    email: false,
    password: false,
    confirmPassword: false,
  });

  useEffect(() => {
    if (user && !isLoading) {
      router.replace('/(tabs)/reportInjury');
    }
  }, [user, isLoading]);

  // Local signup function that works with Supabase
  const handleSignup = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsSigningUp(true);
      
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        Alert.alert('Signup Failed', authError.message);
        return false;
      }

      if (authData.user) {
        // Create user profile in profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: authData.user.id,
              email: email,
              full_name: email.split('@')[0], // Default to username part of email
              employee_number: `EMP${Date.now()}`,
              position: 'Employee',
              department_name: 'General',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          ]);

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // Still return true since auth was successful, profile can be updated later
        }

        Alert.alert(
          'Success!', 
          'Account created successfully. You can now complete your profile.',
          [{ text: 'OK', onPress: () => router.push('/(auth)/complete-profile') }]
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert('Signup Failed', 'An unexpected error occurred');
      return false;
    } finally {
      setIsSigningUp(false);
    }
  };

  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'email':
        if (!value) {
          newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(value)) {
          newErrors.email = 'Email is invalid';
        } else {
          newErrors.email = '';
        }
        break;

      case 'password':
        if (!value) {
          newErrors.password = 'Password is required';
        } else if (authMode === 'signup') {
          if (value.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
          } else if (!/(?=.*[a-z])/.test(value)) {
            newErrors.password = 'Must contain at least one lowercase letter';
          } else if (!/(?=.*[A-Z])/.test(value)) {
            newErrors.password = 'Must contain at least one uppercase letter';
          } else if (!/(?=.*\d)/.test(value)) {
            newErrors.password = 'Must contain at least one number';
          } else if (!/(?=.*[@$!%*?&#])/.test(value)) {
            newErrors.password = 'Must contain a special character (@$!%*?&#)';
          } else {
            newErrors.password = '';
          }
          if (formData.confirmPassword) {
            if (value !== formData.confirmPassword) {
              newErrors.confirmPassword = 'Passwords do not match';
            } else {
              newErrors.confirmPassword = '';
            }
          }
        } else {
          if (value.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
          } else {
            newErrors.password = '';
          }
        }
        break;

      case 'confirmPassword':
        if (authMode === 'signup') {
          if (!value) {
            newErrors.confirmPassword = 'Please confirm your password';
          } else if (value !== formData.password) {
            newErrors.confirmPassword = 'Passwords do not match';
          } else {
            newErrors.confirmPassword = '';
          }
        }
        break;
    }

    setErrors(newErrors);
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field as keyof typeof formData]);
  };

  const handleAuth = async () => {
    const fieldsToTouch = authMode === 'login'
      ? { email: true, password: true }
      : { email: true, password: true, confirmPassword: true };

    setTouched(prev => ({ ...prev, ...fieldsToTouch }));

    Object.keys(fieldsToTouch).forEach(key => {
      validateField(key, formData[key as keyof typeof formData]);
    });

    const relevantErrors = authMode === 'login'
      ? { email: errors.email, password: errors.password }
      : errors;

    const hasErrors = Object.values(relevantErrors).some(error => error !== '');

    const allFieldsFilled = authMode === 'login'
      ? formData.email && formData.password
      : formData.email && formData.password && formData.confirmPassword;

    if (hasErrors || !allFieldsFilled) {
      Alert.alert('Validation Error', 'Please fill all required fields correctly.');
      return;
    }

    if (authMode === 'login') {
      const success = await login(formData.email, formData.password);
      if (success) {
        resetForm();
      }
    } else {
      const success = await handleSignup(formData.email, formData.password);
      if (success) {
        resetForm();
        // Don't switch to login mode automatically - let user complete profile
      }
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
    });
    setErrors({
      email: '',
      password: '',
      confirmPassword: '',
    });
    setTouched({
      email: false,
      password: false,
      confirmPassword: false,
    });
  };

  const toggleAuthMode = () => {
    setAuthMode(prev => prev === 'login' ? 'signup' : 'login');
    resetForm();
  };

  const isSubmitDisabled = () => {
    if (isLoggingIn || isSigningUp) return true;

    if (authMode === 'login') {
      return !formData.email || !formData.password || !!errors.email || !!errors.password;
    } else {
      return !formData.email || !formData.password || !formData.confirmPassword ||
        !!errors.email || !!errors.password || !!errors.confirmPassword;
    }
  };

  if (isLoading && !user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Checking authentication...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.logo}>
              <Text style={styles.logoIcon}>🛡️</Text>
            </View>
            <Text style={styles.title}>Safety First</Text>
            <Text style={styles.subtitle}>
              Workplace Injury Management System
            </Text>
          </View>

          {/* Auth Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
            </Text>
            <Text style={styles.cardSubtitle}>
              {authMode === 'login'
                ? 'Sign in to your account to continue'
                : 'Create a new account to get started'
              }
            </Text>

            <View style={styles.form}>
              {/* Email Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={[
                  styles.inputContainer,
                  errors.email && touched.email && styles.inputError
                ]}>
                  <Mail size={20} color="#6b7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    value={formData.email}
                    onChangeText={(text) => {
                      setFormData({ ...formData, email: text });
                      if (touched.email) validateField('email', text);
                    }}
                    onBlur={() => handleBlur('email')}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    editable={!(isLoggingIn || isSigningUp)}
                  />
                </View>
                {errors.email && touched.email && (
                  <View style={styles.errorContainer}>
                    <AlertCircle size={14} color="#ef4444" />
                    <Text style={styles.errorText}>{errors.email}</Text>
                  </View>
                )}
              </View>

              {/* Password Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={[
                  styles.inputContainer,
                  errors.password && touched.password && styles.inputError
                ]}>
                  <Lock size={20} color="#6b7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={authMode === 'login' ? "Enter your password" : "Create a strong password"}
                    value={formData.password}
                    onChangeText={(text) => {
                      setFormData({ ...formData, password: text });
                      if (touched.password) validateField('password', text);
                    }}
                    onBlur={() => handleBlur('password')}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    editable={!(isLoggingIn || isSigningUp)}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={isLoggingIn || isSigningUp}
                  >
                    {showPassword ? (
                      <EyeOff size={20} color="#6b7280" />
                    ) : (
                      <Eye size={20} color="#6b7280" />
                    )}
                  </TouchableOpacity>
                </View>
                {errors.password && touched.password && (
                  <View style={styles.errorContainer}>
                    <AlertCircle size={14} color="#ef4444" />
                    <Text style={styles.errorText}>{errors.password}</Text>
                  </View>
                )}
              </View>

              {/* Confirm Password (Signup only) */}
              {authMode === 'signup' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <View style={[
                    styles.inputContainer,
                    errors.confirmPassword && touched.confirmPassword && styles.inputError
                  ]}>
                    <Lock size={20} color="#6b7280" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChangeText={(text) => {
                        setFormData({ ...formData, confirmPassword: text });
                        if (touched.confirmPassword) validateField('confirmPassword', text);
                      }}
                      onBlur={() => handleBlur('confirmPassword')}
                      secureTextEntry={!showPassword}
                      autoComplete="password"
                      editable={!isSigningUp}
                    />
                  </View>
                  {errors.confirmPassword && touched.confirmPassword && (
                    <View style={styles.errorContainer}>
                      <AlertCircle size={14} color="#ef4444" />
                      <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  isSubmitDisabled() && styles.submitButtonDisabled
                ]}
                onPress={handleAuth}
                disabled={isSubmitDisabled()}
              >
                {(isLoggingIn || isSigningUp) ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {authMode === 'login' ? 'Sign In' : 'Create Account'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Auth Mode Toggle */}
            <View style={styles.authToggle}>
              <Text style={styles.authToggleText}>
                {authMode === 'login'
                  ? "Don't have an account? "
                  : "Already have an account? "
                }
              </Text>
              <TouchableOpacity onPress={toggleAuthMode}>
                <Text style={styles.authToggleLink}>
                  {authMode === 'login' ? 'Sign Up' : 'Sign In'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Forgot Password Link */}
            {authMode === 'login' && (
              <TouchableOpacity
                style={styles.forgotPasswordLink}
                onPress={() => router.push('/(auth)/forgot-password')}
              >
                <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Secure authentication • Enterprise-grade security
            </Text>
            <Text style={[styles.footerText, { marginTop: 4 }]}>
              © 2024 Safety First. All rights reserved.
            </Text>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoIcon: {
    fontSize: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
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
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    minHeight: 48,
  },
  input: {
    flex: 1,
    padding: 12,
    paddingLeft: 40,
    fontSize: 16,
    color: '#1e293b',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    zIndex: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
  },
  submitButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  authToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  authToggleText: {
    fontSize: 14,
    color: '#64748b',
  },
  authToggleLink: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
  },
  forgotPasswordLink: {
    alignItems: 'center',
    marginTop: 8,
  },
  forgotPasswordText: {
    color: '#2563eb',
    fontSize: 14,
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