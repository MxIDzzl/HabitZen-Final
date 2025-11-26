import React, { useState } from 'react';
import { supabase } from '../utils/supabase/client';
import { Button } from './ui/button';

export function DatabaseInspector() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const inspectHabits = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .limit(1);
      
      setResult({
        table: 'habits',
        error: error?.message || null,
        columns: data && data.length > 0 ? Object.keys(data[0]) : [],
        sample: data?.[0] || null
      });
    } catch (e: any) {
      setResult({ error: e.message });
    }
    setLoading(false);
  };

  const inspectCompletions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('habit_completions')
        .select('*')
        .limit(1);
      
      setResult({
        table: 'habit_completions',
        error: error?.message || null,
        columns: data && data.length > 0 ? Object.keys(data[0]) : [],
        sample: data?.[0] || null
      });
    } catch (e: any) {
      setResult({ error: e.message });
    }
    setLoading(false);
  };

  const testInsertHabit = async () => {
    setLoading(true);
    try {
      // Probar con diferentes combinaciones de columnas
      const testCases = [
        { title: 'Test 1', description: 'Test', category: 'health', user_id: '00000000-0000-0000-0000-000000000001' },
        { name: 'Test 2', description: 'Test', category: 'health', user_id: '00000000-0000-0000-0000-000000000001' },
        { title: 'Test 3', user_id: '00000000-0000-0000-0000-000000000001' },
      ];

      for (const testCase of testCases) {
        const { data, error } = await supabase
          .from('habits')
          .insert([testCase])
          .select();
        
        if (!error) {
          setResult({
            success: true,
            message: 'Insert funcionó con:',
            columns: Object.keys(testCase),
            inserted: data?.[0]
          });
          return;
        }
      }
      
      setResult({ error: 'Ningún formato funcionó' });
    } catch (e: any) {
      setResult({ error: e.message });
    }
    setLoading(false);
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-purple-500 rounded-lg p-4 shadow-xl max-w-md z-50">
      <h3 className="text-sm font-bold mb-2">🔍 Database Inspector</h3>
      
      <div className="flex gap-2 mb-3">
        <Button onClick={inspectHabits} disabled={loading} size="sm">
          Inspeccionar Habits
        </Button>
        <Button onClick={inspectCompletions} disabled={loading} size="sm">
          Inspeccionar Completions
        </Button>
        <Button onClick={testInsertHabit} disabled={loading} size="sm" variant="outline">
          Probar Insert
        </Button>
      </div>
      
      {result && (
        <div className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-96">
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
