// components/EditProfileModal.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Modal,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { X, User, Mail, Phone, Save } from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

interface EditProfileModalProps {
    visible: boolean;
    onClose: () => void;
    onProfileUpdated: () => void;
}

export default function EditProfileModal({ visible, onClose, onProfileUpdated }: EditProfileModalProps) {
    const { user, session } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
    });
    const [errors, setErrors] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
    });

    // Initialize form data when modal opens or user changes
    useEffect(() => {
        if (visible && user) {
            setFormData({
                fullName: user.full_name || '',
                email: user.email || session?.user?.email || '',
                phoneNumber: user.phone_number || '',
            });
            // Clear errors when opening
            setErrors({ fullName: '', email: '', phoneNumber: '' });
        }
    }, [visible, user, session]);

    const validateForm = (): boolean => {
        const newErrors = {
            fullName: '',
            email: '',
            phoneNumber: '',
        };

        // Full Name validation
        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Full name is required';
        } else if (formData.fullName.trim().length < 2) {
            newErrors.fullName = 'Full name must be at least 2 characters';
        }

        // Email validation
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }

        // Phone number validation (optional)
        if (formData.phoneNumber && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
            newErrors.phoneNumber = 'Phone number is invalid';
        }

        setErrors(newErrors);
        return !Object.values(newErrors).some(error => error !== '');
    };

    const handleSave = async () => {
        if (!validateForm()) {
            Alert.alert('Validation Error', 'Please fix the errors before saving.');
            return;
        }

        if (!user?.id) {
            Alert.alert('Error', 'No user profile found.');
            return;
        }

        setIsLoading(true);
        try {
            // Update profile in the database
            const { error } = await supabase
                .from('employees')
                .update({
                    full_name: formData.fullName.trim(),
                    phone_number: formData.phoneNumber.trim() || null,
                    email: formData.email.trim(), // Update email directly without verification
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id);

            if (error) {
                console.error('Update error:', error);
                throw error;
            }

            Alert.alert('Success', 'Profile updated successfully!');
            onProfileUpdated();
            onClose();
        } catch (error: any) {
            console.error('Profile update failed:', error);
            Alert.alert('Update Failed', error.message || 'Failed to update profile. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        if (isLoading) return;
        
        if (hasChanges()) {
            Alert.alert(
                'Unsaved Changes',
                'You have unsaved changes. Are you sure you want to close?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Discard', style: 'destructive', onPress: onClose }
                ]
            );
        } else {
            onClose();
        }
    };

    const hasChanges = () => {
        if (!user) return false;
        return (
            formData.fullName !== user.full_name ||
            formData.email !== (user.email || session?.user?.email) ||
            formData.phoneNumber !== (user.phone_number || '')
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity 
                        style={styles.closeButton}
                        onPress={handleClose}
                        disabled={isLoading}
                    >
                        <X size={24} color="#374151" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Edit Profile</Text>
                    <TouchableOpacity 
                        style={[
                            styles.saveButton,
                            (!hasChanges() || isLoading) && styles.saveButtonDisabled
                        ]}
                        onPress={handleSave}
                        disabled={!hasChanges() || isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Save size={20} color="#fff" />
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView 
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.form}>
                        {/* Full Name */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Full Name *</Text>
                            <View style={[
                                styles.inputContainer,
                                errors.fullName && styles.inputError
                            ]}>
                                <User size={20} color="#6b7280" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your full name"
                                    value={formData.fullName}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, fullName: text }))}
                                    autoCapitalize="words"
                                    autoComplete="name"
                                    editable={!isLoading}
                                />
                            </View>
                            {errors.fullName ? (
                                <Text style={styles.errorText}>{errors.fullName}</Text>
                            ) : (
                                <Text style={styles.helperText}>Your full name as it should appear</Text>
                            )}
                        </View>

                        {/* Email */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email Address *</Text>
                            <View style={[
                                styles.inputContainer,
                                errors.email && styles.inputError
                            ]}>
                                <Mail size={20} color="#6b7280" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your email"
                                    value={formData.email}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoComplete="email"
                                    editable={!isLoading}
                                />
                            </View>
                            {errors.email ? (
                                <Text style={styles.errorText}>{errors.email}</Text>
                            ) : (
                                <Text style={styles.helperText}>Your primary email address</Text>
                            )}
                        </View>

                        {/* Phone Number */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Phone Number</Text>
                            <View style={[
                                styles.inputContainer,
                                errors.phoneNumber && styles.inputError
                            ]}>
                                <Phone size={20} color="#6b7280" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Your phone number"
                                    value={formData.phoneNumber}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, phoneNumber: text }))}
                                    keyboardType="phone-pad"
                                    autoComplete="tel"
                                    editable={!isLoading}
                                />
                            </View>
                            {errors.phoneNumber ? (
                                <Text style={styles.errorText}>{errors.phoneNumber}</Text>
                            ) : (
                                <Text style={styles.helperText}>Optional - for emergency contacts</Text>
                            )}
                        </View>

                        {/* Info Section */}
                        <View style={styles.infoCard}>
                            <Text style={styles.infoTitle}>Note</Text>
                            <Text style={styles.infoText}>
                                • Employee ID and department cannot be changed here{'\n'}
                                • Contact admin for other profile changes
                            </Text>
                        </View>
                    </View>
                </ScrollView>

                {/* Bottom Action Button */}
                <View style={styles.bottomAction}>
                    <TouchableOpacity
                        style={[
                            styles.fullSaveButton,
                            (!hasChanges() || isLoading) && styles.fullSaveButtonDisabled
                        ]}
                        onPress={handleSave}
                        disabled={!hasChanges() || isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <>
                                <Save size={20} color="#fff" />
                                <Text style={styles.fullSaveButtonText}>Save Changes</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    closeButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#f1f5f9',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
    },
    saveButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#2563eb',
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButtonDisabled: {
        backgroundColor: '#9ca3af',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 100,
    },
    form: {
        padding: 20,
        gap: 24,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        backgroundColor: '#fff',
        minHeight: 56,
    },
    input: {
        flex: 1,
        padding: 16,
        paddingLeft: 44,
        fontSize: 16,
        color: '#1e293b',
    },
    inputIcon: {
        position: 'absolute',
        left: 16,
        zIndex: 1,
    },
    inputError: {
        borderColor: '#ef4444',
    },
    errorText: {
        fontSize: 14,
        color: '#ef4444',
        marginTop: 4,
    },
    helperText: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 4,
    },
    infoCard: {
        backgroundColor: '#eff6ff',
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#2563eb',
        marginTop: 8,
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#2563eb',
        marginBottom: 8,
    },
    infoText: {
        fontSize: 14,
        color: '#374151',
        lineHeight: 20,
    },
    bottomAction: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        padding: 20,
        paddingBottom: 34,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
    },
    fullSaveButton: {
        backgroundColor: '#2563eb',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        borderRadius: 12,
        gap: 8,
    },
    fullSaveButtonDisabled: {
        backgroundColor: '#9ca3af',
    },
    fullSaveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});