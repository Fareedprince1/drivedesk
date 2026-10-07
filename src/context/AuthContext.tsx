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
  signup: (
    email: string,
    password: string,
    fullName: string,
    role?: UserRole,
    adminEmail?: string
  ) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  isSupabaseConnected: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'gem_auth_user';

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

  // Helper to fetch or initialize the user's role and link to school admin
  const resolveUserRole = async (
    userId: string,
    userEmail: string,
    requestedRole: UserRole = 'admin',
    adminEmailFromMeta?: string
  ): Promise<{ role: UserRole; schoolAdminId: string; adminEmail?: string }> => {
    if (!supabase) {
      return {
        role: requestedRole,
        schoolAdminId: userId,
        adminEmail: adminEmailFromMeta || userEmail,
      };
    }

    try {
      // 1. Check existing record in user_roles
      const { data: roleRow } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (roleRow?.role) {
        return {
          role: roleRow.role as UserRole,
          schoolAdminId: roleRow.school_admin_id || (roleRow.role === 'admin' ? userId : userId),
          adminEmail: roleRow.admin_email || userEmail,
        };
      }

      // 2. If no role row exists, determine schoolAdminId
      let schoolAdminId = userId;
      const targetAdminEmail = adminEmailFromMeta
        ? adminEmailFromMeta.trim().toLowerCase()
        : userEmail.toLowerCase();

      if (requestedRole === 'staff' && targetAdminEmail) {
        // Try looking up the admin's user_id from user_roles
        const { data: adminRow } = await supabase
          .from('user_roles')
          .select('user_id, email')
          .ilike('email', targetAdminEmail)
          .eq('role', 'admin')
          .maybeSingle();

        if (adminRow?.user_id) {
          schoolAdminId = adminRow.user_id;
        }
      }

      // 3. Insert or update user_roles row
      try {
        const payload: any = {
          user_id: userId,
          role: requestedRole,
          school_admin_id: schoolAdminId,
          email: userEmail.toLowerCase(),
          admin_email: targetAdminEmail,
        };
        await supabase.from('user_roles').upsert([payload]);
      } catch (e) {
        console.warn('Upsert user_roles warning:', e);
      }

      return {
        role: requestedRole,
        schoolAdminId,
        adminEmail: targetAdminEmail,
      };
    } catch (err) {
      console.error('Error resolving role:', err);
      return {
        role: requestedRole,
        schoolAdminId: userId,
        adminEmail: userEmail,
      };
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
          const { role: assignedRole, schoolAdminId, adminEmail } = await resolveUserRole(
            session.user.id,
            session.user.email || '',
            (userMeta.role as UserRole) || 'admin',
            userMeta.admin_email as string | undefined
          );

          if (mounted) {
            const profile: UserProfile = {
              id: session.user.id,
              email: session.user.email || '',
              name: userMeta.full_name || session.user.email?.split('@')[0] || 'Administrator',
              role: assignedRole,
              schoolAdminId,
              adminEmail,
            };
            db.setActiveUser(session.user.id, schoolAdminId);
            setUser(profile);
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
            await db.syncFromCloud();
          }
        } else {
          if (mounted) {
            db.setActiveUser(null, null);
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
          const { role: assignedRole, schoolAdminId, adminEmail } = await resolveUserRole(
            session.user.id,
            session.user.email || '',
            (userMeta.role as UserRole) || 'admin',
            userMeta.admin_email as string | undefined
          );

          const profile: UserProfile = {
            id: session.user.id,
            email: session.user.email || '',
            name: userMeta.full_name || session.user.email?.split('@')[0] || 'User',
            role: assignedRole,
            schoolAdminId,
            adminEmail,
          };
          db.setActiveUser(session.user.id, schoolAdminId);
          setUser(profile);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
        } else if (event === 'SIGNED_OUT') {
          db.setActiveUser(null, null);
          db.clearAllData();
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
        error: 'Supabase credentials are not configured in .env file.',
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
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
        const { role: assignedRole, schoolAdminId, adminEmail } = await resolveUserRole(
          data.user.id,
          data.user.email || email,
          (userMeta.role as UserRole) || 'admin',
          userMeta.admin_email as string | undefined
        );

        const profile: UserProfile = {
          id: data.user.id,
          email: data.user.email || email,
          name: userMeta.full_name || email.split('@')[0],
          role: assignedRole,
          schoolAdminId,
          adminEmail,
        };

        db.setActiveUser(data.user.id, schoolAdminId);
        setUser(profile);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
        db.logActivity('INSERT', 'user_roles', profile.id, `User signed in as ${assignedRole.toUpperCase()}`);
        await db.syncFromCloud();
        return { success: true };
      }

      return { success: false, error: 'Sign in failed' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Authentication error' };
    }
  };

  // Real Sign Up with Supabase Auth (Supports Admin & Staff linking)
  const signup = async (
    email: string,
    password: string,
    fullName: string,
    requestedRole: UserRole = 'admin',
    adminEmail?: string
  ): Promise<AuthResponse> => {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        error: 'Supabase credentials are not configured in .env file.',
      };
    }

    try {
      const trimmedAdminEmail = adminEmail ? adminEmail.trim().toLowerCase() : email.trim().toLowerCase();

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role: requestedRole,
            admin_email: trimmedAdminEmail,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // If user is logged in immediately (email confirm off)
      if (data.session && data.user) {
        const { role: assignedRole, schoolAdminId, adminEmail: resolvedAdminEmail } = await resolveUserRole(
          data.user.id,
          data.user.email || email,
          requestedRole,
          trimmedAdminEmail
        );

        const profile: UserProfile = {
          id: data.user.id,
          email: data.user.email || email,
          name: fullName || email.split('@')[0],
          role: assignedRole,
          schoolAdminId,
          adminEmail: resolvedAdminEmail,
        };

        db.setActiveUser(data.user.id, schoolAdminId);
        setUser(profile);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
        db.logActivity('INSERT', 'user_roles', profile.id, `Created account as ${assignedRole.toUpperCase()}`);
        await db.syncFromCloud();
        return {
          success: true,
          message: 'Account created and signed in successfully!',
        };
      }

      return {
        success: true,
        requiresEmailConfirmation: true,
        message: 'Account registered! A confirmation email has been sent. Please verify your email to sign in.',
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
      db.setActiveUser(null, null);
      db.clearAllData();
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
