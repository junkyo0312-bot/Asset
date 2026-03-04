import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ?? 'https://hfayxlevaexenzytzkjr.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'sb_publishable_wENVu11i-gZaEuEGmBM0-A_QZm7wRab';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Supabase 설정이 없습니다. .env에 VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY를 설정해 주세요.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);




