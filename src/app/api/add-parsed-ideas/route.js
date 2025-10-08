import { NextResponse } from 'next/server';
import { addParsedIdeasToDB } from '@/lib/addParsedIdeasToDB';

export async function POST(request) {
    try {
        // Check for authorization header to secure the endpoint
        const authHeader = request.headers.get('authorization');
        const expectedToken = process.env.CRON_AUTH_TOKEN;

        if (!expectedToken || !authHeader || authHeader !== `Bearer ${expectedToken}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { ideas, similarityThreshold = 0.7 } = body || {};

        // Validate input
        if (!ideas || !Array.isArray(ideas) || ideas.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid input: "ideas" must be a non-empty array'
                },
                { status: 400 }
            );
        }

        // Validate similarity threshold
        if (typeof similarityThreshold !== 'number' || similarityThreshold < 0 || similarityThreshold > 1) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid similarityThreshold: must be a number between 0 and 1'
                },
                { status: 400 }
            );
        }

        // Add ideas to database
        const result = await addParsedIdeasToDB(ideas, similarityThreshold);

        if (!result.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: result.error || 'Failed to add ideas to database'
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: result.message,
            ideas: result.ideas,
            count: result.count
        });

    } catch (error) {
        console.error('Error in add-parsed-ideas API:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to add parsed ideas to database'
            },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'Use POST method to add parsed ideas to database'
    });
}