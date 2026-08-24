import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-supabase-project')) {
    throw new Error(
      'Missing or unconfigured Supabase credentials. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.'
    );
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}
