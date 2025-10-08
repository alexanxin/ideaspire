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
        const { category } = body;

        if (!category) {
            return NextResponse.json(
                { error: 'category is required' },
                { status: 400 }
            );
        }

        // Insert spin interaction
        const { data, error } = await supabase
            .from('user_interactions')
            .insert([
                {
                    interaction_type: 'spin',
                    user_id: userId,
                    metadata: {
                        categories: category,
                        timestamp: new Date().toISOString()
                    }
                }
            ])
            .select();

        if (error) {
            console.error('Error recording spin interaction:', error);
            return NextResponse.json(
                { error: 'Failed to record spin' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data
        });

    } catch (error) {
        console.error('Spin POST error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}