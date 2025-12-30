
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Credenciais fornecidas pelo usuário para o projeto Evangelho Prático
const SUPABASE_URL = 'https://tzxqhxlecfhgchromaxy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_98Y1vOUWTVBjJHsvulS9QQ_Au_KW9PZ';

export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;

export const isSupabaseConfigured = () => !!supabase;
