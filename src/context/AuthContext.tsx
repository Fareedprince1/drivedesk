import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserRole, UserProfile } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { db } from '../lib/storage';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  login: (email: string, password?: string, roleOverride?: UserRole) => Promise<boolean>;
  logout: () => void;
  switchRole: (newRole: UserRole) => void;
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
    // Default logged in as admin for immediate ease of testing
    return {
      id: 'usr-admin-1',
      email: 'owner@drivedesk.in',
      name: 'Vikram Mehta (Owner)',
      role: 'admin',
    };
  });

  const role: UserRole = user?.role || 'staff';
  const isAuthenticated = Boolean(user);
  const isAdmin = role === 'admin';
  const isStaff = role === 'staff';

  const login = async (email: string, password = '', roleOverride?: UserRole): Promise<boolean> => {
    if (isSupabaseConfigured && supabase && !roleOverride) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
          // Fetch role from separate user_roles table
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', data.user.id)
            .single();

          const assignedRole: UserRole = roleData?.role || 'staff';
          const newUser: UserProfile = {
            id: data.user.id,
            email: data.user.email || email,
            name: data.user.user_metadata?.full_name || email.split('@')[0],
            role: assignedRole,
          };
          setUser(newUser);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
          return true;
        }
      } catch (err) {
        console.warn('Supabase auth failed, falling back to local auth simulation', err);
      }
    }

    // Local authentication & fast demo simulation
    const determinedRole: UserRole = roleOverride || (email.includes('admin') || email.includes('owner') ? 'admin' : 'staff');
    const newUser: UserProfile = {
      id: determinedRole === 'admin' ? 'usr-admin-1' : 'usr-staff-1',
      email,
      name: determinedRole === 'admin' ? 'Vikram Mehta (Owner)' : 'Pooja Nair (Receptionist)',
      role: determinedRole,
    };
    setUser(newUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
    db.logActivity('INSERT', 'user_roles', newUser.id, `User logged in as ${determinedRole.toUpperCase()}`, undefined, undefined, determinedRole);
    return true;
  };

  const logout = () => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.signOut().catch(console.error);
    }
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const switchRole = (newRole: UserRole) => {
    if (!user) return;
    const updated: UserProfile = {
      ...user,
      role: newRole,
      name: newRole === 'admin' ? 'Vikram Mehta (Owner)' : 'Pooja Nair (Receptionist)',
      email: newRole === 'admin' ? 'owner@drivedesk.in' : 'reception@drivedesk.in',
    };
    setUser(updated);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
    db.logActivity('UPDATE', 'user_roles', user.id, `Switched role to ${newRole.toUpperCase()}`, undefined, undefined, newRole);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        isAdmin,
        isStaff,
        login,
        logout,
        switchRole,
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
