import { createClient } from '@supabase/supabase-js';

// These will be set in environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate that we have properly configured environment variables
const isProperlyConfigured = supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('your_supabase');

if (!isProperlyConfigured) {
    console.warn('Supabase environment variables are not properly configured. Database functionality will be disabled.');
}

// Create the Supabase client only if properly configured
export const supabase = isProperlyConfigured
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => {
    return supabase !== null;
};
