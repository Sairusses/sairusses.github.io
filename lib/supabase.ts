import { createClient } from "@supabase/supabase-js"

const supabaseUrl = 'https://dmxviyeqeougohmdcytl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRteHZpeWVxZW91Z29obWRjeXRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyNjM1MTEsImV4cCI6MjA2MzgzOTUxMX0.li33IAxDynlThBJseuVbbAtiLu45nTt5ijlo-4233xs'

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
