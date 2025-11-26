import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

// Crear la URL de Supabase a partir del projectId
const supabaseUrl = `https://${projectId}.supabase.co`;

// Crear cliente de Supabase para el frontend
export const supabase = createClient(supabaseUrl, publicAnonKey);
