import { createClient } from "@supabase/supabase-js"

// Replace with your actual Supabase project URL and anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "your-anon-key"

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL and ANON key must be provided.")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Scan {
  id: string
  barcode_value: string
  scanned_at: string
  user_id?: string
}
