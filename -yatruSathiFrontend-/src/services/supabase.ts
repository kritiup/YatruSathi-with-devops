import { createClient } from '@supabase/supabase-js';

// Legacy realtime client. Application data lives in the backend's Postgres
// database, not here, so this is only active if the (optional) VITE_SUPABASE_*
// vars are set; otherwise the fallbacks keep createClient from throwing at
// import time and realtime is simply inert.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
