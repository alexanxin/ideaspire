import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient.js';
import { calculateIdeaSimilarity } from '@/lib/similarityUtils.js';

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
        const { threshold = 0.7, weights = { title: 0.6, description: 0.4 }, removeStrategy = 'keep-newer', specificPair = null } = body;

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

        if (!['keep-newer', 'keep-older', 'keep-both', 'keep-neither'].includes(removeStrategy)) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid removeStrategy: must be one of keep-newer, keep-older, keep-both, keep-neither'
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

        let removedCount = 0;
        let removedIds = [];

        if (specificPair) {
            // Remove specific pair of ideas
            const { idea1Id, idea2Id } = specificPair;

            // Fetch the specific ideas to determine which to keep/remove based on strategy
            const { data: ideas, error: fetchError } = await supabase
                .from('business_ideas')
                .select('id, created_at')
                .in('id', [idea1Id, idea2Id]);

            if (fetchError) {
                console.error('Error fetching specific ideas for duplicate removal:', fetchError);
                return NextResponse.json(
                    {
                        success: false,
                        error: fetchError.message
                    },
                    { status: 500 }
                );
            }

            if (ideas.length < 2) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'One or both ideas not found in database'
                    },
                    { status: 400 }
                );
            }

            // Find the specific ideas
            const idea1 = ideas.find(idea => idea.id === idea1Id);
            const idea2 = ideas.find(idea => idea.id === idea2Id);

            if (!idea1 || !idea2) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Could not find both ideas in database'
                    },
                    { status: 400 }
                );
            }

            // Determine which idea is newer/older based on created_at
            const idea1Date = new Date(idea1.created_at);
            const idea2Date = new Date(idea2.created_at);

            let idsToRemove = [];
            if (removeStrategy === 'keep-newer') {
                // Keep newer, remove older
                idsToRemove = idea1Date > idea2Date ? [idea2Id] : [idea1Id];
            } else if (removeStrategy === 'keep-older') {
                // Keep older, remove newer
                idsToRemove = idea1Date > idea2Date ? [idea1Id] : [idea2Id];
            } else if (removeStrategy === 'keep-both') {
                // Keep both, remove none
                idsToRemove = [];
            } else if (removeStrategy === 'keep-neither') {
                // Remove both
                idsToRemove = [idea1Id, idea2Id];
            }

            // Remove the identified ideas
            if (idsToRemove.length > 0) {
                console.log(`Removing ${idsToRemove.length} specific ideas...`);

                const { error: deleteError } = await supabase
                    .from('business_ideas')
                    .delete()
                    .in('id', idsToRemove);

                if (deleteError) {
                    console.error('Error removing specific duplicates:', deleteError);
                    return NextResponse.json(
                        {
                            success: false,
                            error: deleteError.message
                        },
                        { status: 500 }
                    );
                }

                removedCount = idsToRemove.length;
                removedIds = idsToRemove;
            }

            console.log(`Successfully removed ${removedCount} specific duplicate ideas`);
        } else {
            // Remove all duplicates based on similarity threshold
            // Fetch all ideas from the database
            console.log('Fetching all ideas from database for duplicate removal...');
            const { data: allIdeas, error: fetchError } = await supabase
                .from('business_ideas')
                .select('id, title, description, category, created_at')
                .order('created_at', { ascending: true }); // Order by creation date for consistent processing

            if (fetchError) {
                console.error('Error fetching ideas for duplicate removal:', fetchError);
                return NextResponse.json(
                    {
                        success: false,
                        error: fetchError.message
                    },
                    { status: 500 }
                );
            }

            console.log(`Fetched ${allIdeas.length} ideas for duplicate removal`);

            // Identify duplicate pairs
            const duplicatePairs = [];
            const processed = new Set(); // To avoid duplicate pairs

            for (let i = 0; i < allIdeas.length; i++) {
                for (let j = i + 1; j < allIdeas.length; j++) {
                    // Create a unique key to avoid processing the same pair twice
                    const pairKey = i < j ? `${i}-${j}` : `${j}-${i}`;

                    if (processed.has(pairKey)) continue;
                    processed.add(pairKey);

                    const similarity = calculateIdeaSimilarity(allIdeas[i], allIdeas[j], weights);

                    if (similarity >= threshold) {
                        duplicatePairs.push({
                            idea1: allIdeas[i],
                            idea2: allIdeas[j],
                            similarity: similarity
                        });
                    }
                }
            }

            // Determine which IDs to remove based on the strategy
            const idsToRemove = new Set();
            const keptDuplicates = [];

            for (const pair of duplicatePairs) {
                let toRemove = null;
                let toKeep = null;

                // Determine which idea is newer/older based on created_at
                const idea1Date = new Date(pair.idea1.created_at);
                const idea2Date = new Date(pair.idea2.created_at);

                if (idea1Date > idea2Date) {
                    // idea1 is newer
                    if (removeStrategy === 'keep-newer') {
                        toRemove = pair.idea2.id;
                        toKeep = pair.idea1.id;
                    } else if (removeStrategy === 'keep-older') {
                        toRemove = pair.idea1.id;
                        toKeep = pair.idea2.id;
                    } else if (removeStrategy === 'keep-both') {
                        toKeep = pair.idea1.id;
                        toKeep = pair.idea2.id; // Both kept, so don't remove either
                        continue;
                    } else if (removeStrategy === 'keep-neither') {
                        toRemove = pair.idea1.id;
                        toRemove = pair.idea2.id; // Both removed
                    }
                } else {
                    // idea2 is newer or same date
                    if (removeStrategy === 'keep-newer') {
                        toRemove = pair.idea1.id;
                        toKeep = pair.idea2.id;
                    } else if (removeStrategy === 'keep-older') {
                        toRemove = pair.idea2.id;
                        toKeep = pair.idea1.id;
                    } else if (removeStrategy === 'keep-both') {
                        toKeep = pair.idea1.id;
                        toKeep = pair.idea2.id; // Both kept, so don't remove either
                        continue;
                    } else if (removeStrategy === 'keep-neither') {
                        toRemove = pair.idea1.id;
                        toRemove = pair.idea2.id; // Both removed
                    }
                }

                // Handle the multiple assignments correctly
                if (removeStrategy === 'keep-neither') {
                    idsToRemove.add(pair.idea1.id);
                    idsToRemove.add(pair.idea2.id);
                } else if (removeStrategy !== 'keep-both') {
                    idsToRemove.add(toRemove);
                    keptDuplicates.push({
                        kept: toKeep,
                        removed: toRemove,
                        similarity: pair.similarity
                    });
                }
            }

            // Remove the identified duplicates
            if (idsToRemove.size > 0) {
                const idsArray = Array.from(idsToRemove);
                console.log(`Removing ${idsArray.length} duplicate ideas...`);

                const { error: deleteError } = await supabase
                    .from('business_ideas')
                    .delete()
                    .in('id', idsArray);

                if (deleteError) {
                    console.error('Error removing duplicates:', deleteError);
                    return NextResponse.json(
                        {
                            success: false,
                            error: deleteError.message
                        },
                        { status: 500 }
                    );
                }

                removedCount = idsArray.length;
                removedIds = idsArray;
            }

            console.log(`Successfully removed ${removedCount} duplicate ideas`);
        }

        return NextResponse.json({
            success: true,
            threshold,
            weights,
            removeStrategy,
            specificPair,
            removedCount,
            removedIds,
            message: `Successfully removed ${removedCount} duplicate ideas`
        });

    } catch (error) {
        console.error('Error in remove-duplicates API:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to remove duplicates'
            },
            { status: 500 }
        );
    }
}

export async function GET() {
    const isDevelopment = process.env.NODE_ENV === 'development';

    return NextResponse.json({
        message: 'Use POST method to remove duplicate ideas from database',
        authorizationRequired: !isDevelopment,
        developmentMode: isDevelopment,
        usage: {
            endpoint: '/api/remove-duplicates',
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
                },
                removeStrategy: 'Strategy for which idea to keep (keep-newer, keep-older, keep-both, keep-neither)',
                specificPair: 'Object with idea1Id and idea2Id to remove a specific pair (optional)'
            }
        }
    });
}