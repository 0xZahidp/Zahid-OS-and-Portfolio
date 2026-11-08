import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key';

let cachedServerClient: SupabaseClient | null = null;

/**
 * Server-side Supabase client singleton.
 * Strictly for Server Components, Route Handlers, and Server Actions.
 * Never expose this client or the service role key to browser code.
 */
export const supabaseServer = (): SupabaseClient => {
  if (!cachedServerClient) {
    cachedServerClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return cachedServerClient;
};

