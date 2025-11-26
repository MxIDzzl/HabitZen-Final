import React, { useState } from 'react';
import { supabase } from '../utils/supabase/client';
import { Button } from './ui/button';
import { Card } from './ui/card';

export function DatabaseTest() {
  const [results, setResults] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);

  const addResult = (message: string) => {
    setResults(prev => [...prev, message]);
  };

  const testDatabase = async () => {
    setTesting(true);
    setResults([]);
    
    addResult('🔍 Iniciando pruebas de base de datos...');
    
    // Test 1: Check if tables exist
    addResult('\n📋 TEST 1: Verificar si existen las tablas');
    
    const tables = ['users', 'habits', 'habit_completions'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          if (error.message.includes('relation') && error.message.includes('does not exist')) {
            addResult(`❌ Tabla "${table}" NO existe`);
          } else {
            addResult(`⚠️ Tabla "${table}" error: ${error.message}`);
          }
        } else {
          addResult(`✅ Tabla "${table}" existe (${data?.length || 0} registros encontrados)`);
        }
      } catch (e) {
        addResult(`❌ Error verificando tabla "${table}": ${e}`);
      }
    }
    
    // Test 2: Check auth status
    addResult('\n🔐 TEST 2: Verificar autenticación');
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        addResult(`❌ Error obteniendo sesión: ${error.message}`);
      } else if (session) {
        addResult(`✅ Usuario autenticado: ${session.user.email}`);
        addResult(`   User ID: ${session.user.id}`);
        
        // Check if email is confirmed
        if (session.user.confirmed_at) {
          addResult(`✅ Email confirmado: ${new Date(session.user.confirmed_at).toLocaleString()}`);
        } else {
          addResult(`⚠️ Email NO confirmado - Esto puede causar problemas de login`);
        }
      } else {
        addResult(`⚠️ No hay sesión activa`);
      }
    } catch (e) {
      addResult(`❌ Error verificando auth: ${e}`);
    }
    
    // Test 3: Try to insert a test user (only if authenticated)
    addResult('\n💾 TEST 3: Intentar insertar datos de prueba');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        addResult('⚠️ Saltando test - No hay sesión activa');
      } else {
        // Try to query current user profile
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profileError) {
          addResult(`❌ Error consultando perfil: ${profileError.message}`);
        } else if (profile) {
          addResult(`✅ Perfil encontrado: ${profile.username}`);
        } else {
          addResult(`⚠️ Perfil no encontrado en la tabla users`);
        }
      }
    } catch (e) {
      addResult(`❌ Error en test de datos: ${e}`);
    }
    
    // Test 4: Check auth users count
    addResult('\n👥 TEST 4: Usuarios registrados');
    try {
      const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        addResult(`❌ Error contando usuarios: ${error.message}`);
      } else {
        addResult(`✅ Total de usuarios en la base de datos: ${count}`);
      }
    } catch (e) {
      addResult(`❌ Error: ${e}`);
    }
    
    // Test 5: Check if users are confirmed
    addResult('\n🔐 TEST 5: Estado de confirmación de usuarios');
    addResult('⚠️ ESTE ES EL PROBLEMA MÁS COMÚN:');
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('id, email, username');
      
      if (error) {
        addResult(`❌ Error: ${error.message}`);
      } else if (users && users.length > 0) {
        addResult(`\n📋 Usuarios en la tabla 'users': ${users.length}`);
        
        // Now check auth.users to see if they're confirmed
        // We can't query auth.users directly, but we can try to get session info
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session && session.user) {
          addResult(`\n🔍 Usuario actual: ${session.user.email}`);
          
          if (session.user.email_confirmed_at || session.user.confirmed_at) {
            addResult(`✅ Email CONFIRMADO: ${new Date(session.user.email_confirmed_at || session.user.confirmed_at).toLocaleString()}`);
          } else {
            addResult(`❌ Email NO CONFIRMADO`);
            addResult(`\n🔧 SOLUCIÓN:`);
            addResult(`1. Ve a: https://supabase.com/dashboard/project/sxjnlaoumttaglgbcyww/auth/url-configuration`);
            addResult(`2. Desactiva "Enable email confirmations"`);
            addResult(`3. Ve a: https://supabase.com/dashboard/project/sxjnlaoumttaglgbcyww/sql/new`);
            addResult(`4. Ejecuta: UPDATE auth.users SET email_confirmed_at = NOW(), confirmed_at = NOW() WHERE email_confirmed_at IS NULL;`);
          }
        } else {
          addResult(`⚠️ No hay sesión activa para verificar confirmación`);
          addResult(`\nPero probablemente el problema es que los usuarios NO están confirmados.`);
          addResult(`\n🔧 SOLUCIÓN:`);
          addResult(`1. Ve a: https://supabase.com/dashboard/project/sxjnlaoumttaglgbcyww/auth/url-configuration`);
          addResult(`2. Desactiva "Enable email confirmations"`);
          addResult(`3. Ve a: https://supabase.com/dashboard/project/sxjnlaoumttaglgbcyww/sql/new`);
          addResult(`4. Ejecuta: UPDATE auth.users SET email_confirmed_at = NOW(), confirmed_at = NOW() WHERE email_confirmed_at IS NULL;`);
        }
      } else {
        addResult(`⚠️ No hay usuarios en la tabla`);
      }
    } catch (e) {
      addResult(`❌ Error: ${e}`);
    }
    
    // Test 6: Check RLS policies
    addResult('\n🔒 TEST 6: Verificar políticas RLS');
    addResult('ℹ️ Si las tablas existen pero no puedes leer/escribir, el problema son las políticas RLS');
    
    setTesting(false);
    addResult('\n✅ Diagnóstico completado');
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto my-8">
      <h2 className="mb-4">🔧 Diagnóstico de Base de Datos</h2>
      
      <Button 
        onClick={testDatabase} 
        disabled={testing}
        className="mb-4"
      >
        {testing ? 'Probando...' : 'Ejecutar Diagnóstico'}
      </Button>
      
      {results.length > 0 && (
        <div className="bg-black text-green-400 p-4 rounded font-mono text-sm overflow-auto max-h-96">
          {results.map((result, i) => (
            <div key={i} className="whitespace-pre-wrap">{result}</div>
          ))}
        </div>
      )}
      
      {results.some(r => r.includes('NO existe')) && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
          <h3 className="text-red-800 mb-2">❌ PROBLEMA DETECTADO</h3>
          <p className="text-red-700 mb-2">
            Las tablas NO existen en Supabase. Necesitas ejecutar el script SQL.
          </p>
          <ol className="text-red-700 text-sm list-decimal ml-4 space-y-1">
            <li>Ve a: <a href="https://supabase.com/dashboard/project/sxjnlaoumttaglgbcyww/sql/new" target="_blank" className="underline">SQL Editor</a></li>
            <li>Abre el archivo <code className="bg-red-100 px-1">/EJECUTA_ESTO.md</code></li>
            <li>Copia el script SQL completo</li>
            <li>Pégalo en el editor y click en "RUN"</li>
            <li>Recarga esta página</li>
          </ol>
        </div>
      )}
    </Card>
  );
}