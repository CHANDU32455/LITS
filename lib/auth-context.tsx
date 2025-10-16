// lib/auth-context.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

interface Department {
  id: string;
  name: string;
}

interface UserProfile {
  id: string;
  full_name: string;
  employee_number: string;
  position: string;
  department_id: string | null;
  department_name: string | null;
  is_active: boolean;
  created_at: string | null;
  user_id: string;
  phone_number: string | null;
  company_name: string | null;
  email: string;
}

interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
  loadDepartments: () => Promise<void>;
  departments: Department[];
  fetchUserProfile: (userId: string) => Promise<UserProfile | null>;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (
    email: string,
    password: string,
    fullName: string,
    employeeNumber: string,
    departmentName: string,
    phoneNumber?: string,
    companyName?: string,
    position?: string
  ) => Promise<boolean>;
  completeEmployeeProfile: (
    userId: string,
    fullName: string,
    employeeNumber: string,
    departmentName: string,
    phoneNumber?: string,
    companyName?: string,
    position?: string,
    email?: string
  ) => Promise<boolean>;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isSigningUp: boolean;
  isLoggingIn: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const loadDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      if (error) throw error;
      if (data) setDepartments(data);
    } catch (error) {
      console.error('Failed to load departments:', error);
    }
  };

  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error) {
        // This is normal for new users - they don't have a profile yet
        if (error.code === 'PGRST116') { // No rows returned
          console.log('No employee profile found for new user:', userId);
          return null;
        }
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  const refreshUser = async () => {
    try {
      // Get the current session first
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (currentSession?.user) {
        const { data: employeeData, error } = await supabase
          .from('employees')
          .select('*')
          .eq('user_id', currentSession.user.id)
          .single();

        if (error) throw error;

        setUser(employeeData);
        setSession(currentSession);
      } else {
        // If no session, clear user data
        setUser(null);
        setSession(null);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoggingIn(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password: password,
      });

      if (error) {
        Alert.alert('Login Failed', error.message);
        return false;
      }

      if (!data.session || !data.user) {
        Alert.alert('Login Failed', 'No session or user data returned');
        return false;
      }

      const userProfile = await fetchUserProfile(data.user.id);

      if (!userProfile) {
        setSession(data.session);
        return true;
      }

      if (!userProfile.is_active) {
        await supabase.auth.signOut();
        Alert.alert('Account Disabled', 'Your account has been disabled.');
        return false;
      }

      setSession(data.session);
      setUser(userProfile);
      return true;
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
      return false;
    } finally {
      setIsLoggingIn(false);
    }
  };

  const signup = async (
    email: string,
    password: string,
    fullName: string,
    employeeNumber: string,
    departmentName: string,
    phoneNumber?: string,
    companyName?: string,
    position?: string
  ): Promise<boolean> => {
    try {
      setIsSigningUp(true);

      console.log('=== SIGNUP ATTEMPT ===');
      console.log('Email:', email);
      console.log('Full Name:', fullName);

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password: password,
      });

      console.log('Auth response:', authData);
      console.log('Auth error:', authError);

      if (authError) {
        Alert.alert('Signup Failed', authError.message);
        return false;
      }

      if (!authData.user) {
        Alert.alert('Signup Failed', 'No user data returned');
        return false;
      }

      Alert.alert(
        'Success!',
        'Account created successfully! Please check your email for verification. ' +
        'You can complete your employee profile after verification.'
      );

      console.log('User created successfully:', authData.user.id);
      return true;

    } catch (error: any) {
      console.error('Signup error:', error);
      Alert.alert('Signup Failed', error.message);
      return false;
    } finally {
      setIsSigningUp(false);
    }
  };

  const completeEmployeeProfile = async (
    userId: string,
    fullName: string,
    employeeNumber: string,
    departmentName: string,
    phoneNumber?: string,
    companyName?: string,
    position?: string,
    email?: string,
  ): Promise<boolean> => {
    try {
      // First, get the department ID from the departments table
      const { data: departmentData, error: deptError } = await supabase
        .from('departments')
        .select('id')
        .eq('name', departmentName)
        .single();

      if (deptError || !departmentData) {
        console.error('Department not found:', departmentName);
        return false;
      }

      const departmentId = departmentData.id;

      // Now insert the employee record with both department_id and department_name
      const { error } = await supabase
        .from('employees')
        .insert({
          user_id: userId,
          full_name: fullName,
          employee_number: employeeNumber,
          department_id: departmentId, // Add department_id
          department_name: departmentName, // Keep department_name for easy access
          phone_number: phoneNumber || null,
          company_name: companyName || null,
          email: email || null,
          position: position || 'Employee',
          is_active: true,
        });

      if (error) {
        console.error('Profile completion error:', error);
        return false;
      }

      // Refresh user data after profile creation
      const userProfile = await fetchUserProfile(userId);
      if (userProfile) {
        setUser(userProfile);
      }

      return true;
    } catch (error) {
      console.error('Profile completion failed:', error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
    } catch (error: any) {
      Alert.alert('Logout Failed', error.message);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await loadDepartments();

        const { data: { session: currentSession } } = await supabase.auth.getSession();

        if (currentSession?.user) {
          const userProfile = await fetchUserProfile(currentSession.user.id);
          if (userProfile) {
            setSession(currentSession);
            setUser(userProfile);
          } else {
            // This is normal - user is authenticated but doesn't have a profile yet
            setSession(currentSession);
            setUser(null); // Explicitly set user to null
          }
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (event === 'SIGNED_IN' && newSession?.user) {
        const userProfile = await fetchUserProfile(newSession.user.id);
        if (userProfile) {
          setSession(newSession);
          setUser(userProfile);
        } else {
          // New user without profile - this is expected
          setSession(newSession);
          setUser(null);
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
      } else if (event === 'TOKEN_REFRESHED' && newSession) {
        // Update session when token is refreshed
        setSession(newSession);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const value: AuthContextType = {
    user,
    session,
    loadDepartments,
    departments,
    login,
    signup,
    fetchUserProfile,
    completeEmployeeProfile,
    logout,
    refreshUser,
    isLoading,
    isSigningUp,
    isLoggingIn,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}