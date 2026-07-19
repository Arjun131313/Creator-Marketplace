import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Browser client — use in 'use client' components; respects RLS via anon key
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Server admin client — use in Route Handlers and Server Actions only.
// Bypasses RLS via the service role key; never expose to the browser.
export function createAdminClient() {
  return createClient<Database>(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

