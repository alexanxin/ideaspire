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
        const limit = parseInt(searchParams.get('limit')) || 20;
        const offset = parseInt(searchParams.get('offset')) || 0;

        // First get total count
        const { count: totalCount, error: countError } = await supabase
            .from('user_interactions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        if (countError) {
            console.error('Error counting user interactions:', countError);
            return NextResponse.json(
                { error: 'Failed to count user interactions' },
                { status: 500 }
            );
        }

        // Fetch user interactions with business_ideas joined
        const { data, error } = await supabase
            .from('user_interactions')
            .select(`
                id,
                idea_id,
                interaction_type,
                metadata,
                created_at,
                business_ideas (
                    id,
                    title,
                    category
                )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Error fetching user interactions:', error);
            return NextResponse.json(
                { error: 'Failed to fetch user interactions' },
                { status: 500 }
            );
        }

        // Transform the data to match the expected format for the activity log
        const activityLog = data.map(item => {
            let activityTitle = '';
            let activityDescription = '';

            // Format the interaction type for display
            const formattedType = item.interaction_type.charAt(0).toUpperCase() + item.interaction_type.slice(1);

            // Set activity title and description based on interaction type
            switch (item.interaction_type) {
                case 'spin':
                    activityTitle = 'New Idea Generated';
                    activityDescription = 'You spun the wheel and generated a new business idea';
                    break;
                case 'reveal':
                    activityTitle = 'Idea Revealed';
                    if (item.business_ideas) {
                        activityDescription = `You revealed the idea: ${item.business_ideas.title}`;
                    } else {
                        activityDescription = 'You revealed a business idea';
                    }
                    break;
                case 'like':
                    activityTitle = 'Idea Liked';
                    if (item.business_ideas) {
                        activityDescription = `You liked the idea: ${item.business_ideas.title}`;
                    } else {
                        activityDescription = 'You liked a business idea';
                    }
                    break;
                case 'copy':
                    activityTitle = 'Idea Copied';
                    if (item.business_ideas) {
                        activityDescription = `You copied the idea: ${item.business_ideas.title}`;
                    } else {
                        activityDescription = 'You copied a business idea';
                    }
                    break;
                case 'view':
                    activityTitle = 'Idea Viewed';
                    if (item.business_ideas) {
                        activityDescription = `You viewed the idea: ${item.business_ideas.title}`;
                    } else {
                        activityDescription = 'You viewed a business idea';
                    }
                    break;
                case 'share':
                    activityTitle = 'Idea Shared';
                    if (item.business_ideas) {
                        activityDescription = `You shared the idea: ${item.business_ideas.title}`;
                    } else {
                        activityDescription = 'You shared a business idea';
                    }
                    break;
                default:
                    activityTitle = `${formattedType} Activity`;
                    activityDescription = `You performed a ${item.interaction_type} action`;
            }

            return {
                id: item.id,
                ideaId: item.idea_id,
                interactionType: item.interaction_type,
                activityTitle,
                activityDescription,
                ideaTitle: item.business_ideas?.title || null,
                ideaCategory: item.business_ideas?.category || null,
                metadata: item.metadata,
                timestamp: item.created_at,
                formattedDate: new Date(item.created_at).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })
            };
        });

        const hasMore = totalCount > offset + limit;

        return NextResponse.json({
            success: true,
            activityLog,
            total: totalCount,
            hasMore
        });

    } catch (error) {
        console.error('Profile activity log error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
