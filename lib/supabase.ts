import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// For server components
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Client-side singleton to prevent multiple instances
let clientSideSupabase: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (typeof window === "undefined") {
    // Server-side - create a new client each time
    return createClient(supabaseUrl, supabaseAnonKey)
  }

  // Client-side - use singleton pattern
  if (!clientSideSupabase) {
    clientSideSupabase = createClient(supabaseUrl, supabaseAnonKey)
  }

  return clientSideSupabase
}
