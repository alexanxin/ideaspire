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

        // Get the current session ID from cookies (server-side equivalent)
        const sessionCookie = cookieStore.get('ideaspireSessionId');
        if (!sessionCookie) {
            // No session to migrate
            return NextResponse.json({ success: true, migrated: 0 });
        }

        const sessionId = sessionCookie.value;

        // For backward compatibility: Find any existing session-based likes for this session
        // that may have been created before the change to user-id only storage
        const { data: sessionLikes, error: fetchError } = await supabase
            .from('user_interactions')
            .select('id, idea_id, metadata')
            .eq('session_id', sessionId)
            .eq('interaction_type', 'like');

        if (fetchError) {
            console.error('Error fetching session likes:', fetchError);
            return NextResponse.json(
                { error: 'Failed to fetch session likes' },
                { status: 500 }
            );
        }

        if (!sessionLikes || sessionLikes.length === 0) {
            // No session likes to update
            return NextResponse.json({ success: true, migrated: 0 });
        }

        // Update these interactions to be associated with the user (for backward compatibility)
        const { error: updateError } = await supabase
            .from('user_interactions')
            .update({ user_id: userId })
            .eq('session_id', sessionId)
            .eq('interaction_type', 'like');

        if (updateError) {
            console.error('Error migrating session likes:', updateError);
            return NextResponse.json(
                { error: 'Failed to migrate session likes' },
                { status: 500 }
            );
        }

        console.log(`Migrated ${sessionLikes.length} session likes to user account`);

        return NextResponse.json({
            success: true,
            migrated: sessionLikes.length
        });

    } catch (error) {
        console.error('Migrate likes error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}