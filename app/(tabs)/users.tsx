import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Users as UsersIcon, Search } from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

interface Employee {
  id: string;
  full_name: string;
  email: string;
  employee_number: string;
  department_name: string | null;
  position: string;
  is_active: boolean;
  phone_number: string | null;
  company_name: string | null;
}

export default function UsersManagementScreen() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isAdmin = user?.position?.toLowerCase() === 'admin';

  useEffect(() => {
    if (user && !isAdmin) {
      console.log('Non-admin user attempted to access users management. Redirecting...');
      router.replace('/(tabs)/analytics');
    }
  }, [user, isAdmin]);

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [searchQuery, employees]);

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name, email, employee_number, department_name, position, is_active, phone_number, company_name, user_id')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // we already have email from the table
      setEmployees(data as Employee[]);
    } catch (error: any) {
      console.error('Error loading employees:', error);
      Alert.alert('Error', 'Failed to load employees');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };


  const filterEmployees = () => {
    if (!searchQuery.trim()) {
      setFilteredEmployees(employees);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = employees.filter(
      (emp) =>
        emp.full_name.toLowerCase().includes(query) ||
        emp.employee_number.toLowerCase().includes(query) ||
        emp.email.toLowerCase().includes(query) ||
        (emp.department_name && emp.department_name.toLowerCase().includes(query)) ||
        emp.position.toLowerCase().includes(query)
    );

    setFilteredEmployees(filtered);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadEmployees();
  };

  const handleToggleActiveStatus = async (employeeId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('employees')
        .update({ is_active: !currentStatus })
        .eq('id', employeeId);

      if (error) throw error;

      Alert.alert(
        'Success',
        `Employee ${!currentStatus ? 'activated' : 'deactivated'} successfully`
      );
      loadEmployees();
    } catch (error: any) {
      console.error('Error toggling employee status:', error);
      Alert.alert('Error', 'Failed to update employee status');
    }
  };

  const handleDeleteEmployee = async (employeeId: string, employeeName: string) => {
    Alert.alert(
      'Delete Employee',
      `Are you sure you want to delete ${employeeName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('employees')
                .delete()
                .eq('id', employeeId);

              if (error) throw error;

              Alert.alert('Success', 'Employee deleted successfully');
              loadEmployees();
            } catch (error: any) {
              console.error('Error deleting employee:', error);
              Alert.alert('Error', 'Failed to delete employee');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading employees...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <UsersIcon size={32} color="#2563eb" />
          <Text style={styles.title}>User Management</Text>
        </View>
        <Text style={styles.subtitle}>
          Place to manage employee accounts and permissions
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color="#6b7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search employees..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9ca3af"
        />
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{employees.length}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {employees.filter((e) => e.is_active).length}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {employees.filter((e) => !e.is_active).length}
          </Text>
          <Text style={styles.statLabel}>Inactive</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#2563eb']}
            tintColor="#2563eb"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredEmployees.length === 0 ? (
          <View style={styles.emptyState}>
            <UsersIcon size={64} color="#cbd5e1" />
            <Text style={styles.emptyStateTitle}>No employees found</Text>
            <Text style={styles.emptyStateText}>
              {searchQuery
                ? 'Try adjusting your search query'
                : 'Start by adding employees to the system'}
            </Text>
          </View>
        ) : (
          filteredEmployees.map((employee) => (
            <View key={employee.id} style={styles.employeeCard}>
              <View style={styles.employeeHeader}>
                <View style={styles.employeeAvatar}>
                  <Text style={styles.employeeAvatarText}>
                    {employee.full_name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()}
                  </Text>
                </View>
                <View style={styles.employeeInfo}>
                  <View style={styles.employeeNameRow}>
                    <Text style={styles.employeeName}>{employee.full_name}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        employee.is_active
                          ? styles.statusBadgeActive
                          : styles.statusBadgeInactive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          employee.is_active
                            ? styles.statusBadgeTextActive
                            : styles.statusBadgeTextInactive,
                        ]}
                      >
                        {employee.is_active ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.employeeDetail}>{employee.email}</Text>
                  <Text style={styles.employeeDetail}>
                    ID: {employee.employee_number}
                  </Text>
                  <Text style={styles.employeeDetail}>
                    {employee.position} • {employee.department_name || 'No Department'}
                  </Text>
                </View>
              </View>
              {/**
               * <View style={styles.employeeActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() =>
                    handleToggleActiveStatus(employee.id, employee.is_active)
                  }
                >
                  {employee.is_active ? (
                    <EyeOff size={18} color="#f59e0b" />
                  ) : (
                    <Eye size={18} color="#22c55e" />
                  )}
                  <Text style={styles.actionButtonText}>
                    {employee.is_active ? 'Deactivate' : 'Activate'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() =>
                    handleDeleteEmployee(employee.id, employee.full_name)
                  }
                >
                  <Trash2 size={18} color="#ef4444" />
                  <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
               */}
            </View>
          ))
        )}
      </ScrollView>
    </View>
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
  header: {
    backgroundColor: '#fff',
    padding: 10,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1e293b',
    marginLeft: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 6,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2563eb',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  employeeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  employeeHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  employeeAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  employeeAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  employeeInfo: {
    flex: 1,
  },
  employeeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusBadgeActive: {
    backgroundColor: '#dcfce7',
  },
  statusBadgeInactive: {
    backgroundColor: '#fee2e2',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusBadgeTextActive: {
    color: '#166534',
  },
  statusBadgeTextInactive: {
    color: '#991b1b',
  },
  employeeDetail: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  employeeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 6,
  },
  deleteButtonText: {
    color: '#dc2626',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
