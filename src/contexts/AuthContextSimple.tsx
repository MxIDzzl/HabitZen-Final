import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, username: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session check error:', error);
        setIsLoading(false);
        return;
      }

      if (session) {
        setAccessToken(session.access_token);
        // Get user profile from database
        await loadUserProfile(session.user.id, session.access_token);
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserProfile = async (userId: string, token: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      if (profile) {
        setUser({
          id: profile.id,
          username: profile.username,
          email: profile.email,
          avatar: profile.avatar,
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const signup = async (email: string, password: string, username: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username
          }
        }
      });

      if (authError) {
        console.error('Auth signup error:', authError);
        alert(`Error de registro: ${authError.message}`);
        setIsLoading(false);
        return false;
      }

      if (!authData.user) {
        console.error('No user returned from signup');
        alert('Error: No se pudo crear el usuario');
        setIsLoading(false);
        return false;
      }

      // 2. Create user profile in users table
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          username: username,
          email: email,
          avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop&crop=face`
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        alert(`Error al crear perfil: ${profileError.message}`);
        setIsLoading(false);
        return false;
      }

      // 3. Sign in automatically
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError || !signInData.session) {
        console.error('Auto sign-in error:', signInError);
        alert('Cuenta creada, pero hubo un error al iniciar sesión. Intenta iniciar sesión manualmente.');
        setIsLoading(false);
        return false;
      }

      // 4. Set user state
      setAccessToken(signInData.session.access_token);
      setUser({
        id: authData.user.id,
        username: username,
        email: email,
        avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop&crop=face`,
      });

      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      alert(`Error inesperado: ${error}`);
      setIsLoading(false);
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        alert(`Error de inicio de sesión: ${error.message}`);
        setIsLoading(false);
        return false;
      }

      if (data.session) {
        setAccessToken(data.session.access_token);
        
        // Get user profile
        await loadUserProfile(data.user.id, data.session.access_token);
        
        setIsLoading(false);
        return true;
      }

      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Login error:', error);
      alert(`Error inesperado: ${error}`);
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAccessToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, login, signup, logout, isLoading }}>
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
