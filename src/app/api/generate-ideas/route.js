import { NextResponse } from 'next/server';
import { createSimpleIdeaGenerator } from '@/lib/simpleIdeaGenerator';
import { addParsedIdeasToDB } from '@/lib/addParsedIdeasToDB';
import { getCurrentDate, formatDateForDatabase } from '@/utils/dateUtils';

export async function POST(request) {
    try {
        console.log('Starting simplified idea generation...');

        // Initialize the simple idea generator
        const generator = await createSimpleIdeaGenerator();

        // Get additional context from request if provided
        const { additionalContext } = await request.json();

        // Check if Reddit is properly configured
        if (!generator.redditClient) {
            console.error('Reddit API not configured - missing credentials');
            return NextResponse.json(
                {
                    success: false,
                    error: 'Reddit API not configured - missing credentials'
                },
                { status: 500 }
            );
        }

        // Collect data and generate ideas in one streamlined process
        const result = await generator.collectAndGenerate(additionalContext);

        if (!result.success) {
            console.error('Failed to generate ideas:', result.error);
            return NextResponse.json(
                {
                    success: false,
                    error: result.error || 'Failed to generate ideas'
                },
                { status: 500 }
            );
        }

        console.log(`Successfully generated ${result.ideas.length} ideas from ${result.postCount} Reddit posts`);

        // Save ideas to database
        const saveResult = await addParsedIdeasToDB(result.ideas);

        if (!saveResult.success) {
            console.error('Error saving ideas to database:', saveResult.error);
            return NextResponse.json(
                {
                    success: false,
                    error: 'Failed to save ideas to database',
                    details: saveResult.error
                },
                { status: 500 }
            );
        }

        // Format the current date
        const currentDate = getCurrentDate();
        const formattedDate = formatDateForDatabase(currentDate);

        return NextResponse.json({
            success: true,
            message: 'Ideas generated and saved successfully using simplified approach',
            ideas: result.ideas.map(idea => ({
                ...idea,
                date: formattedDate
            })),
            count: result.ideas.length,
            date: formattedDate,
            postCount: result.postCount,
            regenerated: true
        });
    } catch (error) {
        console.error('Error in simplified idea generation:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to generate business ideas'
            },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'Use POST method to generate business ideas using the simplified approach'
    });
}