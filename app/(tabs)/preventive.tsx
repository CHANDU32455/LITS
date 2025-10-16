import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  RefreshControl,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { Shield, Plus, CheckCircle, Clock, AlertCircle, ChevronDown, Filter, X, Calendar, User } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

type PreventiveAction = {
  id: string;
  injury_report_id: string | null;
  action_type: 'training' | 'equipment_check' | 'hazard_removal' | 'policy_update' | 'other';
  description: string;
  responsible_person: string | null;
  due_date: string | null;
  completion_date: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  notes: string | null;
  created_at: string;
  injury_reports?: {
    incident_date: string;
    location: string;
    severity: string;
    injury_type: string;
    employees: {
      full_name: string;
    }[] | null;
  } | null;
};

type InjuryReport = {
  id: string;
  incident_date: string;
  location: string;
  severity: string;
  injury_type: string;
  employees: {
    full_name: string;
    employee_number: string;
  }[] | null;
};

// Separate Modal Component with its own state
const AddActionModal = ({ 
  visible, 
  onClose, 
  onSubmit,
  injuryReports 
}: { 
  visible: boolean; 
  onClose: () => void; 
  onSubmit: (data: any) => Promise<void>;
  injuryReports: InjuryReport[];
}) => {
  const [formData, setFormData] = useState({
    injuryReportId: '',
    actionType: 'other' as PreventiveAction['action_type'],
    description: '',
    responsiblePerson: '',
    dueDate: '',
    status: 'pending' as PreventiveAction['status'],
    notes: '',
  });
  
  const [selectedInjury, setSelectedInjury] = useState<InjuryReport | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showInjuryModal, setShowInjuryModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      resetForm();
    }
  }, [visible]);

  const resetForm = useCallback(() => {
    setFormData({
      injuryReportId: '',
      actionType: 'other',
      description: '',
      responsiblePerson: '',
      dueDate: '',
      status: 'pending',
      notes: '',
    });
    setSelectedInjury(null);
    setSelectedDate(new Date());
    setError(null);
    setShowDatePicker(false);
    setShowInjuryModal(false);
    setSubmitting(false);
  }, []);

  const handleFormChange = useCallback((field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleDateChange = useCallback((event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
      setFormData(prev => ({ 
        ...prev, 
        dueDate: date.toISOString().split('T')[0] 
      }));
    }
  }, []);

  const selectInjury = useCallback((injury: InjuryReport) => {
    setSelectedInjury(injury);
    setFormData(prev => ({ ...prev, injuryReportId: injury.id }));
    setShowInjuryModal(false);
  }, []);

  const handleSubmit = useCallback(async () => {
    setError(null);
    setSubmitting(true);

    if (!formData.description?.trim() || !formData.actionType) {
      setError('Please fill in required fields');
      setSubmitting(false);
      return;
    }

    try {
      await onSubmit(formData);
      // Close modal only after successful submission
      onClose();
    } catch (error) {
      setError('Failed to create action. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [formData, onSubmit, onClose]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const getEmployeeName = useCallback((employees: any) => {
    if (!employees) return 'Unknown';
    if (Array.isArray(employees)) {
      if (employees.length === 0) return 'Unknown';
      const employee = employees[0];
      return employee?.full_name || 'Unknown';
    }
    if (typeof employees === 'object' && employees !== null) {
      return employees.full_name || 'Unknown';
    }
    return 'Unknown';
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  const getSeverityColor = useCallback((severity: string) => {
    switch (severity) {
      case 'minor': return '#10b981';
      case 'major': return '#f59e0b';
      case 'fatal': return '#ef4444';
      default: return '#6b7280';
    }
  }, []);

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
        <SafeAreaProvider>
          <SafeAreaView style={styles.modalSafeArea} edges={['top', 'left', 'right']}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Create Preventive Action</Text>
                  <TouchableOpacity onPress={handleClose} style={styles.closeButton} disabled={submitting}>
                    <X size={24} color="#6b7280" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                  {error && (
                    <View style={styles.errorBox}>
                      <AlertCircle size={20} color="#dc2626" />
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  )}

                  <View style={styles.formSection}>
                    <Text style={styles.sectionLabel}>Link to Injury Report (Optional)</Text>
                    <TouchableOpacity 
                      style={styles.injurySelector}
                      onPress={() => setShowInjuryModal(true)}
                      disabled={submitting}
                    >
                      <Text style={selectedInjury ? styles.injurySelectorText : styles.injurySelectorPlaceholder}>
                        {selectedInjury
                          ? `${getEmployeeName(selectedInjury.employees)} - ${formatDate(selectedInjury.incident_date)}`
                          : 'Select an injury report...'
                        }
                      </Text>
                      <ChevronDown size={20} color="#6b7280" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.formSection}>
                    <Text style={styles.sectionLabel}>Action Type *</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                      <View style={styles.chipContainer}>
                        {(['training', 'equipment_check', 'hazard_removal', 'policy_update', 'other'] as const).map((type) => (
                          <TouchableOpacity
                            key={type}
                            style={[styles.chip, formData.actionType === type && styles.chipActive]}
                            onPress={() => handleFormChange('actionType', type)}
                            disabled={submitting}
                          >
                            <Text style={[styles.chipText, formData.actionType === type && styles.chipTextActive]}>
                              {type.replace('_', ' ')}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  </View>

                  <View style={styles.formSection}>
                    <Text style={styles.sectionLabel}>Description *</Text>
                    <TextInput
                      style={styles.textArea}
                      value={formData.description}
                      onChangeText={(text) => handleFormChange('description', text)}
                      placeholder="Describe the preventive action to be taken..."
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                      editable={!submitting}
                    />
                  </View>

                  <View style={styles.formRow}>
                    <View style={styles.formGroup}>
                      <Text style={styles.sectionLabel}>Responsible Person</Text>
                      <View style={styles.inputWithIcon}>
                        <User size={18} color="#9ca3af" style={styles.inputIcon} />
                        <TextInput
                          style={[styles.input, styles.inputWithIconPadding]}
                          value={formData.responsiblePerson}
                          onChangeText={(text) => handleFormChange('responsiblePerson', text)}
                          placeholder="Enter name"
                          editable={!submitting}
                        />
                      </View>
                    </View>
                    <View style={styles.formGroup}>
                      <Text style={styles.sectionLabel}>Due Date</Text>
                      <TouchableOpacity 
                        style={styles.inputWithIcon}
                        onPress={() => setShowDatePicker(true)}
                        disabled={submitting}
                      >
                        <Calendar size={18} color="#9ca3af" style={styles.inputIcon} />
                        <Text style={[styles.input, styles.inputWithIconPadding, !formData.dueDate && { color: '#9ca3af' }]}>
                          {formData.dueDate ? formatDate(formData.dueDate) : 'Select date...'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.formSection}>
                    <Text style={styles.sectionLabel}>Additional Notes</Text>
                    <TextInput
                      style={styles.textArea}
                      value={formData.notes}
                      onChangeText={(text) => handleFormChange('notes', text)}
                      placeholder="Add any additional context or notes..."
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                      editable={!submitting}
                    />
                  </View>

                  <View style={styles.modalActions}>
                    <TouchableOpacity 
                      style={[styles.modalButton, styles.cancelButton]} 
                      onPress={handleClose}
                      disabled={submitting}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.modalButton, styles.submitButton]} 
                      onPress={handleSubmit}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Plus size={20} color="#fff" />
                          <Text style={styles.submitButtonText}>Create Action</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}
          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>

      {/* Injury Selection Modal */}
      <Modal visible={showInjuryModal} animationType="slide" transparent statusBarTranslucent>
        <SafeAreaProvider>
          <SafeAreaView style={styles.modalSafeArea} edges={['top', 'left', 'right']}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Injury Report</Text>
                  <TouchableOpacity onPress={() => setShowInjuryModal(false)} disabled={submitting}>
                    <X size={24} color="#6b7280" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalScroll}>
                  {injuryReports.map((injury) => (
                    <TouchableOpacity
                      key={injury.id}
                      style={styles.injuryItem}
                      onPress={() => selectInjury(injury)}
                      disabled={submitting}
                    >
                      <View style={styles.injuryItemHeader}>
                        <Text style={styles.injuryEmployeeName}>
                          {getEmployeeName(injury.employees)}
                        </Text>
                        <View style={[styles.severityDot, { backgroundColor: getSeverityColor(injury.severity) }]} />
                      </View>
                      <Text style={styles.injuryDate}>{formatDate(injury.incident_date)}</Text>
                      <Text style={styles.injuryLocation}>{injury.location}</Text>
                      <Text style={styles.injuryType}>{injury.injury_type}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
    </>
  );
};

// Main Component
export default function Preventive() {
  const [actions, setActions] = useState<PreventiveAction[]>([]);
  const [injuryReports, setInjuryReports] = useState<InjuryReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [success, setSuccess] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [actionsResult, reportsResult] = await Promise.all([
        supabase
          .from('preventive_actions')
          .select(`
          *,
          injury_reports (
            incident_date,
            location,
            severity,
            injury_type,
            employees (
              full_name
            )
          )
        `)
          .order('created_at', { ascending: false }),
        supabase
          .from('injury_reports')
          .select(`
          id, 
          incident_date, 
          location, 
          severity,
          injury_type,
          employees (
            full_name,
            employee_number
          )
        `)
          .order('incident_date', { ascending: false }),
      ]);

      if (actionsResult.data) setActions(actionsResult.data);
      if (reportsResult.data) setInjuryReports(reportsResult.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
  }, [fetchData]);

  const handleSubmitAction = useCallback(async (formData: any) => {
    const { error: insertError } = await supabase.from('preventive_actions').insert({
      injury_report_id: formData.injuryReportId || null,
      action_type: formData.actionType,
      description: formData.description.trim(),
      responsible_person: formData.responsiblePerson?.trim() || null,
      due_date: formData.dueDate || null,
      status: formData.status,
      notes: formData.notes?.trim() || null,
    });

    if (insertError) {
      throw new Error(insertError.message);
    }

    setSuccess(true);
    fetchData();
    setTimeout(() => setSuccess(false), 3000);
  }, [fetchData]);

  const updateActionStatus = useCallback(async (id: string, newStatus: PreventiveAction['status']) => {
    const updateData: any = { status: newStatus };
    if (newStatus === 'completed') {
      updateData.completion_date = new Date().toISOString().split('T')[0];
    }

    const { error } = await supabase
      .from('preventive_actions')
      .update(updateData)
      .eq('id', id);

    if (!error) {
      setActions(prev => prev.map(action => 
        action.id === id ? { ...action, ...updateData } : action
      ));
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'in_progress': return '#f59e0b';
      case 'pending': return '#6b7280';
      default: return '#6b7280';
    }
  }, []);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'in_progress': return Clock;
      case 'pending': return AlertCircle;
      default: return AlertCircle;
    }
  }, []);

  const getEmployeeName = useCallback((employees: any) => {
    if (!employees) return 'Unknown';
    if (Array.isArray(employees)) {
      if (employees.length === 0) return 'Unknown';
      const employee = employees[0];
      return employee?.full_name || 'Unknown';
    }
    if (typeof employees === 'object' && employees !== null) {
      return employees.full_name || 'Unknown';
    }
    return 'Unknown';
  }, []);

  const filteredActions = useMemo(() => 
    filterStatus === 'all' 
      ? actions 
      : actions.filter((action) => action.status === filterStatus),
    [actions, filterStatus]
  );

  const getStatusText = useCallback((status: string) => {
    return status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  const getSeverityColor = useCallback((severity: string) => {
    switch (severity) {
      case 'minor': return '#10b981';
      case 'major': return '#f59e0b';
      case 'fatal': return '#ef4444';
      default: return '#6b7280';
    }
  }, []);

  if (loading && !refreshing) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>Loading preventive actions...</Text>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView 
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerMain}>
              <View>
                <Text style={styles.headerTitle}>Preventive Actions</Text>
                <Text style={styles.headerSubtitle}>
                  {filteredActions.length} action{filteredActions.length !== 1 ? 's' : ''} 
                  {filterStatus !== 'all' && ` • ${getStatusText(filterStatus)}`}
                </Text>
              </View>
              <View style={styles.headerActions}>
                <TouchableOpacity 
                  style={[styles.iconButton, showFilterDropdown && styles.iconButtonActive]}
                  onPress={() => setShowFilterDropdown(!showFilterDropdown)}
                >
                  <Filter size={22} color={showFilterDropdown ? "#2563eb" : "#6b7280"} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.primaryIconButton}
                  onPress={() => setShowModal(true)}
                >
                  <Plus size={22} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {showFilterDropdown && (
              <View style={styles.filterDropdown}>
                <View style={styles.filterDropdownHeader}>
                  <Text style={styles.filterDropdownTitle}>Filter by Status</Text>
                  <TouchableOpacity onPress={() => setShowFilterDropdown(false)}>
                    <X size={20} color="#6b7280" />
                  </TouchableOpacity>
                </View>
                <View style={styles.filterOptions}>
                  {['all', 'pending', 'in_progress', 'completed'].map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.filterOption,
                        filterStatus === status && styles.filterOptionActive
                      ]}
                      onPress={() => {
                        setFilterStatus(status);
                        setShowFilterDropdown(false);
                      }}
                    >
                      <View style={styles.filterOptionLeft}>
                        <View style={[
                          styles.statusIndicator,
                          { backgroundColor: status === 'all' ? '#2563eb' : getStatusColor(status) }
                        ]} />
                        <Text style={styles.filterOptionText}>
                          {getStatusText(status)}
                        </Text>
                      </View>
                      <Text style={styles.filterOptionCount}>
                        {status === 'all' ? actions.length : actions.filter(a => a.status === status).length}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          {success && (
            <View style={styles.successBox}>
              <CheckCircle size={20} color="#059669" />
              <Text style={styles.successText}>Preventive action added successfully!</Text>
            </View>
          )}

          {/* Main Content */}
          <ScrollView
            style={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#2563eb']}
                tintColor="#2563eb"
              />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {filteredActions.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyStateIcon}>
                  <Shield size={64} color="#d1d5db" />
                </View>
                <Text style={styles.emptyStateTitle}>No preventive actions found</Text>
                <Text style={styles.emptyStateText}>
                  {filterStatus !== 'all' 
                    ? `No actions with status "${getStatusText(filterStatus)}"`
                    : 'Get started by creating your first preventive action'
                  }
                </Text>
                <View style={styles.emptyStateActions}>
                  {filterStatus !== 'all' && (
                    <TouchableOpacity
                      style={styles.secondaryButton}
                      onPress={() => setFilterStatus('all')}
                    >
                      <Text style={styles.secondaryButtonText}>Show All Actions</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => setShowModal(true)}
                  >
                    <Plus size={20} color="#fff" />
                    <Text style={styles.primaryButtonText}>New Action</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              filteredActions.map((action) => {
                const StatusIcon = getStatusIcon(action.status);
                const statusColor = getStatusColor(action.status);

                return (
                  <View key={action.id} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <View style={styles.cardStatus}>
                        <StatusIcon size={16} color={statusColor} />
                        <Text style={[styles.statusText, { color: statusColor }]}>
                          {getStatusText(action.status)}
                        </Text>
                      </View>
                      <View style={styles.cardMeta}>
                        <View style={[styles.typeBadge, { backgroundColor: `${statusColor}15` }]}>
                          <Text style={[styles.typeBadgeText, { color: statusColor }]}>
                            {action.action_type.replace('_', ' ')}
                          </Text>
                        </View>
                        <Text style={styles.cardDate}>
                          {formatDate(action.created_at)}
                        </Text>
                      </View>
                    </View>

                    {action.injury_reports && (
                      <View style={styles.linkedInjury}>
                        <Text style={styles.linkedInjuryLabel}>Linked to Injury Report</Text>
                        <View style={styles.injuryContent}>
                          <View style={styles.injuryMain}>
                            <Text style={styles.injuryEmployee}>
                              {getEmployeeName(action.injury_reports.employees)}
                            </Text>
                            <View style={styles.injuryMeta}>
                              <View style={[styles.severityDot, { backgroundColor: getSeverityColor(action.injury_reports.severity) }]} />
                              <Text style={styles.injuryMetaText}>
                                {formatDate(action.injury_reports.incident_date)} • {action.injury_reports.location}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.injuryType}>
                            {action.injury_reports.injury_type}
                          </Text>
                        </View>
                      </View>
                    )}

                    <Text style={styles.cardDescription}>{action.description}</Text>

                    <View style={styles.cardDetails}>
                      {action.responsible_person && (
                        <View style={styles.detailItem}>
                          <User size={14} color="#6b7280" />
                          <Text style={styles.detailLabel}>Responsible:</Text>
                          <Text style={styles.detailValue}>{action.responsible_person}</Text>
                        </View>
                      )}

                      {action.due_date && (
                        <View style={styles.detailItem}>
                          <Calendar size={14} color="#6b7280" />
                          <Text style={styles.detailLabel}>Due:</Text>
                          <Text style={[
                            styles.detailValue,
                            new Date(action.due_date) < new Date() && action.status !== 'completed' 
                              ? { color: '#ef4444', fontWeight: '700' } 
                              : {}
                          ]}>
                            {formatDate(action.due_date)}
                            {new Date(action.due_date) < new Date() && action.status !== 'completed' && ' • Overdue'}
                          </Text>
                        </View>
                      )}

                      {action.completion_date && (
                        <View style={styles.detailItem}>
                          <CheckCircle size={14} color="#10b981" />
                          <Text style={styles.detailLabel}>Completed:</Text>
                          <Text style={[styles.detailValue, { color: '#10b981' }]}>
                            {formatDate(action.completion_date)}
                          </Text>
                        </View>
                      )}
                    </View>

                    {action.notes && (
                      <View style={styles.cardNotes}>
                        <Text style={styles.notesLabel}>Notes</Text>
                        <Text style={styles.notesText}>{action.notes}</Text>
                      </View>
                    )}

                    {action.status !== 'completed' && (
                      <View style={styles.cardActions}>
                        {action.status === 'pending' && (
                          <TouchableOpacity
                            style={[styles.actionButton, styles.secondaryAction]}
                            onPress={() => updateActionStatus(action.id, 'in_progress')}
                          >
                            <Clock size={16} color="#f59e0b" />
                            <Text style={styles.secondaryActionText}>Start Progress</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          style={[styles.actionButton, styles.primaryAction]}
                          onPress={() => updateActionStatus(action.id, 'completed')}
                        >
                          <CheckCircle size={16} color="#fff" />
                          <Text style={styles.primaryActionText}>Mark Complete</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })
            )}
            <View style={styles.bottomSpacer} />
          </ScrollView>

          {/* Modal */}
          <AddActionModal
            visible={showModal}
            onClose={() => setShowModal(false)}
            onSubmit={handleSubmitAction}
            injuryReports={injuryReports}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  iconButtonActive: {
    backgroundColor: '#f0f9ff',
    borderColor: '#2563eb',
  },
  primaryIconButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  filterDropdown: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  filterDropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterDropdownTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  closeIcon: {
    padding: 4,
  },
  filterOptions: {
    gap: 4,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  filterOptionActive: {
    backgroundColor: '#f0f9ff',
  },
  filterOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  filterOptionText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
    textTransform: 'capitalize',
    flex: 1,
  },
  filterOptionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
  },
  successBox: {
    backgroundColor: '#d1fae5',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  successText: {
    color: '#065f46',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  listContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24, // Safe area for bottom navigation
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  cardMeta: {
    alignItems: 'flex-end',
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  cardDate: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  linkedInjury: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  linkedInjuryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  injuryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  injuryMain: {
    flex: 1,
  },
  injuryEmployee: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  injuryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  injuryMetaText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  injuryType: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    textTransform: 'capitalize',
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardDescription: {
    fontSize: 16,
    color: '#111827',
    lineHeight: 24,
    marginBottom: 16,
    fontWeight: '500',
  },
  cardDetails: {
    gap: 12,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    width: 80,
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    flex: 1,
  },
  cardNotes: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notesText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  primaryAction: {
    backgroundColor: '#2563eb',
  },
  primaryActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryAction: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  secondaryActionText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  emptyStateIcon: {
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#6b7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    fontWeight: '500',
  },
  emptyStateActions: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#f8fafc',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '700',
  },
  bottomSpacer: {
    height: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  modalScroll: {
    padding: 24,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
  },
  injurySelector: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  injurySelectorText: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
    fontWeight: '500',
  },
  injurySelectorPlaceholder: {
    fontSize: 16,
    color: '#9ca3af',
    flex: 1,
    fontWeight: '500',
  },
  chipScroll: {
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  chipContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 24,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
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
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  chipTextActive: {
    color: '#fff',
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  formGroup: {
    flex: 1,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  inputWithIconPadding: {
    paddingLeft: 46,
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  textArea: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    minHeight: 120,
    textAlignVertical: 'top',
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '700',
  },
  submitButton: {
    backgroundColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  injuryItem: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  injuryItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  injuryEmployeeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  injuryDate: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  injuryLocation: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
    fontWeight: '500',
  },
});