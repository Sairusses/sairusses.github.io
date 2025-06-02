import { createClient } from "@supabase/supabase-js"

const supabaseUrl = 'https://dmxviyeqeougohmdcytl.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRteHZpeWVxZW91Z29obWRjeXRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODI2MzUxMSwiZXhwIjoyMDYzODM5NTExfQ.Qd7sFtRLpl2oVgRcjzhxs1KZxLYcIcfvfdL0g3PPx7s'

export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey)
