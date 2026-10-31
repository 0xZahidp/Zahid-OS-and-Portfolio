import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

/**
 * Browser-side Supabase client placeholder.
 * Safe for client components; uses public anonymous key.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
