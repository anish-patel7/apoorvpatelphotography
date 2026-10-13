import { useState, useEffect, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface AdminUser {
  id: string;
  email: string;
  full_name?: string;
  role: 'admin' | 'super_admin';
  is_active: boolean;
}

/**
 * Production-Grade Supabase Authentication Hook
 * - Connects to Supabase Auth (signInWithPassword, signOut, onAuthStateChange)
 * - Verifies user role and active status in public.admin_profiles
 * - Eliminates all client-side password comparisons and mock storage flags
 */
export function useAuth() {
  const isDev = import.meta.env.DEV;

  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Helper to verify admin profile in public.admin_profiles table
  const verifyAdminProfile = useCallback(async (userId: string, email?: string): Promise<AdminUser | null> => {
    if (!isSupabaseConfigured) return null;

    try {
      const { data, error } = await (supabase
        .from('admin_profiles') as any)
        .select('id, email, full_name, role, is_active')
        .eq('id', userId)
        .single();

      if (error || !data) {
        console.warn('Admin profile check failed:', error?.message);
        return null;
      }

      const adminData = data as AdminUser;
      if (!adminData.is_active || (adminData.role !== 'admin' && adminData.role !== 'super_admin')) {
        console.warn('Account is inactive or not assigned an administrator role.');
        return null;
      }

      if (email && adminData.email && adminData.email.toLowerCase() !== email.toLowerCase()) {
        console.warn('Admin email mismatch.');
        return null;
      }

      return adminData;
    } catch (err) {
      console.error('Error verifying admin authorization:', err);
      return null;
    }
  }, []);

  // Initialize session and listen for auth state changes
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }

      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('Session retrieval notice:', error.message);
        }

        if (initialSession && mounted) {
          const profile = await verifyAdminProfile(initialSession.user.id, initialSession.user.email || '');
          if (profile) {
            setSession(initialSession);
            setUser(initialSession.user);
            setAdminProfile(profile);
            setIsAuthenticated(true);
          } else {
            // User is authenticated in Supabase but not authorized in admin_profiles
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            setAdminProfile(null);
            setIsAuthenticated(false);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    // Listen to Supabase auth events (signed in, signed out, token refreshed)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT' || !newSession) {
        setSession(null);
        setUser(null);
        setAdminProfile(null);
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      if (newSession && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        const profile = await verifyAdminProfile(newSession.user.id, newSession.user.email || '');
        if (profile) {
          setSession(newSession);
          setUser(newSession.user);
          setAdminProfile(profile);
          setIsAuthenticated(true);
        } else {
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setAdminProfile(null);
          setIsAuthenticated(false);
        }
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [verifyAdminProfile]);

  // Sign In action with credentials validation
  const signIn = useCallback(async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      const trimmedEmail = email.trim().toLowerCase();

      // If Supabase is configured: authenticate with Supabase Auth
      if (isSupabaseConfigured) {
        if (!trimmedEmail || !password) {
          throw new Error('Please enter both your administrator email and password.');
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });

        if (error) {
          throw new Error(error.message || 'Invalid credentials. Please verify your email and password.');
        }

        if (!data.user) {
          throw new Error('Login failed: user profile not returned by server.');
        }

        // Verify active role in public.admin_profiles
        const profile = await verifyAdminProfile(data.user.id, data.user.email || trimmedEmail);
        if (!profile) {
          await supabase.auth.signOut();
          throw new Error('Access denied. This account has not been authorized as an active studio administrator.');
        }

        setSession(data.session);
        setUser(data.user);
        setAdminProfile(profile);
        setIsAuthenticated(true);
        return;
      }

      // Safe Local Development Fallback when Supabase is not yet connected
      if (isDev) {
        if (trimmedEmail) {
          const devMockUser = {
            id: 'dev-local-user',
            email: trimmedEmail,
            full_name: 'Developer (Local Preview)',
            role: 'admin' as const,
            is_active: true,
          };
          setUser({ id: 'dev-local-user', email: trimmedEmail } as unknown as User);
          setAdminProfile(devMockUser);
          setIsAuthenticated(true);
          return;
        }
        throw new Error('Please enter a developer email to enter local preview mode.');
      }

      throw new Error('Production authentication backend is not configured. Please verify your Supabase environment variables.');
    } finally {
      setLoading(false);
    }
  }, [isDev, verifyAdminProfile]);

  // Sign Out action
  const signOut = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
      setSession(null);
      setUser(null);
      setAdminProfile(null);
      setIsAuthenticated(false);
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    session,
    user,
    adminProfile,
    isAuthenticated,
    isSupabaseConfigured,
    loading,
    signIn,
    signOut,
  };
}
