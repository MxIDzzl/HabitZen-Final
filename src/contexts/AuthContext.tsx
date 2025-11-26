import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, username: string) => Promise<boolean>;
  logout: () => void;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
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
      // Verificar localStorage para sesión persistente
      const savedUser = localStorage.getItem('habitizen_user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setAccessToken('token-' + userData.id);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error checking session:', error);
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
      console.log('📝 Registrando usuario:', { email, username });
      
      // 1. Verificar si el email ya existe
      const { data: existing, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existing) {
        alert('❌ Este email ya está registrado. Por favor inicia sesión.');
        setIsLoading(false);
        return false;
      }

      // 2. Crear usuario directamente en la tabla users
      const newUser = {
        username: username,
        email: email,
        password: password, // ⚠️ Simple, sin hash (proyecto personal)
        avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop&crop=face`,
        current_streak: 0,
        is_online: true
      };

      const { data: createdUser, error: insertError } = await supabase
        .from('users')
        .insert([newUser])
        .select()
        .single();

      if (insertError) {
        console.error('❌ Error creando usuario:', insertError);
        
        if (insertError.code === '42501' || insertError.message.includes('row-level security')) {
          alert(
            '❌ ERROR DE SEGURIDAD (RLS)\n\n' +
            'La tabla "users" tiene RLS activado.\n\n' +
            '🔧 SOLUCIÓN:\n' +
            '1. Abre: https://supabase.com/dashboard/project/sxjnlaoumttaglgbcyww/sql/new\n' +
            '2. Ejecuta: ALTER TABLE users DISABLE ROW LEVEL SECURITY;\n' +
            '3. Vuelve a registrarte'
          );
        } else {
          alert(`❌ Error al crear usuario: ${insertError.message}`);
        }
        
        setIsLoading(false);
        return false;
      }

      console.log('✅ Usuario creado:', createdUser);

      // 3. Guardar sesión
      const userSession: User = {
        id: createdUser.id,
        username: createdUser.username,
        email: createdUser.email,
        avatar: createdUser.avatar
      };

      localStorage.setItem('habitizen_user', JSON.stringify(userSession));
      setUser(userSession);
      setAccessToken('token-' + createdUser.id);

      setIsLoading(false);
      alert('✅ ¡Cuenta creada exitosamente!');
      return true;
    } catch (error) {
      console.error('Error signup:', error);
      alert(`Error inesperado: ${error}`);
      setIsLoading(false);
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      console.log('🔐 Intentando login con:', email);
      
      // Buscar usuario en la tabla users
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password', password) // Comparación simple
        .single();

      if (error || !user) {
        console.error('❌ Login error:', error);
        alert('❌ Email o contraseña incorrectos.');
        setIsLoading(false);
        return false;
      }

      console.log('✅ Login exitoso:', user.email);

      // Actualizar estado online
      await supabase
        .from('users')
        .update({ is_online: true })
        .eq('id', user.id);

      // Guardar sesión
      const userSession: User = {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar
      };

      localStorage.setItem('habitizen_user', JSON.stringify(userSession));
      setUser(userSession);
      setAccessToken('token-' + user.id);

      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('❌ Login exception:', error);
      alert(`Error inesperado: ${error}`);
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    if (user) {
      // Actualizar estado online
      await supabase
        .from('users')
        .update({ is_online: false })
        .eq('id', user.id);
    }
    
    localStorage.removeItem('habitizen_user');
    setUser(null);
    setAccessToken(null);
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    if (!user) {
      throw new Error('User not logged in');
    }

    // Actualizar en la base de datos
    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id);

    if (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }

    // Actualizar estado local
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('habitizen_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, login, signup, logout, updateUserProfile, isLoading }}>
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