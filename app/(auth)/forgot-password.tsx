import React, { useState } from 'react';
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
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const handleResetPassword = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        } else {
            console.log(email);
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }

        setIsLoading(true);

        try {
            // In forgot-password.tsx - Update the redirect URL
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `http://localhost:8081/reset-password`,
            });

            if (error) {
                // Don't reveal if email exists or not for security
                console.error('Password reset error:', error);
            }

            // Always show success message for security (don't reveal if email exists)
            setEmailSent(true);

        } catch (error) {
            console.error('Password reset failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackToLogin = () => {
        router.replace('/(auth)/login');
    };

    if (emailSent) {
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
                        <Text style={styles.title}>Check Your Email</Text>
                    </View>

                    {/* Success Card */}
                    <View style={styles.card}>
                        <View style={styles.successIcon}>
                            <CheckCircle size={64} color="#22c55e" />
                        </View>

                        <Text style={styles.successTitle}>Reset Link Sent</Text>
                        <Text style={styles.successMessage}>
                            If an account exists with {email}, you will receive a password reset link shortly.
                        </Text>
                        <Text style={styles.instructions}>
                            Please check your inbox and follow the instructions to reset your password.
                        </Text>

                        <TouchableOpacity
                            style={styles.resendButton}
                            onPress={handleResetPassword}
                            disabled={isLoading}
                        >
                            <Text style={styles.resendButtonText}>
                                {isLoading ? 'Sending...' : 'Resend Link'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.backToLoginButton}
                            onPress={handleBackToLogin}
                        >
                            <Text style={styles.backToLoginText}>Back to Login</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            Didn't receive the email? Check your spam folder.
                        </Text>
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
                    <Text style={styles.title}>Reset Password</Text>
                </View>

                {/* Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Forgot Password?</Text>
                    <Text style={styles.cardSubtitle}>
                        Enter your email address and we'll send you a link to reset your password.
                    </Text>

                    {/* Form */}
                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email Address *</Text>
                            <View style={styles.inputContainer}>
                                <Mail size={20} color="#6b7280" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your email"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoComplete="email"
                                    editable={!isLoading}
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                (!email || isLoading) && styles.submitButtonDisabled
                            ]}
                            onPress={handleResetPassword}
                            disabled={!email || isLoading}
                        >
                            <Text style={styles.submitButtonText}>
                                {isLoading ? 'Sending...' : 'Send Reset Link'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.backButtonSecondary}
                            onPress={handleBackToLogin}
                        >
                            <Text style={styles.backButtonText}>Back to Login</Text>
                        </TouchableOpacity>
                    </View>
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
    inputIcon: {
        marginLeft: 12,
    },
    input: {
        flex: 1,
        padding: 12,
        fontSize: 16,
        color: '#1e293b',
    },
    submitButton: {
        backgroundColor: '#2563eb',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 16,
    },
    submitButtonDisabled: {
        backgroundColor: '#9ca3af',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    backButtonSecondary: {
        padding: 16,
        alignItems: 'center',
    },
    backButtonText: {
        color: '#2563eb',
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
    resendButton: {
        backgroundColor: '#f1f5f9',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    resendButtonText: {
        color: '#374151',
        fontSize: 14,
        fontWeight: '600',
    },
    backToLoginButton: {
        padding: 12,
        alignItems: 'center',
    },
    backToLoginText: {
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