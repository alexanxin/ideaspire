import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient.js';
import { calculateTextSimilarity } from '@/lib/similarityUtils.js';

export async function GET(request) {
    try {
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

        const { searchParams } = new URL(request.url);
        const keyword = searchParams.get('keyword');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = parseInt(searchParams.get('offset') || '0');
        const threshold = parseFloat(searchParams.get('threshold') || '0.1'); // Lower threshold for keyword search

        if (!keyword) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Keyword parameter is required'
                },
                { status: 400 }
            );
        }

        // Fetch all ideas from the database
        const { data: allIdeas, error: fetchError } = await supabase
            .from('business_ideas')
            .select('*');

        if (fetchError) {
            console.error('Error fetching ideas for search:', fetchError);
            return NextResponse.json(
                {
                    success: false,
                    error: fetchError.message
                },
                { status: 500 }
            );
        }

        // Calculate relevance score for each idea based on keyword matching
        const ideasWithRelevance = allIdeas.map(idea => {
            const titleLower = idea.title.toLowerCase();
            const descriptionLower = idea.description.toLowerCase();
            const keywordLower = keyword.toLowerCase();

            // Check for exact substring matches (highest relevance)
            const titleExactMatch = titleLower.includes(keywordLower);
            const descriptionExactMatch = descriptionLower.includes(keywordLower);

            // Check for word matches using Jaccard similarity
            const titleSimilarity = calculateTextSimilarity(titleLower, keywordLower);
            const descriptionSimilarity = calculateTextSimilarity(descriptionLower, keywordLower);

            // Calculate relevance score
            let relevance = Math.max(titleSimilarity, descriptionSimilarity);

            // Boost score significantly for exact matches
            if (titleExactMatch) relevance += 2.0;
            if (descriptionExactMatch) relevance += 1.0;

            return {
                ...idea,
                relevance,
                titleExactMatch,
                descriptionExactMatch
            };
        });

        // Filter ideas based on relevance threshold and sort by relevance
        const allFilteredIdeas = ideasWithRelevance
            .filter(idea => idea.relevance >= threshold)
            .sort((a, b) => b.relevance - a.relevance);

        // Apply pagination
        const paginatedIdeas = allFilteredIdeas.slice(offset, offset + limit);

        // Transform snake_case to camelCase for frontend (same as regular API)
        const filteredIdeas = paginatedIdeas.map(idea => ({
            ...idea,
            marketOpportunity: idea.market_opportunity,
            targetAudience: idea.target_audience,
            revenueModel: idea.revenue_model,
            keyChallenges: idea.key_challenges,
            // Remove the snake_case properties to avoid confusion
            market_opportunity: undefined,
            target_audience: undefined,
            revenue_model: undefined,
            key_challenges: undefined
        }));

        // Calculate if there are more results
        const hasMore = offset + limit < allFilteredIdeas.length;

        return NextResponse.json({
            success: true,
            keyword,
            results: filteredIdeas,
            count: filteredIdeas.length,
            totalAvailable: allFilteredIdeas.length, // Total number of matching ideas after filtering
            searchThreshold: threshold,
            hasMore: hasMore,
            offset: offset,
            limit: limit
        });

    } catch (error) {
        console.error('Error in ideas search API:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to search ideas'
            },
            { status: 500 }
        );
    }
}