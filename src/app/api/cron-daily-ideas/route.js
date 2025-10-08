import { NextResponse } from 'next/server';
import { createSimpleIdeaGenerator } from '@/lib/simpleIdeaGenerator';
import { saveBusinessIdeas } from '@/lib/businessIdeas';
import { getCurrentDate, formatDateForDatabase } from '@/utils/dateUtils';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request) {
    // Check for authorization header to secure the endpoint
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_AUTH_TOKEN;

    if (!expectedToken || !authHeader || authHeader !== `Bearer ${expectedToken}`) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }

    try {
        console.log('Starting daily ideas generation via cron job using simplified approach');

        // Initialize the simple idea generator
        const generator = await createSimpleIdeaGenerator();

        // Collect data and generate ideas in one streamlined process
        const result = await generator.collectAndGenerate();

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
        const currentDate = getCurrentDate();
        const saveResult = await saveBusinessIdeas(supabase, result.ideas, currentDate);

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

        const formattedDate = formatDateForDatabase(currentDate);

        console.log(`Successfully generated and saved ${result.ideas.length} ideas for ${formattedDate}`);

        return NextResponse.json({
            success: true,
            message: 'Daily ideas generated and saved successfully using simplified approach',
            ideas: result.ideas.map(idea => ({
                ...idea,
                date: formattedDate
            })),
            count: result.ideas.length,
            date: formattedDate,
            postCount: result.postCount
        });

    } catch (error) {
        console.error('Error in cron daily ideas generation:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to generate daily business ideas'
            },
            { status: 500 }
        );
    }
}