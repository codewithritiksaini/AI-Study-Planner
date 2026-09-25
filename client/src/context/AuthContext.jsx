import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/auth.js';
import { profileService } from '../services/profile.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetches current student profile from backend /api/profile
  const loadProfile = useCallback(async () => {
    try {
      const data = await profileService.getProfile();
      setProfile(data);
      return data;
    } catch (err) {
      console.warn('Could not load profile:', err.message || err);
      return null;
    }
  }, []);

  // Initialize session on application load
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const initialSession = await authService.getSession();
        if (isMounted) {
          setSession(initialSession);
          setUser(initialSession?.user || null);

          if (initialSession?.user) {
            await loadProfile();
          }
        }
      } catch (err) {
        console.error('Error restoring session:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen to Supabase auth events
    const { data: authListener } = authService.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;

      setSession(newSession);
      setUser(newSession?.user || null);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (newSession?.user) {
          await loadProfile();
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
        setProfile(null);
      }

      setLoading(false);
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe?.();
    };
  }, [loadProfile]);

  const signIn = async (credentials) => {
    const data = await authService.signIn(credentials);
    setUser(data.user);
    setSession(data.session);
    if (data.session) {
      await loadProfile();
    }
    return data;
  };

  const signUp = async (credentials) => {
    const data = await authService.signUp(credentials);
    if (data.session) {
      setUser(data.user);
      setSession(data.session);
      await loadProfile();
    }
    return data;
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    return await loadProfile();
  };

  const updateProfileState = (updatedProfile) => {
    setProfile(updatedProfile);
  };

  const value = {
    user,
    session,
    profile,
    loading,
    isAuthenticated: Boolean(user),
    signIn,
    signUp,
    signOut,
    refreshProfile,
    updateProfileState
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
