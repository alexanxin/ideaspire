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
            .eq('interaction_type', 'like');

        if (countError) {
            console.error('Error counting liked ideas:', countError);
            return NextResponse.json(
                { error: 'Failed to count liked ideas' },
                { status: 500 }
            );
        }

        // Fetch liked ideas with business_ideas joined
        const { data, error } = await supabase
            .from('user_interactions')
            .select(`
            idea_id,
            business_ideas (
              id,
              title,
              description,
              prompt,
              category,
              date,
              relevance_score,
              source,
              market_opportunity,
              target_audience,
              revenue_model,
              key_challenges,
              generated,
              created_at,
              updated_at
            )
          `)
            .eq('user_id', userId)
            .eq('interaction_type', 'like')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Error fetching liked ideas:', error);
            return NextResponse.json(
                { error: 'Failed to fetch liked ideas' },
                { status: 500 }
            );
        }

        // Transform the data to match the expected format
        const ideas = data.map(item => {
            const idea = item.business_ideas;
            if (!idea) return null;

            return {
                ...idea,
                marketOpportunity: idea.market_opportunity,
                targetAudience: idea.target_audience,
                revenueModel: idea.revenue_model,
                keyChallenges: idea.key_challenges,
                // Remove snake_case properties
                market_opportunity: undefined,
                target_audience: undefined,
                revenue_model: undefined,
                key_challenges: undefined
            };
        }).filter(Boolean); // Remove null entries


        const hasMore = totalCount > offset + limit;

        return NextResponse.json({
            success: true,
            ideas,
            total: totalCount,
            hasMore
        });

    } catch (error) {
        console.error('Profile liked ideas error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
