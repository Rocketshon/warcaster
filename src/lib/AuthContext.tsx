// ---------------------------------------------------------------------------
// Auth Context — Supabase auth with localStorage bridge
// ---------------------------------------------------------------------------

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { saveUser, clearUser } from './storage';
import type { UserSession } from '../types';

interface AuthContextType {
  user: User | null;
  profile: { id: string; display_name: string } | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function fetchProfile(userId: string): Promise<{ id: string; display_name: string } | null> {
  const { data, error } = await supabase
    .from('cc_profiles')
    .select('id, display_name')
    .eq('id', userId)
    .single();
  if (error || !data) return null;
  return data as { id: string; display_name: string };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<{ id: string; display_name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Bridge auth state to localStorage UserSession
  const bridgeLogin = useCallback((u: User, p: { id: string; display_name: string } | null) => {
    const session: UserSession = {
      id: u.id,
      email: u.email ?? '',
      display_name: p?.display_name ?? u.user_metadata?.display_name ?? 'Battle-Brother',
    };
    saveUser(session);
  }, []);

  // Restore session on mount
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        setUser(session.user);
        const p = await fetchProfile(session.user.id);
        if (mounted) {
          setProfile(p);
          bridgeLogin(session.user, p);
        }
      }
      if (mounted) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        const p = await fetchProfile(u.id);
        if (mounted) {
          setProfile(p);
          bridgeLogin(u, p);
        }
      } else {
        setProfile(null);
        clearUser();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [bridgeLogin]);

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (error) throw error;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setProfile(null);
    clearUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
