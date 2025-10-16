import { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Platform,
    Modal,
    FlatList,
    ActivityIndicator,
    Alert,
    RefreshControl
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { ChevronDown, Search, Calendar, Clock } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

type Department = {
    id: string;
    name: string;
};

type Employee = {
  id: string;
  full_name: string;
  employee_number: string;
  department_id: string;
  departments: Department[];
};

export default function ReportInjury() {
    const { user, session } = useAuth();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Modal states
    const [showEmployeeModal, setShowEmployeeModal] = useState(false);
    const [employeeSearch, setEmployeeSearch] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [incidentDate, setIncidentDate] = useState(new Date());
    const [incidentTime, setIncidentTime] = useState(new Date());

    const [formData, setFormData] = useState({
        location: '',
        description: '',
        severity: 'minor' as 'minor' | 'major' | 'fatal',
        injuryType: 'other' as 'slip' | 'fall' | 'equipment' | 'chemical' | 'cut' | 'burn' | 'strain' | 'other',
        bodyPartAffected: '',
        witnesses: '',
        immediateAction: '',
        medicalTreatment: false,
        workDaysLost: '0',
    });

    const fetchInitialData = async () => {
        try {
            setInitialLoading(true);
            await Promise.all([fetchDepartments(), fetchEmployees()]);
        } catch (error) {
            setError('Failed to load initial data');
        } finally {
            setInitialLoading(false);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (employeeSearch) {
            const filtered = employees.filter(emp =>
                emp.full_name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
                emp.employee_number.toLowerCase().includes(employeeSearch.toLowerCase())
            );
            setFilteredEmployees(filtered);
        } else {
            setFilteredEmployees(employees);
        }
    }, [employeeSearch, employees]);

    const fetchDepartments = async () => {
        const { data, error } = await supabase
            .from('departments')
            .select('*')
            .order('name');

        if (error) {
            console.error('Error fetching departments:', error);
            throw error;
        }
        
        if (data) setDepartments(data);
    };

    const fetchEmployees = async () => {
        const { data, error } = await supabase
            .from('employees')
            .select(`
                id, 
                full_name, 
                employee_number,
                department_id,
                departments!employees_department_id_fkey (
                    id,
                    name
                )
            `)
            .order('full_name');

        if (error) {
            console.error('Error fetching employees:', error);
            throw error;
        }

        if (data) {
            const employeesData = data as unknown as Employee[];
            setEmployees(employeesData);
            setFilteredEmployees(employeesData);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchInitialData();
        setRefreshing(false);
    }, []);

    const validateForm = (): string | null => {
        if (!selectedEmployee) return 'Please select an employee';
        if (!formData.location.trim()) return 'Location is required';
        if (!formData.description.trim()) return 'Description is required';
        
        const workDaysLost = parseInt(formData.workDaysLost);
        if (isNaN(workDaysLost) || workDaysLost < 0) {
            return 'Work days lost must be a valid number';
        }
        
        return null;
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
        if (selectedDate) {
            setIncidentDate(selectedDate);
        }
    };

    const handleTimeChange = (event: any, selectedTime?: Date) => {
        if (Platform.OS === 'android') {
            setShowTimePicker(false);
        }
        if (selectedTime) {
            setIncidentTime(selectedTime);
        }
    };

    const formatDate = (date: Date) => {
        return date.toISOString().split('T')[0];
    };

    const formatTime = (date: Date) => {
        return date.toTimeString().split(' ')[0].substring(0, 5);
    };

    const getDepartmentName = (employee: Employee | null) => {
        if (!employee || !employee.departments || employee.departments.length === 0) {
            return 'No Department';
        }
        
        // Handle both array and object formats
        const department = Array.isArray(employee.departments) 
            ? employee.departments[0]
            : employee.departments;
            
        return department?.name || 'No Department';
    };

    const resetForm = () => {
        setSelectedEmployee(null);
        setIncidentDate(new Date());
        setIncidentTime(new Date());
        setFormData({
            location: '',
            description: '',
            severity: 'minor',
            injuryType: 'other',
            bodyPartAffected: '',
            witnesses: '',
            immediateAction: '',
            medicalTreatment: false,
            workDaysLost: '0',
        });
    };

    const handleSubmit = async () => {
        setError(null);
        setSuccess(false);

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        if (!session?.user) {
            setError('You must be logged in to submit a report');
            return;
        }

        setLoading(true);

        try {
            const workDaysLost = parseInt(formData.workDaysLost);

            const { error: insertError } = await supabase
                .from('injury_reports')
                .insert({
                    employee_id: selectedEmployee!.id,
                    reported_by: session.user.id,
                    incident_date: formatDate(incidentDate),
                    incident_time: formatTime(incidentTime),
                    location: formData.location.trim(),
                    description: formData.description.trim(),
                    severity: formData.severity,
                    injury_type: formData.injuryType,
                    body_part_affected: formData.bodyPartAffected.trim() || null,
                    witnesses: formData.witnesses.trim() || null,
                    immediate_action_taken: formData.immediateAction.trim() || null,
                    medical_treatment_required: formData.medicalTreatment,
                    work_days_lost: workDaysLost,
                });

            if (insertError) {
                throw insertError;
            }

            setSuccess(true);
            resetForm();
            
            Alert.alert('Success', 'Injury report submitted successfully!');
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            console.error('Submission error:', err);
            const errorMessage = err.message || 'Failed to submit report. Please try again.';
            setError(errorMessage);
            Alert.alert('Error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const selectEmployee = (employee: Employee) => {
        setSelectedEmployee(employee);
        setShowEmployeeModal(false);
        setEmployeeSearch('');
    };

    if (initialLoading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.loadingText}>Loading form...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollContent}
                contentContainerStyle={styles.contentContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#2563eb']}
                        tintColor="#2563eb"
                    />
                }
                showsVerticalScrollIndicator={false}
            >

                {user && (
                    <Text style={styles.userInfo}>
                        Reporting as: {user.full_name} ({user.employee_number})
                    </Text>
                )}

                {error && (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                {success && (
                    <View style={styles.successBox}>
                        <Text style={styles.successText}>Injury report submitted successfully!</Text>
                    </View>
                )}

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Employee *</Text>
                    <TouchableOpacity
                        style={styles.dropdownTrigger}
                        onPress={() => setShowEmployeeModal(true)}
                        accessibilityLabel="Select employee"
                        accessibilityRole="button"
                    >
                        <Text style={selectedEmployee ? styles.dropdownText : styles.dropdownPlaceholder}>
                            {selectedEmployee
                                ? `${selectedEmployee.full_name} (${selectedEmployee.employee_number}) - ${getDepartmentName(selectedEmployee)}`
                                : 'Select an employee'
                            }
                        </Text>
                        <ChevronDown size={20} color="#6b7280" />
                    </TouchableOpacity>
                </View>

                <View style={styles.row}>
                    <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                        <Text style={styles.label}>Incident Date *</Text>
                        <TouchableOpacity
                            style={styles.dateTimeTrigger}
                            onPress={() => setShowDatePicker(true)}
                            accessibilityLabel="Select incident date"
                            accessibilityRole="button"
                        >
                            <Calendar size={16} color="#6b7280" />
                            <Text style={styles.dateTimeText}>
                                {formatDate(incidentDate)}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                        <Text style={styles.label}>Incident Time *</Text>
                        <TouchableOpacity
                            style={styles.dateTimeTrigger}
                            onPress={() => setShowTimePicker(true)}
                            accessibilityLabel="Select incident time"
                            accessibilityRole="button"
                        >
                            <Clock size={16} color="#6b7280" />
                            <Text style={styles.dateTimeText}>
                                {formatTime(incidentTime)}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {showDatePicker && (
                    <DateTimePicker
                        value={incidentDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={handleDateChange}
                        maximumDate={new Date()}
                    />
                )}

                {showTimePicker && (
                    <DateTimePicker
                        value={incidentTime}
                        mode="time"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={handleTimeChange}
                    />
                )}

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Location *</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.location}
                        onChangeText={(text) => setFormData({ ...formData, location: text })}
                        placeholder="e.g., Warehouse Floor 2, Section B"
                        accessibilityLabel="Location input"
                        accessibilityHint="Enter the location where the incident occurred"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Severity *</Text>
                    <View style={styles.segmentedControl}>
                        {(['minor', 'major', 'fatal'] as const).map((severity) => (
                            <TouchableOpacity
                                key={severity}
                                style={[
                                    styles.segmentButton,
                                    formData.severity === severity && styles.segmentButtonActive,
                                ]}
                                onPress={() => setFormData({ ...formData, severity })}
                                accessibilityLabel={`Select ${severity} severity`}
                                accessibilityRole="button"
                            >
                                <Text
                                    style={[
                                        styles.segmentText,
                                        formData.severity === severity && styles.segmentTextActive,
                                    ]}>
                                    {severity.charAt(0).toUpperCase() + severity.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Injury Type *</Text>
                    <View style={styles.chipContainer}>
                        {(['slip', 'fall', 'equipment', 'chemical', 'cut', 'burn', 'strain', 'other'] as const).map((type) => (
                            <TouchableOpacity
                                key={type}
                                style={[
                                    styles.chip,
                                    formData.injuryType === type && styles.chipActive,
                                ]}
                                onPress={() => setFormData({ ...formData, injuryType: type })}
                                accessibilityLabel={`Select ${type} injury type`}
                                accessibilityRole="button"
                            >
                                <Text
                                    style={[
                                        styles.chipText,
                                        formData.injuryType === type && styles.chipTextActive,
                                    ]}>
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Description *</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={formData.description}
                        onChangeText={(text) => setFormData({ ...formData, description: text })}
                        placeholder="Describe what happened..."
                        multiline
                        numberOfLines={4}
                        accessibilityLabel="Incident description input"
                        accessibilityHint="Enter a detailed description of the incident"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Body Part Affected</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.bodyPartAffected}
                        onChangeText={(text) => setFormData({ ...formData, bodyPartAffected: text })}
                        placeholder="e.g., Left hand, Right knee"
                        accessibilityLabel="Body part affected input"
                        accessibilityHint="Enter the body parts that were injured"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Witnesses</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.witnesses}
                        onChangeText={(text) => setFormData({ ...formData, witnesses: text })}
                        placeholder="Names of witnesses"
                        accessibilityLabel="Witnesses input"
                        accessibilityHint="Enter names of any witnesses to the incident"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Immediate Action Taken</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={formData.immediateAction}
                        onChangeText={(text) => setFormData({ ...formData, immediateAction: text })}
                        placeholder="First aid, medical response, etc."
                        multiline
                        numberOfLines={3}
                        accessibilityLabel="Immediate action taken input"
                        accessibilityHint="Describe any immediate actions taken after the incident"
                    />
                </View>

                <View style={styles.formGroup}>
                    <TouchableOpacity
                        style={styles.checkbox}
                        onPress={() => setFormData({ ...formData, medicalTreatment: !formData.medicalTreatment })}
                        accessibilityLabel="Medical treatment required checkbox"
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: formData.medicalTreatment }}
                    >
                        <View style={[styles.checkboxBox, formData.medicalTreatment && styles.checkboxBoxChecked]}>
                            {formData.medicalTreatment && <Text style={styles.checkboxCheck}>✓</Text>}
                        </View>
                        <Text style={styles.checkboxLabel}>Medical Treatment Required</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Work Days Lost</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.workDaysLost}
                        onChangeText={(text) => setFormData({ ...formData, workDaysLost: text })}
                        placeholder="0"
                        keyboardType="numeric"
                        accessibilityLabel="Work days lost input"
                        accessibilityHint="Enter number of work days lost due to injury"
                    />
                </View>

                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                    accessibilityLabel="Submit injury report"
                    accessibilityRole="button"
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <Text style={styles.submitButtonText}>Submit Report</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>

            <Modal
                visible={showEmployeeModal}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setShowEmployeeModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Select Employee</Text>
                                <TouchableOpacity 
                                    onPress={() => setShowEmployeeModal(false)}
                                    accessibilityLabel="Close employee selection"
                                    accessibilityRole="button"
                                >
                                    <Text style={styles.modalClose}>Close</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.searchContainer}>
                                <Search size={20} color="#6b7280" />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search employees..."
                                    value={employeeSearch}
                                    onChangeText={setEmployeeSearch}
                                    accessibilityLabel="Search employees input"
                                    accessibilityHint="Type to search for employees by name or employee number"
                                />
                            </View>

                            <FlatList
                                data={filteredEmployees}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.employeeItem}
                                        onPress={() => selectEmployee(item)}
                                        accessibilityLabel={`Select employee ${item.full_name}`}
                                        accessibilityRole="button"
                                    >
                                        <View>
                                            <Text style={styles.employeeName}>{item.full_name}</Text>
                                            <Text style={styles.employeeDetails}>
                                                {item.employee_number} • {getDepartmentName(item)}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                )}
                                ListEmptyComponent={
                                    <Text style={styles.emptyText}>No employees found</Text>
                                }
                            />
                        </View>
                    </View>
                </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    pageHeader: {
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    pageTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
        textAlign: 'center',
    },
    scrollContent: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
    },
    userInfo: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 20,
        fontStyle: 'italic',
    },
    formGroup: {
        marginBottom: 20,
    },
    row: {
        flexDirection: 'row',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#111827',
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    dropdownTrigger: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dropdownText: {
        fontSize: 16,
        color: '#111827',
        flex: 1,
    },
    dropdownPlaceholder: {
        fontSize: 16,
        color: '#9ca3af',
        flex: 1,
    },
    dateTimeTrigger: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dateTimeText: {
        fontSize: 16,
        color: '#111827',
    },
    segmentedControl: {
        flexDirection: 'row',
        backgroundColor: '#e5e7eb',
        borderRadius: 8,
        padding: 4,
    },
    segmentButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 6,
    },
    segmentButtonActive: {
        backgroundColor: '#2563eb',
    },
    segmentText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
    },
    segmentTextActive: {
        color: '#fff',
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 20,
    },
    chipActive: {
        backgroundColor: '#2563eb',
        borderColor: '#2563eb',
    },
    chipText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6b7280',
    },
    chipTextActive: {
        color: '#fff',
    },
    checkbox: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkboxBox: {
        width: 24,
        height: 24,
        borderWidth: 2,
        borderColor: '#d1d5db',
        borderRadius: 4,
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxBoxChecked: {
        backgroundColor: '#2563eb',
        borderColor: '#2563eb',
    },
    checkboxCheck: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    checkboxLabel: {
        fontSize: 16,
        color: '#374151',
    },
    submitButton: {
        backgroundColor: '#2563eb',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 40,
    },
    submitButtonDisabled: {
        backgroundColor: '#9ca3af',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    errorBox: {
        backgroundColor: '#fee2e2',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
    },
    errorText: {
        color: '#dc2626',
        fontSize: 14,
    },
    successBox: {
        backgroundColor: '#d1fae5',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
    },
    successText: {
        color: '#065f46',
        fontSize: 14,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6b7280',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    modalClose: {
        fontSize: 16,
        color: '#2563eb',
        fontWeight: '600',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
        color: '#111827',
    },
    employeeItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    employeeName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    employeeDetails: {
        fontSize: 14,
        color: '#6b7280',
    },
    emptyText: {
        textAlign: 'center',
        padding: 20,
        color: '#6b7280',
    },
});