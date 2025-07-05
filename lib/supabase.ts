import { createClient } from "@supabase/supabase-js"

// Use environment variables for Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

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
  address?: string
  image_url?: string
  ocr_text?: string
  extracted_address?: string
}
