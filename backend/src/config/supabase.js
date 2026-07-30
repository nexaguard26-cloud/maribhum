import { createClient } from '@supabase/supabase-js';
import { config } from './env.js';

// Admin client (service role - bypasses RLS)
export const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Regular client for authenticated requests
export const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey
);

export default supabase;
