import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserRole, UserProfile } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { db } from '../lib/storage';

export interface AuthResponse {
  success: boolean;
  error?: string;
  message?: string;
  requiresEmailConfirmation?: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  signup: (email: string, password: string, fullName: string, role?: UserRole) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  isSupabaseConnected: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'drivedesk_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Helper to fetch or initialize the user's role in Supabase
  const resolveUserRole = async (userId: string, requestedRole: UserRole = 'staff'): Promise<UserRole> => {
    if (!supabase) return requestedRole;

    try {
      // 1. Check existing record in user_roles
      const { data: roleRow, error: fetchErr } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (roleRow?.role) {
        return roleRow.role as UserRole;
      }

      // 2. If no role exists yet, check if this is the first registered user
      const { count } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true });

      // First user registered becomes Admin by default; otherwise use requested role
      const assignedRole: UserRole = (count === 0 || count === null) ? 'admin' : requestedRole;

      // 3. Insert assigned role
      const { error: insertErr } = await supabase
        .from('user_roles')
        .insert([{ user_id: userId, role: assignedRole }]);

      if (insertErr) {
        console.warn('Could not persist to user_roles:', insertErr.message);
      }

      return assignedRole;
    } catch (err) {
      console.error('Error resolving role:', err);
      return requestedRole;
    }
  };

  // Sync session on mount and listen to auth changes
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      if (!isSupabaseConfigured || !supabase) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const userMeta = session.user.user_metadata || {};
          const assignedRole = await resolveUserRole(
            session.user.id,
            (userMeta.role as UserRole) || 'admin'
          );

          if (mounted) {
            const profile: UserProfile = {
              id: session.user.id,
              email: session.user.email || '',
              name: userMeta.full_name || session.user.email?.split('@')[0] || 'Administrator',
              role: assignedRole,
            };
            setUser(profile);
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
          }
        } else {
          if (mounted) {
            setUser(null);
            localStorage.removeItem(AUTH_STORAGE_KEY);
          }
        }
      } catch (err) {
        console.error('Failed to restore session:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    // Listen to Supabase Auth state changes
    const { data: authListener } = supabase?.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const userMeta = session.user.user_metadata || {};
          const assignedRole = await resolveUserRole(
            session.user.id,
            (userMeta.role as UserRole) || 'staff'
          );

          const profile: UserProfile = {
            id: session.user.id,
            email: session.user.email || '',
            name: userMeta.full_name || session.user.email?.split('@')[0] || 'User',
            role: assignedRole,
          };
          setUser(profile);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      }
    ) || { data: { subscription: { unsubscribe: () => {} } } };

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const role: UserRole = user?.role || 'staff';
  const isAuthenticated = Boolean(user);
  const isAdmin = role === 'admin';
  const isStaff = role === 'staff';

  // Real Sign In with Supabase Auth
  const login = async (email: string, password: string): Promise<AuthResponse> => {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        error: 'Supabase credentials are not configured in .env file.'
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        // Special helpful handling for unconfirmed emails
        if (error.message.toLowerCase().includes('email not confirmed')) {
          return {
            success: false,
            requiresEmailConfirmation: true,
            error: 'Email address is not confirmed yet. Please verify your email inbox or auto-confirm the user in Supabase.',
          };
        }
        return { success: false, error: error.message };
      }

      if (data.user) {
        const userMeta = data.user.user_metadata || {};
        const assignedRole = await resolveUserRole(
          data.user.id,
          (userMeta.role as UserRole) || 'admin'
        );

        const profile: UserProfile = {
          id: data.user.id,
          email: data.user.email || email,
          name: userMeta.full_name || email.split('@')[0],
          role: assignedRole,
        };

        setUser(profile);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
        db.logActivity('INSERT', 'user_roles', profile.id, `User signed in as ${assignedRole.toUpperCase()}`);
        return { success: true };
      }

      return { success: false, error: 'Sign in failed' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Authentication error' };
    }
  };

  // Real Sign Up with Supabase Auth
  const signup = async (
    email: string,
    password: string,
    fullName: string,
    requestedRole: UserRole = 'staff'
  ): Promise<AuthResponse> => {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        error: 'Supabase credentials are not configured in .env file.'
      };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role: requestedRole,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // If Supabase has email autoconfirm disabled or user is confirmed
      if (data.session && data.user) {
        const assignedRole = await resolveUserRole(data.user.id, requestedRole);
        const profile: UserProfile = {
          id: data.user.id,
          email: data.user.email || email,
          name: fullName || email.split('@')[0],
          role: assignedRole,
        };

        setUser(profile);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
        db.logActivity('INSERT', 'user_roles', profile.id, `Created account as ${assignedRole.toUpperCase()}`);
        return {
          success: true,
          message: 'Account created and signed in successfully!',
        };
      }

      // If confirmation email is required
      return {
        success: true,
        requiresEmailConfirmation: true,
        message: 'Account registered! A confirmation email has been sent. Please verify your email or auto-confirm in Supabase to sign in.',
      };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to create account' };
    }
  };

  // Real Sign Out with Supabase Auth
  const logout = async (): Promise<void> => {
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setUser(null);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        isAdmin,
        isStaff,
        loading,
        login,
        signup,
        logout,
        isSupabaseConnected: isSupabaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
