import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hfayxlevaexenzytzkjr.supabase.co';
const supabaseAnonKey = 'sb_publishable_wENVu11i-gZaEuEGmBM0-A_QZm7wRab';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);



