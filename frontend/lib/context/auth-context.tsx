'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  switchPersona: (personaId: string) => Promise<void>;
  login: (email: string) => Promise<boolean>;
  logout: () => void;
  availablePersonas: { id: string; name: string; role: string; email: string; tier: string }[];
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [availablePersonas, setAvailablePersonas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize with persisted persona or default to 90-day coaching client Marcus Vance
  const loadSession = async () => {
    try {
      const storedId =
        typeof window !== 'undefined'
          ? localStorage.getItem('musclecraft_user_id') || localStorage.getItem('ironforge_user_id')
          : null;
      const res = await fetch(`/api/auth/session${storedId ? `?userId=${storedId}` : ''}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        setAvailablePersonas(data.availablePersonas || []);
      }
    } catch (err) {
      console.error('Failed to load session:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, []);

  const switchPersona = async (personaId: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personaId }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        if (typeof window !== 'undefined') {
          localStorage.setItem('musclecraft_user_id', data.user.id);
        }
      }
    } catch (err) {
      console.error('Failed to switch persona:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        if (typeof window !== 'undefined') {
          localStorage.setItem('musclecraft_user_id', data.user.id);
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('Login error:', err);
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('musclecraft_user_id');
      localStorage.removeItem('ironforge_user_id');
    }
  };

  const refreshUser = async () => {
    if (currentUser) {
      await switchPersona(currentUser.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        switchPersona,
        login,
        logout,
        availablePersonas,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
