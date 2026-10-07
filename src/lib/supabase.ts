import { createClient } from '@supabase/supabase-js';

const FALLBACK_URL = 'https://bjdjjnkqzkopfyqisspx.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqZGpqbmtxemtvcGZ5cWlzc3B4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyNzA5ODIsImV4cCI6MjEwNjg0Njk4Mn0.K6GeXcQA2QB6wk1teI8-UKuBuXyZrKePD0I2qHgW3I4';

const rawUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || '';
const rawKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || '';

const supabaseUrl = (rawUrl && !rawUrl.includes('your-project-ref')) ? rawUrl : FALLBACK_URL;
const supabaseAnonKey = (rawKey && !rawKey.includes('your-anon-key')) ? rawKey : FALLBACK_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://') &&
  supabaseAnonKey.length > 20
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
