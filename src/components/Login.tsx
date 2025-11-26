import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useAuth } from '../contexts/AuthContext';
import { EmailVerificationHelper } from './EmailVerificationHelper';
import { Loader2, Flower2 } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const { login, signup, isLoading } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Por favor completa todos los campos');
      return;
    }

    console.log('🔐 Intentando login...');
    const success = await login(email, password);
    if (!success) {
      setError('No se pudo iniciar sesión. Abre la consola (F12) para ver detalles.');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password || !username) {
      setError('Por favor completa todos los campos');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    const success = await signup(email, password, username);
    if (!success) {
      setError('Error al crear cuenta. El email puede estar ya registrado.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-purple-100 rounded-full mb-4"
          >
            <Flower2 className="w-10 h-10 text-purple-600" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900">HabitZen</h1>
          <p className="text-gray-600 mt-2">Construye hábitos con amigos</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Bienvenido</CardTitle>
            <CardDescription>
              Inicia sesión o crea una cuenta nueva
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
                <TabsTrigger value="signup">Registrarse</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Contraseña</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>

                  {error && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm text-destructive"
                    >
                      {error}
                    </motion.p>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Iniciando sesión...
                      </>
                    ) : (
                      'Iniciar Sesión'
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-username">Nombre de usuario</Label>
                    <Input
                      id="signup-username"
                      type="text"
                      placeholder="tu_usuario"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Contraseña</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                    />
                    <p className="text-xs text-gray-500">
                      Mínimo 6 caracteres
                    </p>
                  </div>

                  {error && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm text-destructive"
                    >
                      {error}
                    </motion.p>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creando cuenta...
                      </>
                    ) : (
                      'Crear Cuenta'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            
            {/* Help Section - Shows after login error */}
            {error && error.includes('iniciar sesión') && (
              <div className="mt-6 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                <h3 className="text-red-900 mb-3">🔴 LOGIN NO FUNCIONA</h3>
                
                <div className="bg-white p-3 rounded border border-red-200 mb-3">
                  <p className="text-red-800 text-sm mb-2">
                    <strong>Tu problema:</strong>
                  </p>
                  <ul className="text-red-700 text-sm space-y-1 ml-4">
                    <li>✅ Registro funciona (guarda en BD)</li>
                    <li>❌ Login NO funciona (no deja entrar)</li>
                  </ul>
                </div>
                
                <p className="text-red-900 text-sm mb-3">
                  <strong>Causa:</strong> Supabase requiere confirmación de email.
                </p>
                
                <div className="bg-green-50 border border-green-300 p-3 rounded">
                  <p className="text-green-900 text-sm mb-2"><strong>✅ SOLUCIÓN (2 pasos):</strong></p>
                  <ol className="text-green-800 text-sm space-y-2 ml-4 list-decimal">
                    <li>
                      <a 
                        href="https://supabase.com/dashboard/project/sxjnlaoumttaglgbcyww/auth/url-configuration" 
                        target="_blank"
                        className="underline font-medium"
                      >
                        Desactiva "Enable email confirmations"
                      </a> y guarda
                    </li>
                    <li>
                      <a 
                        href="https://supabase.com/dashboard/project/sxjnlaoumttaglgbcyww/sql/new" 
                        target="_blank"
                        className="underline font-medium"
                      >
                        Ejecuta este SQL
                      </a>:
                      <code className="block bg-gray-800 text-green-400 p-2 rounded text-xs mt-1 overflow-x-auto">
                        UPDATE auth.users SET email_confirmed_at = NOW(), confirmed_at = NOW() WHERE email_confirmed_at IS NULL;
                      </code>
                    </li>
                  </ol>
                </div>
                
                <p className="text-red-700 text-xs mt-3">
                  📖 Guía completa: Abre <code className="bg-red-100 px-1 py-0.5 rounded">PROBLEMA_LOGIN.md</code>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Email Verification Helper - Shows when there's login error */}
        {error && error.includes('iniciar sesión') && (
          <div className="mt-4">
            <EmailVerificationHelper />
          </div>
        )}
      </motion.div>
    </div>
  );
}