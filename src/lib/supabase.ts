import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a mock client for when Supabase is not configured
const mockClient = {
  from: () => ({
    select: () => Promise.resolve({ data: [], error: null }),
    insert: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
    update: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
    eq: () => ({ data: [], error: null }),
    order: () => ({ data: [], error: null }),
    single: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } })
  })
};

export const supabase = (!supabaseUrl || !supabaseAnonKey) 
  ? mockClient as any
  : createClient(supabaseUrl, supabaseAnonKey);

// Log warning if not configured
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are not configured. Using mock client.');
}