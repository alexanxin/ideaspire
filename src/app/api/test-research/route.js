import { createSimpleIdeaGenerator } from '../../../lib/simpleIdeaGenerator';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');

    try {
        const generator = await createSimpleIdeaGenerator();

        let data;
        switch (platform) {
            case 'twitter':
                // Twitter API temporarily disabled due to rate limits
                data = {
                    success: false,
                    error: 'Twitter API temporarily disabled due to rate limits',
                    trends: [],
                    sources: { twitter: false },
                    message: 'Twitter API temporarily disabled due to rate limits. Please check back later.'
                };
                break;
            case 'reddit':
                // For Reddit, we'll collect comprehensive data
                const redditData = await generator.getComprehensiveRedditData();
                data = {
                    success: redditData.success,
                    data: redditData.data,
                    postCount: redditData.postCount,
                    error: redditData.error
                };
                break;
            case 'combined':
                // For combined, we'll generate ideas from comprehensive Reddit data
                const result = await generator.collectAndGenerate();
                data = {
                    success: result.success,
                    ideas: result.ideas,
                    postCount: result.postCount,
                    error: result.error
                };
                break;
            default:
                return Response.json({ error: 'Invalid platform. Use: twitter, reddit, or combined' }, { status: 400 });
        }

        return Response.json(data);
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}
