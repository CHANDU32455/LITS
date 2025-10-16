// app/(auth)/complete-profile.tsx
import React, { useEffect, useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TextInput, 
    TouchableOpacity, 
    ScrollView, 
    Alert, 
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Dimensions
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { User, Building, Phone, Circle, CircleCheck, RefreshCw, ArrowLeft } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function CompleteProfileScreen() {
    const { session, user, departments, completeEmployeeProfile, loadDepartments } = useAuth();
    const [formData, setFormData] = useState({
        fullName: '',
        department: '',
        phoneNumber: '',
        companyName: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    // Pre-fill form data if user exists (editing mode)
    useEffect(() => {
        if (user) {
            setFormData({
                fullName: user.full_name || '',
                department: user.department_name || '',
                phoneNumber: user.phone_number || '',
                companyName: user.company_name || '',
            });
        }
    }, [user]);

    // Redirect if no session
    useEffect(() => {
        if (!session) {
            router.replace('/(auth)/login');
        }
    }, [session]);

    // Redirect if user already has profile and is not editing
    useEffect(() => {
        if (user && !isLoading) {
            router.replace('/(tabs)/analytics');
        }
    }, [user, isLoading]);

    // Load departments on mount
    useEffect(() => {
        handleLoadDepartments();
    }, []);

    // Retry mechanism for loading departments
    useEffect(() => {
        if (departments.length === 0 && retryCount < 3 && retryCount > 0) {
            const timer = setTimeout(() => {
                console.log(`Retrying departments load... Attempt ${retryCount + 1}`);
                handleLoadDepartments();
            }, 1000 * (retryCount + 1));

            return () => clearTimeout(timer);
        }
    }, [departments.length, retryCount]);

    const handleLoadDepartments = async () => {
        setIsLoadingDepartments(true);
        try {
            if (loadDepartments) {
                await loadDepartments();
            }
        } catch (error) {
            console.error('Failed to load departments:', error);
        } finally {
            setIsLoadingDepartments(false);
            if (departments.length === 0) {
                setRetryCount(prev => prev + 1);
            }
        }
    };

    const generateEmployeeNumber = (): string => {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        const prefix = 'EMP';
        return `${prefix}${timestamp}${random}`;
    };

    const handleDepartmentSelect = (departmentName: string) => {
        setFormData({ ...formData, department: departmentName });
    };

    const handleCompleteProfile = async () => {
        if (!formData.fullName.trim()) {
            Alert.alert('Error', 'Please enter your full name');
            return;
        }

        if (!formData.department) {
            Alert.alert('Error', 'Please select your department');
            return;
        }

        if (!session?.user?.id) {
            Alert.alert('Error', 'No user session found');
            return;
        }

        setIsLoading(true);
        try {
            const employeeNumber = user?.employee_number || generateEmployeeNumber();

            const success = await completeEmployeeProfile(
                session.user.id,
                formData.fullName.trim(),
                employeeNumber,
                formData.department,
                formData.phoneNumber.trim() || undefined,
                formData.companyName.trim() || undefined,
                'Employee', // position
                session.user.email // email
            );

            if (success) {
                Alert.alert(
                    'Success', 
                    user ? 'Profile updated successfully!' : 'Profile completed successfully!',
                    [{ text: 'OK', onPress: () => router.replace('/(tabs)/reportInjury') }]
                );
            } else {
                Alert.alert('Error', 'Failed to save profile. Please try again.');
            }
        } catch (error) {
            console.error('Profile completion error:', error);
            Alert.alert('Error', 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        if (user) {
            router.back();
        } else {
            router.replace('/(auth)/login');
        }
    };

    // Show loading state if departments are not loaded yet
    if (isLoadingDepartments && departments.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                        <ArrowLeft size={24} color="#1e293b" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {user ? 'Edit Profile' : 'Complete Profile'}
                    </Text>
                    <View style={styles.headerPlaceholder} />
                </View>

                <View style={styles.loadingContent}>
                    <ActivityIndicator size="large" color="#2563eb" />
                    <Text style={styles.loadingText}>
                        Loading departments...
                    </Text>
                    {retryCount > 0 && (
                        <Text style={styles.retryText}>
                            Attempt {retryCount} of 3
                        </Text>
                    )}
                </View>
            </View>
        );
    }

    // Show retry screen if departments failed to load
    if (departments.length === 0 && retryCount >= 3) {
        return (
            <View style={styles.loadingContainer}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                        <ArrowLeft size={24} color="#1e293b" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {user ? 'Edit Profile' : 'Complete Profile'}
                    </Text>
                    <View style={styles.headerPlaceholder} />
                </View>

                <View style={styles.errorContent}>
                    <Text style={styles.errorTitle}>Unable to Load Departments</Text>
                    <Text style={styles.errorText}>
                        Please check your internet connection and try again.
                    </Text>
                    <TouchableOpacity 
                        style={styles.retryButton}
                        onPress={() => {
                            setRetryCount(0);
                            handleLoadDepartments();
                        }}
                        disabled={isLoadingDepartments}
                    >
                        <RefreshCw size={20} color="#2563eb" />
                        <Text style={styles.retryButtonText}>
                            {isLoadingDepartments ? 'Loading...' : 'Try Again'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView 
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                    <ArrowLeft size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {user ? 'Edit Profile' : 'Complete Profile'}
                </Text>
                <View style={styles.headerPlaceholder} />
            </View>

            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.content}>
                    <View style={styles.welcomeSection}>
                        <Text style={styles.title}>
                            {user ? 'Update Your Profile' : 'Welcome! 👋'}
                        </Text>
                        <Text style={styles.subtitle}>
                            {user 
                                ? 'Update your employee information below' 
                                : 'Complete your profile to get started with Safety First'
                            }
                        </Text>
                    </View>

                    <View style={styles.form}>
                        {/* Full Name */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Full Name *</Text>
                            <View style={styles.inputContainer}>
                                <User size={20} color="#6b7280" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your full name"
                                    value={formData.fullName}
                                    onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                                    autoCapitalize="words"
                                    autoComplete="name"
                                    returnKeyType="next"
                                />
                            </View>
                        </View>

                        {/* Department Selection */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Department *</Text>
                            <View style={styles.radioContainer}>
                                {departments.map((dept) => (
                                    <TouchableOpacity
                                        key={dept.id}
                                        style={[
                                            styles.radioOption,
                                            formData.department === dept.name && styles.radioOptionSelected
                                        ]}
                                        onPress={() => handleDepartmentSelect(dept.name)}
                                    >
                                        {formData.department === dept.name ? (
                                            <CircleCheck size={20} color="#2563eb" />
                                        ) : (
                                            <Circle size={20} color="#6b7280" />
                                        )}
                                        <Text style={[
                                            styles.radioText,
                                            formData.department === dept.name && styles.radioTextSelected
                                        ]}>
                                            {dept.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Phone Number */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Phone Number</Text>
                            <View style={styles.inputContainer}>
                                <Phone size={20} color="#6b7280" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Your phone number"
                                    value={formData.phoneNumber}
                                    onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
                                    keyboardType="phone-pad"
                                    autoComplete="tel"
                                    returnKeyType="next"
                                />
                            </View>
                        </View>

                        {/* Company Name */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Company Name</Text>
                            <View style={styles.inputContainer}>
                                <Building size={20} color="#6b7280" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Your company name"
                                    value={formData.companyName}
                                    onChangeText={(text) => setFormData({ ...formData, companyName: text })}
                                    autoCapitalize="words"
                                    autoComplete="organization"
                                    returnKeyType="done"
                                />
                            </View>
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                (!formData.fullName || !formData.department || isLoading) && styles.submitButtonDisabled
                            ]}
                            onPress={handleCompleteProfile}
                            disabled={!formData.fullName || !formData.department || isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.submitButtonText}>
                                    {user ? 'Update Profile' : 'Complete Profile'}
                                </Text>
                            )}
                        </TouchableOpacity>

                        {/* Helper Text */}
                        <Text style={styles.helperText}>
                            * Required fields
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
    backButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#f1f5f9',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
        textAlign: 'center',
    },
    headerPlaceholder: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    loadingContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 8,
        textAlign: 'center',
    },
    errorText: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    welcomeSection: {
        alignItems: 'center',
        marginBottom: 32,
        paddingHorizontal: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1e293b',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 22,
    },
    form: {
        gap: 24,
        maxWidth: 400,
        width: '100%',
        alignSelf: 'center',
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        backgroundColor: '#fff',
        minHeight: 56,
        paddingHorizontal: 4,
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
    radioContainer: {
        gap: 12,
    },
    radioOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        backgroundColor: '#fff',
    },
    radioOptionSelected: {
        borderColor: '#2563eb',
        backgroundColor: '#eff6ff',
    },
    radioText: {
        fontSize: 16,
        color: '#374151',
        flex: 1,
    },
    radioTextSelected: {
        color: '#2563eb',
        fontWeight: '600',
    },
    submitButton: {
        backgroundColor: '#2563eb',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 56,
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonDisabled: {
        backgroundColor: '#9ca3af',
        shadowOpacity: 0,
        elevation: 0,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    helperText: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        marginTop: 8,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
    },
    retryText: {
        marginTop: 8,
        fontSize: 14,
        color: '#9ca3af',
        textAlign: 'center',
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#dbeafe',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#bfdbfe',
        minWidth: 160,
        justifyContent: 'center',
    },
    retryButtonText: {
        fontSize: 16,
        color: '#2563eb',
        fontWeight: '600',
        marginLeft: 8,
    },
});