
// Este arquivo está pronto para receber sua integração com o Supabase.
// Substitua as constantes abaixo pelas suas credenciais do painel do Supabase.

// import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://seu-projeto.supabase.co';
const SUPABASE_ANON_KEY = 'sua-chave-anon-aqui';

// export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const isSupabaseConfigured = () => {
  return SUPABASE_URL !== 'https://seu-projeto.supabase.co';
};
