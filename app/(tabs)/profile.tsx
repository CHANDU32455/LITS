import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Dimensions,
    Animated,
    RefreshControl
} from 'react-native';
import {
    User, Building, IdCard, LogOut, Shield, Mail, Phone,
    Briefcase, Edit3, Settings, Bell, HelpCircle, ChevronRight,
    Menu, X
} from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import EditProfileModal from '@/components/EditProfileModal';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
    const router = useRouter();
    const { user, session, logout, refreshUser } = useAuth();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const menuAnimation = useState(new Animated.Value(-width))[0];
    const scrollY = useRef(new Animated.Value(0)).current;

    const userEmail = session?.user?.email || '';

    // Header animation values
    const headerHeight = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [280, 120],
        extrapolate: 'clamp',
    });

    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 80, 100],
        outputRange: [1, 0.5, 0],
        extrapolate: 'clamp',
    });

    const avatarScale = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [1, 0.6],
        extrapolate: 'clamp',
    });

    const avatarTranslateY = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [0, -20],
        extrapolate: 'clamp',
    });

    const toggleMenu = () => {
        if (showMenu) {
            Animated.timing(menuAnimation, {
                toValue: -width,
                duration: 300,
                useNativeDriver: true,
            }).start(() => setShowMenu(false));
        } else {
            setShowMenu(true);
            Animated.timing(menuAnimation, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    };

    const handleEditProfile = () => {
        setShowMenu(false);
        setTimeout(() => setShowEditModal(true), 350);
    };

    const handleProfileUpdated = () => {
        console.log('Profile updated successfully');
        // Refresh user data after profile update
        refreshUserData();
    };

    // Pull-to-refresh function
    const onRefresh = async () => {
        setRefreshing(true);
        console.log('Pull-to-refresh triggered');

        try {
            await refreshUserData();
        } catch (error) {
            console.error('Refresh failed:', error);
        } finally {
            // Add a small delay to show the refresh indicator
            setTimeout(() => {
                setRefreshing(false);
                console.log('Pull-to-refresh completed');
            }, 1000);
        }
    };

    // Function to refresh user data
    const refreshUserData = async () => {
        try {
            if (refreshUser) {
                await refreshUser();
                console.log('Profile data refreshed successfully');
            }
        } catch (error) {
            console.error('Error refreshing profile data:', error);
            throw error;
        }
    };

    const handleLogout = async () => {
        // Show confirmation dialog first
        Alert.alert(
            'Confirm Logout',
            'Are you sure you want to logout from your account?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                    onPress: () => {
                        console.log('Logout cancelled by user');
                    }
                },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        setIsLoggingOut(true);
                        console.log('Logout initiated...');

                        try {
                            await logout();
                            console.log('Logout successful, redirecting to login...');

                            // Use replace to prevent going back to profile
                            router.replace('/(auth)/login');

                        } catch (error: any) {
                            console.error('Logout error in component:', error);

                            // Show error alert to user
                            Alert.alert(
                                'Logout Failed',
                                error.message || 'Unable to logout. Please try again.',
                                [
                                    {
                                        text: 'OK',
                                        onPress: () => {
                                            setIsLoggingOut(false);
                                            setShowMenu(false);
                                        }
                                    }
                                ]
                            );
                        }
                    },
                },
            ],
            {
                cancelable: true,
                onDismiss: () => {
                    console.log('Logout dialog dismissed');
                }
            }
        );
    };

    const getInitials = (name: string) => {
        if (!name) return '??';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const getRoleColor = (position: string) => {
        const colors = {
            'Admin': '#DC2626',
            'Supervisor': '#2563EB',
            'Manager': '#059669',
            'Employee': '#7C3AED'
        };
        return colors[position as keyof typeof colors] || '#6B7280';
    };

    const formatEmployeeId = (id: string) => {
        if (!id) return 'N/A';
        return id; // Return the full ID without truncation
    };

    if (!user) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366F1" />
                <Text style={styles.loadingText}>Loading your profile...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Animated Header */}
            <Animated.View
                style={[
                    styles.header,
                    {
                        height: headerHeight,
                        opacity: headerOpacity
                    }
                ]}
            >
                <LinearGradient
                    colors={['#6366F1', '#8B5CF6']}
                    style={styles.headerGradient}
                >
                    <View style={styles.headerTop}>
                        <TouchableOpacity
                            style={styles.menuButton}
                            onPress={toggleMenu}
                        >
                            <Menu size={24} color="#FFF" />
                        </TouchableOpacity>

                        <Text style={styles.headerTitle}>Profile</Text>

                        <View style={styles.headerPlaceholder} />
                    </View>

                    <Animated.View
                        style={[
                            styles.profileOverview,
                            {
                                transform: [
                                    { scale: avatarScale },
                                    { translateY: avatarTranslateY }
                                ]
                            }
                        ]}
                    >
                        <View style={[styles.avatar, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                            <Text style={styles.avatarText}>{getInitials(user.full_name)}</Text>
                        </View>
                        <View style={styles.profileText}>
                            <Text style={styles.userName} numberOfLines={1}>
                                {user.full_name || 'Unknown User'}
                            </Text>
                            <Text style={styles.userEmail} numberOfLines={1}>
                                {userEmail}
                            </Text>
                            <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.position) }]}>
                                <Shield size={12} color="#FFF" />
                                <Text style={styles.roleText}>
                                    {user.position || 'Employee'}
                                </Text>
                            </View>
                        </View>
                    </Animated.View>
                </LinearGradient>
            </Animated.View>

            {/* Main Content with Pull-to-Refresh */}
            <Animated.ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#6366F1']}
                        tintColor="#6366F1"
                        title="Refreshing profile..."
                        titleColor="#64748b"
                        progressBackgroundColor="#ffffff"
                    />
                }
            >
                {/* Spacer for header content */}
                <View style={styles.headerSpacer} />

                {/* Quick Stats */}
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: '#EEF2FF' }]}>
                            <IdCard size={20} color="#6366F1" />
                        </View>
                        <Text
                            style={styles.statNumber}
                            numberOfLines={2}
                            ellipsizeMode="tail"
                        >
                            {formatEmployeeId(user.employee_number)}
                        </Text>
                        <Text style={styles.statLabel}>Employee ID</Text>
                    </View>

                    <View style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: '#F0FDF4' }]}>
                            <Building size={20} color="#10B981" />
                        </View>
                        <Text
                            style={styles.statNumber}
                            numberOfLines={2}
                            ellipsizeMode="tail"
                        >
                            {user.department_name ?
                                user.department_name.split(' ')[0] : 'N/A'
                            }
                        </Text>
                        <Text style={styles.statLabel}>Department</Text>
                    </View>
                </View>

                {/* Profile Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Personal Information</Text>
                    <View style={styles.detailsCard}>
                        <View style={styles.detailItem}>
                            <View style={styles.detailIcon}>
                                <User size={18} color="#6366F1" />
                            </View>
                            <View style={styles.detailContent}>
                                <Text style={styles.detailLabel}>Full Name</Text>
                                <Text style={styles.detailValue} numberOfLines={1}>
                                    {user.full_name || 'Not provided'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.detailItem}>
                            <View style={styles.detailIcon}>
                                <Mail size={18} color="#6366F1" />
                            </View>
                            <View style={styles.detailContent}>
                                <Text style={styles.detailLabel}>Email Address</Text>
                                <Text style={styles.detailValue} numberOfLines={1}>
                                    {user.email}
                                </Text>
                            </View>
                        </View>

                        {user.phone_number && (
                            <View style={styles.detailItem}>
                                <View style={styles.detailIcon}>
                                    <Phone size={18} color="#6366F1" />
                                </View>
                                <View style={styles.detailContent}>
                                    <Text style={styles.detailLabel}>Phone Number</Text>
                                    <Text style={styles.detailValue} numberOfLines={1}>
                                        {user.phone_number}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Work Information</Text>
                    <View style={styles.detailsCard}>
                        <View style={styles.detailItem}>
                            <View style={styles.detailIcon}>
                                <Building size={18} color="#10B981" />
                            </View>
                            <View style={styles.detailContent}>
                                <Text style={styles.detailLabel}>Department</Text>
                                <Text style={styles.detailValue} numberOfLines={1}>
                                    {user.department_name || 'Not assigned'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.detailItem}>
                            <View style={styles.detailIcon}>
                                <Briefcase size={18} color="#F59E0B" />
                            </View>
                            <View style={styles.detailContent}>
                                <Text style={styles.detailLabel}>Position</Text>
                                <Text style={styles.detailValue} numberOfLines={1}>
                                    {user.position || 'Employee'}
                                </Text>
                            </View>
                        </View>

                        {user.company_name && (
                            <View style={styles.detailItem}>
                                <View style={styles.detailIcon}>
                                    <Building size={18} color="#8B5CF6" />
                                </View>
                                <View style={styles.detailContent}>
                                    <Text style={styles.detailLabel}>Company</Text>
                                    <Text style={styles.detailValue} numberOfLines={1}>
                                        {user.company_name}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                </View>

                {/* Refresh indicator - Always show when refreshing */}
                {refreshing && (
                    <View style={styles.refreshIndicator}>
                        <ActivityIndicator size="small" color="#6366F1" />
                        <Text style={styles.refreshText}>Updating profile data...</Text>
                    </View>
                )}

                {/* Bottom spacer */}
                <View style={styles.bottomSpacer} />
            </Animated.ScrollView>

            {/* Side Menu */}
            {showMenu && (
                <TouchableOpacity
                    style={styles.menuOverlay}
                    onPress={toggleMenu}
                    activeOpacity={1}
                />
            )}

            <Animated.View
                style={[
                    styles.menuPanel,
                    { transform: [{ translateX: menuAnimation }] }
                ]}
            >
                <LinearGradient
                    colors={['#1F2937', '#374151']}
                    style={styles.menuGradient}
                >
                    {/* Scrollable Menu Content */}
                    <ScrollView
                        style={styles.menuScrollView}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Menu Header */}
                        <View style={styles.menuHeader}>
                            <View style={styles.menuAvatar}>
                                <Text style={styles.menuAvatarText}>
                                    {getInitials(user.full_name)}
                                </Text>
                            </View>
                            <View style={styles.menuUserInfo}>
                                <Text style={styles.menuUserName} numberOfLines={1}>
                                    {user.full_name}
                                </Text>
                                <Text style={styles.menuUserEmail} numberOfLines={1}>
                                    {"RegMail :"} {userEmail}
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={styles.menuCloseButton}
                                onPress={toggleMenu}
                            >
                                <X size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        {/* Menu Items */}
                        <View style={styles.menuItems}>
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={handleEditProfile}
                            >
                                <View style={[styles.menuItemIcon, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                                    <Edit3 size={20} color="#6366F1" />
                                </View>
                                <Text style={styles.menuItemText}>Edit Profile</Text>
                                <ChevronRight size={18} color="#9CA3AF" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={onRefresh}
                            >
                                <View style={[styles.menuItemIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                                    <Settings size={20} color="#10B981" />
                                </View>
                                <Text style={styles.menuItemText}>Refresh Data</Text>
                                <ChevronRight size={18} color="#9CA3AF" />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.menuItem}>
                                <View style={[styles.menuItemIcon, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                                    <Bell size={20} color="#F59E0B" />
                                </View>
                                <Text style={styles.menuItemText}>Notifications</Text>
                                <ChevronRight size={18} color="#9CA3AF" />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.menuItem}>
                                <View style={[styles.menuItemIcon, { backgroundColor: 'rgba(236, 72, 153, 0.1)' }]}>
                                    <HelpCircle size={20} color="#EC4899" />
                                </View>
                                <Text style={styles.menuItemText}>Help & Support</Text>
                                <ChevronRight size={18} color="#9CA3AF" />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.menuItem}>
                                <View style={[styles.menuItemIcon, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                                    <Shield size={20} color="#8B5CF6" />
                                </View>
                                <Text style={styles.menuItemText}>Privacy & Security</Text>
                                <ChevronRight size={18} color="#9CA3AF" />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.menuItem}>
                                <View style={[styles.menuItemIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                                    <Building size={20} color="#3B82F6" />
                                </View>
                                <Text style={styles.menuItemText}>About Company</Text>
                                <ChevronRight size={18} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>
                    </ScrollView>

                    {/* Fixed Logout Button at Bottom */}
                    <View style={styles.menuFooter}>
                        <TouchableOpacity
                            style={[styles.logoutButton, isLoggingOut && styles.logoutButtonDisabled]}
                            onPress={handleLogout}
                            disabled={isLoggingOut}
                        >
                            <View style={styles.logoutButtonIcon}>
                                {isLoggingOut ? (
                                    <ActivityIndicator size="small" color="#EF4444" />
                                ) : (
                                    <LogOut size={20} color="#EF4444" />
                                )}
                            </View>
                            <Text style={styles.logoutButtonText}>
                                {isLoggingOut ? 'Logging out...' : 'Logout'}
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.menuFooterText}>
                            <Text style={styles.footerText}>Safety First • v1.0.0</Text>
                        </View>
                    </View>
                </LinearGradient>
            </Animated.View>

            {/* Edit Profile Modal */}
            <EditProfileModal
                visible={showEditModal}
                onClose={() => setShowEditModal(false)}
                onProfileUpdated={handleProfileUpdated}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '500',
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        maxHeight: 170,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        overflow: 'hidden',
    },
    headerGradient: {
        flex: 1,
        paddingTop: 10,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    menuButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 10,
    },
    headerPlaceholder: {
        width: 40,
        height: 40,
    },
    profileOverview: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.3)',
        marginRight: 16,
    },
    avatarText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    profileText: {
        flex: 1,
    },
    userName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 8,
    },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    roleText: {
        fontSize: 12,
        color: '#FFFFFF',
        fontWeight: '600',
        marginLeft: 4,
    },
    content: {
        flex: 1,
    },
    headerSpacer: {
        height: 280, // Same as initial header height
    },
    statsGrid: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginTop: -80, // Overlap with header
        marginBottom: 24,
        gap: 12,
        alignItems: 'flex-start', // Align items at the top
    },
    statCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: 16, // Reduced padding for better space management
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        minHeight: 120,
        justifyContent: 'flex-start', // Start from top
        alignSelf: 'flex-start', // Align self to top
    },
    statIcon: {
        width: 40, // Slightly smaller
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8, // Reduced margin
    },
    statNumber: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
        textAlign: 'center',
        width: '100%',
        flexWrap: 'wrap',
        flexShrink: 1,
        minHeight: 18,
        lineHeight: 18,
    },
    statLabel: {
        fontSize: 11, // Slightly smaller font
        color: '#6B7280',
        fontWeight: '500',
        textAlign: 'center',
        width: '100%',
        flexWrap: 'wrap',
        flexShrink: 1,
        minHeight: 14,
        lineHeight: 14, // Add line height
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    detailsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    detailIcon: {
        width: 36,
        alignItems: 'center',
    },
    detailContent: {
        flex: 1,
        marginLeft: 8,
    },
    detailLabel: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
        marginBottom: 2,
        letterSpacing: -0.2,
    },
    detailValue: {
        fontSize: 16,
        color: '#1F2937',
        fontWeight: '600',
        letterSpacing: -0.3,
    },
    bottomSpacer: {
        height: 40,
    },
    // Menu Styles
    menuOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 998,
    },
    menuPanel: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: width * 0.85,
        maxWidth: 320,
        zIndex: 999,
    },
    menuGradient: {
        flex: 1,
    },
    menuScrollView: {
        flex: 1,
    },
    menuHeader: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#4B5563',
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuAvatar: {
        width: 50,
        height: 50,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    menuAvatarText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    menuUserInfo: {
        flex: 1,
    },
    menuUserName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    menuUserEmail: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    menuCloseButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 12,
    },
    menuItems: {
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 20,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderRadius: 12,
        marginBottom: 4,
    },
    menuItemIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    menuItemText: {
        flex: 1,
        fontSize: 16,
        color: '#F3F4F6',
        fontWeight: '500',
    },
    menuFooter: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#4B5563',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginBottom: 16,
    },
    logoutButtonDisabled: {
        opacity: 0.6,
    },
    logoutButtonIcon: {
        marginRight: 12,
    },
    logoutButtonText: {
        fontSize: 16,
        color: '#EF4444',
        fontWeight: '600',
        flex: 1,
    },
    menuFooterText: {
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'center',
    },
    refreshIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        marginTop: 8,
        zIndex: 998,
    },
    refreshText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#6366F1',
        fontWeight: '500',
    },
});