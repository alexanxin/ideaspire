import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request) {
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

        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const userId = user.id;

        // Get interaction counts
        const { data: interactions, error: intError } = await supabase
            .from('user_interactions')
            .select('interaction_type')
            .eq('user_id', userId);

        if (intError) {
            console.error('Error fetching user interactions:', intError);
            return NextResponse.json(
                { error: 'Failed to fetch user stats' },
                { status: 500 }
            );
        }

        const stats = {
            totalSpins: interactions.filter(i => i.interaction_type === 'spin').length,
            totalReveals: interactions.filter(i => i.interaction_type === 'reveal').length,
            totalLikes: interactions.filter(i => i.interaction_type === 'like').length,
            joinDate: user.created_at
        };

        return NextResponse.json(stats);

    } catch (error) {
        console.error('User stats GET error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}