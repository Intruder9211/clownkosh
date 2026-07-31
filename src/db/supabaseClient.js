import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env ? import.meta.env.VITE_SUPABASE_URL : undefined;
const supabaseAnonKey = import.meta.env ? import.meta.env.VITE_SUPABASE_ANON_KEY : undefined;

export const isCloudConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'YOUR_SUPABASE_URL' && 
  supabaseUrl.startsWith('http')
);

let client = null;
if (isCloudConfigured) {
  try {
    client = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
  }
}

export const supabase = client;
