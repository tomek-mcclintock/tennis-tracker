// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false, // We don't want to persist the Supabase session
    autoRefreshToken: false,
  },
  global: {
    headers: {
      'x-app-auth': 'clerk', // Custom header to identify Clerk auth
    },
  },
});