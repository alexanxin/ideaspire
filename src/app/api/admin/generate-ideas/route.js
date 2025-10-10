import { Readable } from 'stream';
import { createSimpleIdeaGenerator } from '@/lib/simpleIdeaGenerator';
import { addParsedIdeasToDB } from '@/lib/addParsedIdeasToDB';
import { getCurrentDate, formatDateForDatabase } from '@/utils/dateUtils';

// Create a transform stream to handle Server-Sent Events
class IdeaGenerationStream {
    constructor() {
        this.logSteps = [];
    }

    log(step, details) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            step,
            details: typeof details === 'string' ? details : step
        };

        // Handle collapsible content
        if (typeof details === 'object' && details.type === 'collapsible') {
            logEntry.collapsibleContent = details;
        }

        this.logSteps.push(logEntry);

        // Create SSE message
        return `data: ${JSON.stringify({ type: 'log', payload: logEntry })}\n\n`;
    }

    error(error) {
        return `data: ${JSON.stringify({ type: 'error', payload: { error } })}\n\n`;
    }

    complete(data) {
        return `data: ${JSON.stringify({ type: 'complete', payload: data })}\n\n`;
    }
}

// Create a readable stream for SSE
function createSSEStream(generatorFn) {
    return new ReadableStream({
        async start(controller) {
            try {
                const encoder = new TextEncoder();

                // Send initial message
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'init', payload: { message: 'Starting idea generation...' } })}\n\n`));

                // Execute the generator function, passing the controller to send updates
                await generatorFn(controller, encoder);

                // Close the stream
                controller.close();
            } catch (err) {
                const encoder = new TextEncoder();
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', payload: { error: err.message } })}\n\n`));
                controller.close();
            }
        },
    });
}

export async function POST(request) {
    try {
        const { additionalContext } = await request.json();

        const stream = createSSEStream(async (controller, encoder) => {
            const logSteps = [];

            const sendLog = (step, details) => {
                const logEntry = {
                    timestamp: new Date().toISOString(),
                    step,
                    details: typeof details === 'string' ? details : step
                };

                // Handle collapsible content
                if (typeof details === 'object' && details.type === 'collapsible') {
                    logEntry.collapsibleContent = details;
                }

                logSteps.push(logEntry);

                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'log', payload: logEntry })}\n\n`));
            };

            const generator = await createSimpleIdeaGenerator();

            if (!generator.redditClient) {
                sendLog('Reddit API not configured', 'Reddit API credentials are incomplete or missing');

                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', payload: { success: false, error: 'Reddit API not configured - missing credentials' } })}\n\n`));
                return;
            }

            // Collect data and generate ideas with real-time logging
            const result = await generator.collectAndGenerateWithRealTimeLogging({
                log: (step, details) => {
                    const logEntry = {
                        timestamp: new Date().toISOString(),
                        step,
                        details: typeof details === 'string' ? details : step
                    };

                    // Handle collapsible content
                    if (typeof details === 'object' && details.type === 'collapsible') {
                        logEntry.collapsibleContent = details;
                    }

                    logSteps.push(logEntry);

                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'log', payload: logEntry })}\n\n`));
                }
            }, additionalContext);

            if (!result.success) {
                // The error would have already been logged by the real-time logger
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', payload: { success: false, error: result.error || 'Failed to generate ideas' } })}\n\n`));
                return;
            }

            sendLog('Ideas generated successfully', `Successfully generated ${result.ideas.length} ideas from ${result.postCount} Reddit posts`);

            // Save ideas to database
            sendLog('Saving ideas to database', 'Saving generated ideas to the database');
            const saveResult = await addParsedIdeasToDB(result.ideas);

            if (!saveResult.success) {
                sendLog('Failed to save ideas to database', saveResult.error || 'Unknown error occurred while saving');

                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', payload: { success: false, error: 'Failed to save ideas to database', details: saveResult.error } })}\n\n`));
                return;
            }

            sendLog('Ideas saved to database', 'All generated ideas have been saved successfully');

            // Format the current date
            const currentDate = getCurrentDate();
            const formattedDate = formatDateForDatabase(currentDate);

            sendLog('Process completed', 'Idea generation and saving process completed successfully');

            // Send final success result
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'complete',
                payload: {
                    success: true,
                    message: 'Ideas generated and saved successfully using simplified approach',
                    ideas: result.ideas.map(idea => ({
                        ...idea,
                        date: formattedDate
                    })),
                    count: result.ideas.length,
                    date: formattedDate,
                    postCount: result.postCount,
                    regenerated: true,
                    logSteps
                }
            })}\n\n`));
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
            },
        });
    } catch (error) {
        console.error('Error in admin idea generation:', error);
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message || 'Failed to generate business ideas'
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

export async function GET() {
    return new Response(
        JSON.stringify({
            message: 'Use POST method to generate business ideas with detailed logging'
        }),
        {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        }
    );
}
