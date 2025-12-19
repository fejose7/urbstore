
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Substitua pelas suas credenciais do projeto Supabase
const SUPABASE_URL = ''; // EX: 'https://xyz.supabase.co'
const SUPABASE_ANON_KEY = ''; // EX: 'eyJhbGciOiJIUzI1Ni...'

export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;

export const isSupabaseConfigured = () => !!supabase;
