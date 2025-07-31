import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type UserProgress = {
  id?: string
  user_id: string
  total_points: number
  achievements: string[]
  completed_sessions: number
  username: string
  created_at?: string
  updated_at?: string
}