import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions, RefreshControl } from 'react-native';
import { supabase } from '@/lib/supabase';
import { TrendingUp, Calendar, AlertTriangle, Users } from 'lucide-react-native';

type InjuryReport = {
  id: string;
  incident_date: string;
  severity: 'minor' | 'major' | 'fatal';
  injury_type: string;
  work_days_lost: number;
  employees: {
    department_id: string | null;
    departments: {
      name: string;
    } | null;
  } | null;
};

type Department = {
  id: string;
  name: string;
};

type InjuryStats = {
  total: number;
  minor: number;
  major: number;
  fatal: number;
  totalDaysLost: number;
  byType: { [key: string]: number };
  byDepartment: { [key: string]: number };
  byMonth: { [key: string]: number };
};

export default function Analytics() {
  const [injuries, setInjuries] = useState<InjuryReport[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [stats, setStats] = useState<InjuryStats>({
    total: 0,
    minor: 0,
    major: 0,
    fatal: 0,
    totalDaysLost: 0,
    byType: {},
    byDepartment: {},
    byMonth: {},
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [injuriesResult, departmentsResult] = await Promise.all([
        supabase.from('injury_reports').select(`
          *,
          employees (
            department_id,
            departments (
              name
            )
          )
        `),
        supabase.from('departments').select('*'),
      ]);

      if (injuriesResult.data) {
        setInjuries(injuriesResult.data);
        calculateStats(injuriesResult.data);
      }

      if (departmentsResult.data) {
        setDepartments(departmentsResult.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
  }, []);

  const calculateStats = (data: InjuryReport[]) => {
    const newStats: InjuryStats = {
      total: data.length,
      minor: data.filter((i) => i.severity === 'minor').length,
      major: data.filter((i) => i.severity === 'major').length,
      fatal: data.filter((i) => i.severity === 'fatal').length,
      totalDaysLost: data.reduce((sum, i) => sum + i.work_days_lost, 0),
      byType: {},
      byDepartment: {},
      byMonth: {},
    };

    data.forEach((injury) => {
      newStats.byType[injury.injury_type] = (newStats.byType[injury.injury_type] || 0) + 1;

      const deptName = injury.employees?.departments?.name || 'Unknown';
      newStats.byDepartment[deptName] = (newStats.byDepartment[deptName] || 0) + 1;

      const month = injury.incident_date.substring(0, 7);
      newStats.byMonth[month] = (newStats.byMonth[month] || 0) + 1;
    });

    setStats(newStats);
  };

  const renderBarChart = (data: { [key: string]: number }, title: string, color: string) => {
    const maxValue = Math.max(...Object.values(data), 1);
    const screenWidth = Dimensions.get('window').width;
    const chartWidth = screenWidth - 80;

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>{title}</Text>
        {Object.entries(data)
          .sort((a, b) => b[1] - a[1])
          .map(([key, value]) => {
            const percentage = (value / maxValue) * 100;
            const barWidth = (percentage / 100) * chartWidth;

            return (
              <View key={key} style={styles.barRow}>
                <Text style={styles.barLabel}>{key}</Text>
                <View style={styles.barContainer}>
                  <View style={[styles.bar, { width: barWidth, backgroundColor: color }]} />
                  <Text style={styles.barValue}>{value}</Text>
                </View>
              </View>
            );
          })}
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
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

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#eff6ff' }]}>
            <View style={[styles.statIcon, { backgroundColor: '#2563eb' }]}>
              <AlertTriangle size={24} color="#fff" />
            </View>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Incidents</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#f0fdf4' }]}>
            <View style={[styles.statIcon, { backgroundColor: '#10b981' }]}>
              <TrendingUp size={24} color="#fff" />
            </View>
            <Text style={[styles.statValue, { color: '#10b981' }]}>{stats.minor}</Text>
            <Text style={styles.statLabel}>Minor</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#fef3c7' }]}>
            <View style={[styles.statIcon, { backgroundColor: '#f59e0b' }]}>
              <AlertTriangle size={24} color="#fff" />
            </View>
            <Text style={[styles.statValue, { color: '#f59e0b' }]}>{stats.major}</Text>
            <Text style={styles.statLabel}>Major</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#fee2e2' }]}>
            <View style={[styles.statIcon, { backgroundColor: '#ef4444' }]}>
              <AlertTriangle size={24} color="#fff" />
            </View>
            <Text style={[styles.statValue, { color: '#ef4444' }]}>{stats.fatal}</Text>
            <Text style={styles.statLabel}>Fatal</Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Calendar size={32} color="#2563eb" />
              <View style={styles.summaryTextContainer}>
                <Text style={styles.summaryValue}>{stats.totalDaysLost}</Text>
                <Text style={styles.summaryLabel}>Total Days Lost</Text>
              </View>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Users size={32} color="#2563eb" />
              <View style={styles.summaryTextContainer}>
                <Text style={styles.summaryValue}>{Object.keys(stats.byDepartment).length}</Text>
                <Text style={styles.summaryLabel}>Departments Affected</Text>
              </View>
            </View>
          </View>
        </View>

        {Object.keys(stats.byType).length > 0 &&
          renderBarChart(stats.byType, 'Injuries by Type', '#2563eb')}

        {Object.keys(stats.byDepartment).length > 0 &&
          renderBarChart(stats.byDepartment, 'Injuries by Department', '#10b981')}

        {Object.keys(stats.byMonth).length > 0 &&
          renderBarChart(stats.byMonth, 'Monthly Trends', '#f59e0b')}

        <View style={styles.insightsCard}>
          <Text style={styles.insightsTitle}>Key Insights</Text>

          {stats.total === 0 ? (
            <Text style={styles.insightText}>No injury data available yet.</Text>
          ) : (
            <>
              {Object.keys(stats.byType).length > 0 && (
                <View style={styles.insightItem}>
                  <Text style={styles.insightBullet}>•</Text>
                  <Text style={styles.insightText}>
                    Most common injury type:{' '}
                    <Text style={styles.insightHighlight}>
                      {Object.entries(stats.byType).sort((a, b) => b[1] - a[1])[0][0]}
                    </Text>
                  </Text>
                </View>
              )}

              {Object.keys(stats.byDepartment).length > 0 && (
                <View style={styles.insightItem}>
                  <Text style={styles.insightBullet}>•</Text>
                  <Text style={styles.insightText}>
                    Department with most incidents:{' '}
                    <Text style={styles.insightHighlight}>
                      {Object.entries(stats.byDepartment).sort((a, b) => b[1] - a[1])[0][0]}
                    </Text>
                  </Text>
                </View>
              )}

              {stats.totalDaysLost > 0 && (
                <View style={styles.insightItem}>
                  <Text style={styles.insightBullet}>•</Text>
                  <Text style={styles.insightText}>
                    Average days lost per incident:{' '}
                    <Text style={styles.insightHighlight}>
                      {(stats.totalDaysLost / stats.total).toFixed(1)} days
                    </Text>
                  </Text>
                </View>
              )}

              <View style={styles.insightItem}>
                <Text style={styles.insightBullet}>•</Text>
                <Text style={styles.insightText}>
                  Severity distribution: {stats.minor} minor, {stats.major} major, {stats.fatal}{' '}
                  fatal
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>
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
  scrollView: {
    flex: 1,
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
  content: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2563eb',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryTextContainer: {
    flex: 1,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  barRow: {
    marginBottom: 16,
  },
  barLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    textTransform: 'capitalize',
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bar: {
    height: 24,
    borderRadius: 4,
    minWidth: 2,
  },
  barValue: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  insightsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  insightItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  insightBullet: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563eb',
    marginRight: 8,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  insightHighlight: {
    fontWeight: '700',
    color: '#2563eb',
  },
});