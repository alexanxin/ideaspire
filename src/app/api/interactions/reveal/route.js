import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request) {
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
        const body = await request.json();
        const { ideaId } = body;

        if (!ideaId) {
            return NextResponse.json(
                { error: 'ideaId is required' },
                { status: 400 }
            );
        }

        // Check if user has already revealed this idea today to prevent multiple reveals
        const today = new Date().toISOString().split('T')[0];
        const { data: existingReveal, error: revealCheckError } = await supabase
            .from('user_interactions')
            .select('id')
            .eq('user_id', userId)
            .eq('idea_id', ideaId)
            .eq('interaction_type', 'reveal')
            .gte('created_at', `${today}T00:00:00.000Z`)
            .lt('created_at', `${today}T23:59:59.999Z`)
            .limit(1);

        if (revealCheckError) {
            console.error('Error checking for existing reveal:', revealCheckError);
            return NextResponse.json(
                { error: 'Failed to check existing reveal' },
                { status: 500 }
            );
        }

        // Only proceed with insert if no reveal exists for this idea today
        if (existingReveal && existingReveal.length > 0) {
            return NextResponse.json({
                success: true,
                message: 'Reveal already recorded for this idea today',
                data: existingReveal[0]
            });
        }

        // Insert reveal interaction
        const { data, error } = await supabase
            .from('user_interactions')
            .insert([
                {
                    idea_id: ideaId,
                    interaction_type: 'reveal',
                    user_id: userId,
                    metadata: {
                        timestamp: new Date().toISOString()
                    }
                }
            ])
            .select();

        if (error) {
            console.error('Error recording reveal interaction:', error);
            return NextResponse.json(
                { error: 'Failed to record reveal' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data
        });

    } catch (error) {
        console.error('Reveal POST error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}