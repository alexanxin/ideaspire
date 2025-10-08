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
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit')) || 10;
        const offset = parseInt(searchParams.get('offset')) || 0;

        // First get total count
        const { count: totalCount, error: countError } = await supabase
            .from('user_interactions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('interaction_type', 'reveal');

        if (countError) {
            console.error('Error counting revealed ideas:', countError);
            return NextResponse.json(
                { error: 'Failed to count revealed ideas' },
                { status: 500 }
            );
        }

        // Get revealed ideas with business_ideas join
        const { data: revealedInteractions, error: intError } = await supabase
            .from('user_interactions')
            .select(`
                id,
                created_at,
                business_ideas (
                    id,
                    title,
                    description,
                    category,
                    relevance_score,
                    source,
                    date
                )
            `)
            .eq('user_id', userId)
            .eq('interaction_type', 'reveal')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (intError) {
            console.error('Error fetching revealed ideas:', intError);
            return NextResponse.json(
                { error: 'Failed to fetch revealed ideas' },
                { status: 500 }
            );
        }

        // Transform the data to match the expected format
        const ideas = revealedInteractions.map(interaction => ({
            ...interaction.business_ideas,
            revealed_at: interaction.created_at
        }));

        const hasMore = totalCount > offset + limit;

        return NextResponse.json({
            ideas,
            total: totalCount,
            hasMore
        });

    } catch (error) {
        console.error('Revealed ideas GET error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
