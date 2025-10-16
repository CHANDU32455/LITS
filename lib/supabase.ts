// lib/supabase.ts
import 'react-native-url-polyfill/auto';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Get from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file and app.json configuration.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});

// Auto refresh token when app is active
if (Platform.OS !== "web") {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}

export type Database = {
  public: {
    Tables: {
      departments: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
      };
      employees: {
        Row: {
          id: string;
          user_id: string | null;
          full_name: string;
          department_id: string | null;
          employee_number: string;
          position: string | null;
          created_at: string;
          updated_at: string;
          is_active: boolean;
          last_login: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          full_name: string;
          department_id?: string | null;
          employee_number: string;
          position?: string | null;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
          last_login?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          full_name?: string;
          department_id?: string | null;
          employee_number?: string;
          position?: string | null;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
          last_login?: string | null;
        };
      };
      injury_reports: {
        Row: {
          id: string;
          employee_id: string | null;
          reported_by: string | null;
          incident_date: string;
          incident_time: string;
          location: string;
          description: string;
          severity: 'minor' | 'major' | 'fatal';
          injury_type: 'slip' | 'fall' | 'equipment' | 'chemical' | 'cut' | 'burn' | 'strain' | 'other';
          body_part_affected: string | null;
          witnesses: string | null;
          immediate_action_taken: string | null;
          medical_treatment_required: boolean;
          work_days_lost: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employee_id?: string | null;
          reported_by?: string | null;
          incident_date: string;
          incident_time: string;
          location: string;
          description: string;
          severity: 'minor' | 'major' | 'fatal';
          injury_type: 'slip' | 'fall' | 'equipment' | 'chemical' | 'cut' | 'burn' | 'strain' | 'other';
          body_part_affected?: string | null;
          witnesses?: string | null;
          immediate_action_taken?: string | null;
          medical_treatment_required?: boolean;
          work_days_lost?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string | null;
          reported_by?: string | null;
          incident_date?: string;
          incident_time?: string;
          location?: string;
          description?: string;
          severity?: 'minor' | 'major' | 'fatal';
          injury_type?: 'slip' | 'fall' | 'equipment' | 'chemical' | 'cut' | 'burn' | 'strain' | 'other';
          body_part_affected?: string | null;
          witnesses?: string | null;
          immediate_action_taken?: string | null;
          medical_treatment_required?: boolean;
          work_days_lost?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      preventive_actions: {
        Row: {
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
        };
        Insert: {
          id?: string;
          injury_report_id?: string | null;
          action_type: 'training' | 'equipment_check' | 'hazard_removal' | 'policy_update' | 'other';
          description: string;
          responsible_person?: string | null;
          due_date?: string | null;
          completion_date?: string | null;
          status?: 'pending' | 'in_progress' | 'completed';
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          injury_report_id?: string | null;
          action_type?: 'training' | 'equipment_check' | 'hazard_removal' | 'policy_update' | 'other';
          description?: string;
          responsible_person?: string | null;
          due_date?: string | null;
          completion_date?: string | null;
          status?: 'pending' | 'in_progress' | 'completed';
          notes?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
};