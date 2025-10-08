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

        // Get subscription
        const { data: subscription, error: subError } = await supabase
            .from('subscriptions')
            .select('tier, start_date')
            .eq('user_id', userId)
            .single();

        const tier = subscription?.tier || 'free';
        const startDate = subscription?.start_date;

        // Get today's date (YYYY-MM-DD)
        const today = new Date().toISOString().split('T')[0];
        const todayStart = new Date(today + 'T00:00:00.000Z');

        // Count spins and reveals today
        const { data: interactions, error: intError } = await supabase
            .from('user_interactions')
            .select('interaction_type')
            .eq('user_id', userId)
            .gte('created_at', todayStart.toISOString());

        if (intError) {
            console.error('Error fetching interactions:', intError);
            return NextResponse.json(
                { error: 'Failed to fetch interactions' },
                { status: 500 }
            );
        }

        const spinsUsed = interactions.filter(i => i.interaction_type === 'spin').length;
        const revealsUsed = interactions.filter(i => i.interaction_type === 'reveal').length;

        // Calculate limits
        let spinsLimit, revealsLimit;

        if (tier === 'free') {
            spinsLimit = 5;
            revealsLimit = 1;
        } else if (tier === 'basic') {
            spinsLimit = 10;
            // Check if within 7 days of start_date
            const isBoostPeriod = startDate && (new Date() - new Date(startDate)) < 7 * 24 * 60 * 60 * 1000;
            revealsLimit = isBoostPeriod ? 5 : 3;
        } else {
            // Pro and Enterprise: unlimited
            spinsLimit = -1; // -1 means unlimited
            revealsLimit = -1;
        }

        return NextResponse.json({
            spins: { used: spinsUsed, limit: spinsLimit },
            reveals: { used: revealsUsed, limit: revealsLimit },
            tier,
            isBoostPeriod: tier === 'basic' && startDate && (new Date() - new Date(startDate)) < 7 * 24 * 60 * 60 * 1000
        });

    } catch (error) {
        console.error('Limits GET error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}