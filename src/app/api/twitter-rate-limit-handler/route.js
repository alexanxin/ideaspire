import { processTwitterCategoriesWithRateLimit } from '../../../lib/twitterRateLimitHandler.js';

export async function POST(request) {
    try {
        const body = await request.json();
        const { categories, searchQueryTemplate } = body;

        if (!categories || !Array.isArray(categories) || categories.length === 0) {
            return Response.json(
                { error: 'Categories array is required and cannot be empty' },
                { status: 400 }
            );
        }

        console.log(`Received request to process ${categories.length} Twitter categories with rate limiting`);

        const result = await processTwitterCategoriesWithRateLimit(
            categories,
            searchQueryTemplate || '"{category}" lang:en -is:retweet'
        );

        return Response.json({
            success: true,
            results: result.results,
            state: result.state,
            message: `Successfully processed ${result.state.completedCategories.length} categories`
        });
    } catch (error) {
        console.error('Error in Twitter rate limit handler API:', error);
        return Response.json(
            {
                error: error.message,
                success: false
            },
            { status: 500 }
        );
    }
}

// GET endpoint to check current state
export async function GET(request) {
    try {
        // For a GET request, we just return the current state info
        // In a real implementation, you might want to load the current state from persistence
        return Response.json({
            success: true,
            message: 'Twitter rate limit handler is ready',
            endpoints: {
                post: 'Submit categories for processing',
                get: 'Check current status (this endpoint)'
            },
            documentation: 'POST to this endpoint with {categories: [], searchQueryTemplate: ""}'
        });
    } catch (error) {
        console.error('Error in Twitter rate limit handler status API:', error);
        return Response.json(
            {
                error: error.message,
                success: false
            },
            { status: 500 }
        );
    }
}