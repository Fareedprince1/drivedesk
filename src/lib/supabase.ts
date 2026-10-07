import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 
  import.meta.env.VITE_SUPABASE_URL || 
  'https://bjdjjnkqzkopfyqisspx.supabase.co';

const supabaseAnonKey = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqZGpqbmtxemtvcGZ5cWlzc3B4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyNzA5ODIsImV4cCI6MjEwNjg0Njk4Mn0.K6GeXcQA2QB6wk1teI8-UKuBuXyZrKePD0I2qHgW3I4';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://') &&
  supabaseAnonKey.length > 20
);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;
