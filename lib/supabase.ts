import { createClient } from "@supabase/supabase-js"

// Use environment variables for Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

// Check if we have valid Supabase credentials
const hasValidCredentials = supabaseUrl && supabaseAnonKey && 
  supabaseUrl !== "https://your-project-id.supabase.co" &&
  supabaseAnonKey !== "your-supabase-anon-key"

if (!hasValidCredentials) {
  console.warn("Supabase credentials not configured. Database features will be disabled.")
}

// Create a mock client for development if credentials are not available
const mockClient = {
  from: () => ({
    select: () => ({ data: [], error: null }),
    insert: () => ({ data: [], error: null }),
    delete: () => ({ data: [], error: null }),
    eq: () => ({ data: [], error: null }),
    order: () => ({ data: [], error: null })
  })
}

export const supabase = hasValidCredentials 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : mockClient as any

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

export const isSupabaseConfigured = hasValidCredentials
