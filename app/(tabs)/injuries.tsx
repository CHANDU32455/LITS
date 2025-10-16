import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { Search, Filter, AlertCircle } from 'lucide-react-native';

type InjuryReport = {
  id: string;
  incident_date: string;
  incident_time: string;
  location: string;
  description: string;
  severity: 'minor' | 'major' | 'fatal';
  injury_type: string;
  medical_treatment_required: boolean;
  work_days_lost: number;
  employees: {
    full_name: string;
    employee_number: string;
  } | null;
};

export default function Injuries() {
  const [injuries, setInjuries] = useState<InjuryReport[]>([]);
  const [filteredInjuries, setFilteredInjuries] = useState<InjuryReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [selectedInjury, setSelectedInjury] = useState<InjuryReport | null>(null);

  useEffect(() => {
    fetchInjuries();
  }, []);

  useEffect(() => {
    filterInjuries();
  }, [searchQuery, severityFilter, injuries]);

  const fetchInjuries = async () => {
    try {
      const { data, error } = await supabase
        .from('injury_reports')
        .select(`
          *,
          employees (
            full_name,
            employee_number
          )
        `)
        .order('incident_date', { ascending: false });

      if (error) throw error;
      
      if (data) {
        setInjuries(data);
        setFilteredInjuries(data);
      }
    } catch (error) {
      console.error('Error fetching injuries:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInjuries();
  };

  const filterInjuries = () => {
    let filtered = [...injuries];

    if (searchQuery) {
      filtered = filtered.filter(
        (injury) =>
          injury.employees?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          injury.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          injury.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          injury.injury_type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (severityFilter !== 'all') {
      filtered = filtered.filter((injury) => injury.severity === severityFilter);
    }

    setFilteredInjuries(filtered);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'minor':
        return '#10b981';
      case 'major':
        return '#f59e0b';
      case 'fatal':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading injuries...</Text>
      </View>
    );
  }

  if (selectedInjury) {
    return (
      <View style={styles.container}>
        <View style={styles.detailHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedInjury(null)}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.detailTitle}>Report Details</Text>
          <View
            style={[
              styles.severityBadge,
              { backgroundColor: getSeverityColor(selectedInjury.severity) },
            ]}>
            <Text style={styles.severityBadgeText}>
              {selectedInjury.severity.toUpperCase()}
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.detailScroll}
          contentContainerStyle={styles.detailContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Employee</Text>
            <Text style={styles.detailValue}>
              {selectedInjury.employees?.full_name || 'Unknown'} ({selectedInjury.employees?.employee_number || 'N/A'})
            </Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Date & Time</Text>
            <Text style={styles.detailValue}>
              {selectedInjury.incident_date} at {selectedInjury.incident_time}
            </Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Location</Text>
            <Text style={styles.detailValue}>{selectedInjury.location}</Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Injury Type</Text>
            <Text style={styles.detailValue}>
              {selectedInjury.injury_type.charAt(0).toUpperCase() + selectedInjury.injury_type.slice(1)}
            </Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Description</Text>
            <Text style={styles.detailValue}>{selectedInjury.description}</Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Medical Treatment</Text>
            <Text style={styles.detailValue}>
              {selectedInjury.medical_treatment_required ? 'Yes' : 'No'}
            </Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Work Days Lost</Text>
            <Text style={styles.detailValue}>{selectedInjury.work_days_lost} days</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Search size={20} color="#6b7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by employee, location, or description..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <View style={styles.filterContainer}>
            <Filter size={16} color="#6b7280" />
            <Text style={styles.filterLabel}>Severity:</Text>
            {['all', 'minor', 'major', 'fatal'].map((severity) => (
              <TouchableOpacity
                key={severity}
                style={[
                  styles.filterChip,
                  severityFilter === severity && styles.filterChipActive,
                ]}
                onPress={() => setSeverityFilter(severity)}>
                <Text
                  style={[
                    styles.filterChipText,
                    severityFilter === severity && styles.filterChipTextActive,
                  ]}>
                  {severity.charAt(0).toUpperCase() + severity.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{filteredInjuries.length}</Text>
            <Text style={styles.statLabel}>Total Reports</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#10b981' }]}>
              {filteredInjuries.filter((i) => i.severity === 'minor').length}
            </Text>
            <Text style={styles.statLabel}>Minor</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#f59e0b' }]}>
              {filteredInjuries.filter((i) => i.severity === 'major').length}
            </Text>
            <Text style={styles.statLabel}>Major</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#ef4444' }]}>
              {filteredInjuries.filter((i) => i.severity === 'fatal').length}
            </Text>
            <Text style={styles.statLabel}>Fatal</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2563eb']}
            tintColor="#2563eb"
            progressViewOffset={50} // Better positioning for refresh control
            title="Pull to refresh injuries"
            titleColor="#64748b"
          />
        }
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.scrollContent}
      >
        {filteredInjuries.length === 0 ? (
          <View style={styles.emptyState}>
            <AlertCircle size={48} color="#9ca3af" />
            <Text style={styles.emptyStateText}>No injury reports found</Text>
            {searchQuery || severityFilter !== 'all' ? (
              <TouchableOpacity 
                style={styles.clearFiltersButton}
                onPress={() => {
                  setSearchQuery('');
                  setSeverityFilter('all');
                }}
              >
                <Text style={styles.clearFiltersText}>Clear Filters</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={onRefresh}
              >
                <Text style={styles.refreshButtonText}>Refresh Data</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredInjuries.map((injury) => (
            <TouchableOpacity
              key={injury.id}
              style={styles.card}
              onPress={() => setSelectedInjury(injury)}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <Text style={styles.cardEmployee}>
                    {injury.employees?.full_name || 'Unknown'}
                  </Text>
                  <Text style={styles.cardDate}>
                    {injury.incident_date} at {injury.incident_time}
                  </Text>
                </View>
                <View
                  style={[
                    styles.severityDot,
                    { backgroundColor: getSeverityColor(injury.severity) },
                  ]}
                />
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.cardLocation}>{injury.location}</Text>
                <Text style={styles.cardDescription} numberOfLines={2}>
                  {injury.description}
                </Text>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.cardTag}>
                  <Text style={styles.cardTagText}>{injury.injury_type}</Text>
                </View>
                {injury.medical_treatment_required && (
                  <View style={[styles.cardTag, styles.medicalTag]}>
                    <Text style={styles.medicalTagText}>Medical Treatment</Text>
                  </View>
                )}
                {injury.work_days_lost > 0 && (
                  <View style={styles.cardTag}>
                    <Text style={styles.cardTagText}>{injury.work_days_lost} days lost</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
        
        {/* Add some bottom padding for better scroll experience */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  centerContainer: {
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
  detailScroll: {
    flex: 1,
  },
  detailContent: {
    padding: 20,
  },
  // Header Styles
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
  },
  searchSection: {
    padding: 16,
    backgroundColor: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginLeft: 4,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
  },
  filterChipActive: {
    backgroundColor: '#2563eb',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2563eb',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  // Scroll Content Styles
  listContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  cardEmployee: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  cardDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  severityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  cardBody: {
    marginBottom: 12,
  },
  cardLocation: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cardTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
  },
  cardTagText: {
    fontSize: 12,
    color: '#6b7280',
  },
  medicalTag: {
    backgroundColor: '#fef3c7',
  },
  medicalTagText: {
    fontSize: 12,
    color: '#92400e',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
  clearFiltersButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#2563eb',
    borderRadius: 8,
  },
  clearFiltersText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  refreshButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#10b981',
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 20,
  },
  backButton: {
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  severityBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  detailSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  detailValue: {
    fontSize: 16,
    color: '#111827',
    lineHeight: 24,
  },
});