import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient.js';
import { findSimilarIdea, calculateIdeaSimilarity } from '@/lib/similarityUtils.js';

export async function POST(request) {
    try {
        // Check for authorization header to secure the endpoint
        // For development, allow requests without auth if in development mode
        const authHeader = request.headers.get('authorization');
        const expectedToken = process.env.CRON_AUTH_TOKEN;
        const isDevelopment = process.env.NODE_ENV === 'development';

        if (!isDevelopment && (!expectedToken || !authHeader || authHeader !== `Bearer ${expectedToken}`)) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { threshold = 0.7, weights = { title: 0.6, description: 0.4 } } = body;

        // Validate input
        if (threshold < 0 || threshold > 1) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid threshold: must be between 0 and 1'
                },
                { status: 400 }
            );
        }

        // Check if Supabase is configured
        if (!isSupabaseConfigured()) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Supabase is not configured. Database functionality is disabled.'
                },
                { status: 500 }
            );
        }

        // Fetch all ideas from the database
        console.log('Fetching all ideas from database for similarity test...');
        const { data: allIdeas, error: fetchError } = await supabase
            .from('business_ideas')
            .select('id, title, description, category, created_at');

        if (fetchError) {
            console.error('Error fetching ideas for similarity test:', fetchError);
            return NextResponse.json(
                {
                    success: false,
                    error: fetchError.message
                },
                { status: 500 }
            );
        }

        console.log(`Fetched ${allIdeas.length} ideas for similarity test`);

        // Find similar pairs of ideas
        const similarPairs = [];
        const processed = new Set(); // To avoid duplicate pairs

        for (let i = 0; i < allIdeas.length; i++) {
            for (let j = i + 1; j < allIdeas.length; j++) {
                // Create a unique key to avoid processing the same pair twice
                const pairKey = i < j ? `${i}-${j}` : `${j}-${i}`;

                if (processed.has(pairKey)) continue;
                processed.add(pairKey);

                const similarity = calculateIdeaSimilarity(allIdeas[i], allIdeas[j], weights);

                if (similarity >= threshold) {
                    similarPairs.push({
                        idea1: allIdeas[i],
                        idea2: allIdeas[j],
                        similarity: similarity
                    });
                }
            }
        }

        // Sort similar pairs by similarity in descending order
        similarPairs.sort((a, b) => b.similarity - a.similarity);

        console.log(`Found ${similarPairs.length} similar pairs with threshold ${threshold}`);

        return NextResponse.json({
            success: true,
            threshold,
            weights,
            totalIdeas: allIdeas.length,
            similarPairsCount: similarPairs.length,
            similarPairs: similarPairs,
            message: `Found ${similarPairs.length} similar pairs among ${allIdeas.length} ideas with threshold ${threshold}`
        });

    } catch (error) {
        console.error('Error in test-similarity API:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to run similarity test'
            },
            { status: 500 }
        );
    }
}

export async function GET() {
    const isDevelopment = process.env.NODE_ENV === 'development';

    return NextResponse.json({
        message: 'Use POST method to run similarity test on database ideas',
        authorizationRequired: !isDevelopment,
        developmentMode: isDevelopment,
        usage: {
            endpoint: '/api/test-similarity',
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'authorization': isDevelopment ? '(Optional in development mode)' : 'Bearer {CRON_AUTH_TOKEN}'
            },
            body: {
                threshold: 'Similarity threshold (0-1, default 0.7)',
                weights: {
                    title: 'Weight for title similarity (default 0.6)',
                    description: 'Weight for description similarity (default 0.4)'
                }
            }
        }
    });
}