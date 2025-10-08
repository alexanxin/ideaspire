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

        // Fetch subscription tier, default to 'free'
        const { data, error } = await supabase
            .from('subscriptions')
            .select('tier')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
            console.error('Error fetching subscription:', error);
            return NextResponse.json(
                { error: 'Failed to fetch subscription' },
                { status: 500 }
            );
        }

        const tier = data ? data.tier : 'free';

        return NextResponse.json({
            tier
        });

    } catch (error) {
        console.error('Subscription GET error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

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
        const { tier } = body;

        if (!tier || !['free', 'basic', 'pro', 'enterprise'].includes(tier)) {
            return NextResponse.json(
                { error: 'Invalid tier' },
                { status: 400 }
            );
        }

        // Upsert subscription
        const subscriptionData = {
            user_id: userId,
            tier,
            mock_status: true
        };

        // Set start_date for paid tiers
        if (tier !== 'free') {
            subscriptionData.start_date = new Date().toISOString();
        }

        const { error } = await supabase
            .from('subscriptions')
            .upsert(subscriptionData);

        if (error) {
            console.error('Error updating subscription:', error);
            return NextResponse.json(
                { error: 'Failed to update subscription' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            tier
        });

    } catch (error) {
        console.error('Subscription POST error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}