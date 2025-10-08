import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Server-side function to get user from Supabase session
export async function getUserFromSupabase() {
    try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    },
                },
            }
        );
        const { data: { session } } = await supabase.auth.getSession();
        return session?.user || null;
    } catch (error) {
        console.error('Error getting user from Supabase:', error);
        return null;
    }
}

// Server-side function to get user ID from Supabase session
export async function getUserIdFromSupabase() {
    const user = await getUserFromSupabase();
    return user?.id || null;
}