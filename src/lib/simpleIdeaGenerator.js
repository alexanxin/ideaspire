// This file should only be used on the server side.
// It contains imports for 'fs' (via snoowrap) and other Node.js specific modules.

'use server';

import Snoowrap from 'snoowrap';
import { generateBusinessIdeas } from './geminiClient.js';
import { ideaTypes } from '@/data/ideaTypes.js';
import { getRedditRateLimitHandler } from './redditRateLimitHandler.js';

// Research class to handle simplified data collection and idea generation
class SimpleIdeaGenerator {
    constructor() {
        this.redditClient = null;
        this.rateLimitHandler = null;
    }

    async setupClients() {
        // Initialize rate limit handler first
        this.rateLimitHandler = await getRedditRateLimitHandler();

        // Reddit setup (requires client id, secret, username, and password)
        if (process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET && process.env.REDDIT_USER_AGENT && process.env.REDDIT_USERNAME && process.env.REDDIT_PASSWORD) {
            this.redditClient = new Snoowrap({
                userAgent: process.env.REDDIT_USER_AGENT,
                clientId: process.env.REDDIT_CLIENT_ID,
                clientSecret: process.env.REDDIT_CLIENT_SECRET,
                username: process.env.REDDIT_USERNAME,
                password: process.env.REDDIT_PASSWORD
            });

            // Enable snoowrap's built-in rate limiting
            this.redditClient.config({
                requestDelay: 1200, // 1.2 seconds delay between requests
                maxRetryAttempts: 3,
                retryErrorCodes: [502, 503, 504, 522],
                continueAfterRatelimitError: true,  // Continue after rate limit errors with delay
                warnings: true
            });
        } else {
            console.warn('Reddit API not configured - credentials incomplete.');
            this.redditClient = null;
        }
    }

    // Utility function for adding delays
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Extract user needs and pain points from Reddit posts with a single comprehensive search
    async collectComprehensiveRedditData() {
        try {
            if (!this.redditClient) {
                console.warn('Reddit API not configured - cannot collect data');
                return {
                    success: false,
                    error: 'Reddit API not configured'
                };
            }

            const targetSubreddits = [
                // Business and Productivity:
                'startups',          // original subreddit for startup-related discussions
                'entrepreneurship',  // original subreddit for entrepreneurship topics
                'smallbusiness',     // original subreddit for small business issues
                'sidehustle',        // side projects and small-scale entrepreneurial pains

                // Tech and Development:
                'indiehackers',      // indie developers sharing problems and solutions
                'SaaS',              // software as a service discussions, great for app ideas

                // General Problem-Solving and Ideas:
                'AskReddit',         // broad questions like "What's your biggest daily frustration?"
                'ideas'              // direct idea sharing and problem brainstorming
            ];

            const searchQueries = [
                // Problem-Focused Phrases:
                "I need a tool for",
                "I need something for",
                "looking for a tool",
                "need a tool to",
                "struggling with",
                "frustrated with",
                "what software do you use",
                "alternative to"
            ];

            const allTexts = [];

            // Collect data from all subreddits with rate limiting
            for (const subredditName of targetSubreddits) {
                try {
                    // Use rate limit handler to get subreddit
                    const subreddit = await this.rateLimitHandler.getSubredditWithRateLimit(subredditName);

                    // Limit the number of queries per subreddit to reduce API calls
                    // Take only the first 2 queries to avoid excessive requests
                    const limitedQueries = searchQueries.slice(0, 2);

                    for (const query of limitedQueries) {
                        try {
                            // Use rate limit handler to search subreddit
                            const searchResults = await this.rateLimitHandler.searchSubredditWithRateLimit(subredditName, {
                                query: query,
                                limit: 1, // Just one post per query to reduce API calls
                                sort: 'new'
                            });

                            for (const post of searchResults) {
                                let postText = `Title: ${post.title}\nContent: ${post.selftext || ''}\n`;

                                // Use rate limit handler to get comments
                                const comments = await this.rateLimitHandler.getPostCommentsWithRateLimit(post, { limit: 2 });
                                if (comments.length > 0) {
                                    postText += 'Comments:\n' + comments.map(comment => `- ${comment.body}`).join('\n');
                                }

                                allTexts.push(postText);
                            }
                        } catch (err) {
                            console.warn(`Error searching ${query} in r/${subredditName}:`, err.message);
                            // Check if it's a rate limit error and handle accordingly
                            if (err.message && err.message.toLowerCase().includes('ratelimit')) {
                                console.log('Rate limit hit, waiting before continuing...');
                                await this.delay(60000); // Wait 1 minute before continuing
                            }
                        }

                        // Add a small delay between queries to further reduce rate limit issues
                        await this.delay(1000);
                    }
                } catch (err) {
                    console.warn(`Error accessing subreddit ${subredditName}:`, err.message);
                }

                // Add a delay between subreddits to respect rate limits
                await this.delay(2000);
            }

            if (allTexts.length === 0) {
                console.warn('No relevant posts found');
                return {
                    success: false,
                    error: 'No relevant posts found'
                };
            }

            // Combine all texts
            const combinedText = allTexts.join('\n\n---\n\n');

            return {
                success: true,
                data: combinedText,
                postCount: allTexts.length
            };
        } catch (error) {
            console.error('Error collecting Reddit data:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Public method to get comprehensive Reddit data
    async getComprehensiveRedditData() {
        return await this.collectComprehensiveRedditData();
    }

    // Generate ideas for all categories based on the collected Reddit data
    async generateIdeasFromContext(redditData, additionalContext = null) {
        try {
            if (!redditData.success || !redditData.data) {
                console.warn('No Reddit data available for idea generation');
                return {
                    success: false,
                    error: 'No Reddit data available'
                };
            }

            // Prepare category information for the prompt
            const categoriesInfo = ideaTypes.map(type =>
                `- ${type.category}: ${type.description}\n  Focus: ${type.prompt.split('\n')[0]}`
            ).join('\n\n');

            // Create a comprehensive prompt for Gemini
            let analysisPrompt = `Analyze the following Reddit posts and extract key user pain points, unmet needs, and potential business opportunities. Then, generate specific business ideas that fit into the provided categories.

Reddit Posts Context:
${redditData.data}

Available Business Idea Categories:
${categoriesInfo}

Instructions:
1. First, analyze the Reddit posts to identify common themes, pain points, and unmet needs
2. Then, generate ONE specific business idea for EACH category listed above
3. Each idea should directly address insights from the Reddit data
4. Format each idea as a JSON object with these fields:
  - title: A catchy, specific name for the idea
  - description: A brief explanation of what the idea does
  - marketOpportunity: Why this idea addresses a real market need based on the Reddit data
  - targetAudience: Who would benefit most from this idea
  - revenueModel: How this business could make money
  - keyChallenges: Potential obstacles or difficulties in implementing this idea

Provide your response as a JSON array, with one object per category in the same order as listed above. Ensure each object has all the required fields.`;

            // Add additional context if provided
            if (additionalContext && additionalContext.trim() !== '') {
                analysisPrompt += `\n\nAdditional Context:\n${additionalContext}`;
            }

            console.log('Sending prompt to Gemini for idea generation...');

            // Send to Gemini for idea generation
            const analysisResult = await generateBusinessIdeas(analysisPrompt);

            console.log('Received response from Gemini');

            // Try to parse the JSON response
            try {
                // Clean up the response by removing markdown code blocks if present
                let cleanResponse = analysisResult.trim();
                if (cleanResponse.startsWith('```json')) {
                    cleanResponse = cleanResponse.substring(7); // Remove ```json
                } else if (cleanResponse.startsWith('```')) {
                    cleanResponse = cleanResponse.substring(3); // Remove ```
                }

                if (cleanResponse.endsWith('```')) {
                    cleanResponse = cleanResponse.substring(0, cleanResponse.length - 3); // Remove trailing ```
                }

                cleanResponse = cleanResponse.trim();

                const parsedIdeas = JSON.parse(cleanResponse);

                if (Array.isArray(parsedIdeas) && parsedIdeas.length === ideaTypes.length) {
                    // Attach category information to each idea
                    const ideasWithCategories = parsedIdeas.map((idea, index) => ({
                        ...idea,
                        category: ideaTypes[index].category
                    }));

                    return {
                        success: true,
                        ideas: ideasWithCategories
                    };
                } else {
                    console.warn('Generated ideas do not match expected format or count');
                    return {
                        success: false,
                        error: 'Generated ideas do not match expected format'
                    };
                }
            } catch (parseError) {
                console.error('Error parsing Gemini response:', parseError);
                console.log('Raw response:', analysisResult);
                return {
                    success: false,
                    error: 'Failed to parse Gemini response'
                };
            }
        } catch (error) {
            console.error('Error generating ideas:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Generate ideas with detailed logging
    async generateIdeasFromContextWithLogging(redditData, logSteps, additionalContext = null) {
        try {
            if (!redditData.success || !redditData.data) {
                console.warn('No Reddit data available for idea generation');
                logSteps.push({
                    timestamp: new Date().toISOString(),
                    step: 'No Reddit data available',
                    details: 'No Reddit data available for idea generation'
                });
                return {
                    success: false,
                    error: 'No Reddit data available'
                };
            }

            logSteps.push({
                timestamp: new Date().toISOString(),
                step: 'Preparing context for Gemini',
                details: `Preparing context with ${redditData.postCount} Reddit posts and additional context: ${additionalContext ? 'Yes' : 'No'}`
            });

            // Prepare category information for the prompt
            const categoriesInfo = ideaTypes.map(type =>
                `- ${type.category}: ${type.description}\n  Focus: ${type.prompt.split('\n')[0]}`
            ).join('\n\n');

            // Create a comprehensive prompt for Gemini
            let analysisPrompt = `Analyze the following Reddit posts and extract key user pain points, unmet needs, and potential business opportunities. Then, generate specific business ideas that fit into the provided categories.

Reddit Posts Context:
${redditData.data}

Available Business Idea Categories:
${categoriesInfo}

Instructions:
1. First, analyze the Reddit posts to identify common themes, pain points, and unmet needs
2. Then, generate ONE specific business idea for EACH category listed above
3. Each idea should directly address insights from the Reddit data
4. Format each idea as a JSON object with these fields:
  - title: A catchy, specific name for the idea
  - description: A brief explanation of what the idea does
  - marketOpportunity: Why this idea addresses a real market need based on the Reddit data
  - targetAudience: Who would benefit most from this idea
  - revenueModel: How this business could make money
  - keyChallenges: Potential obstacles or difficulties in implementing this idea

Provide your response as a JSON array, with one object per category in the same order as listed above. Ensure each object has all the required fields.`;

            // Add additional context if provided
            if (additionalContext && additionalContext.trim() !== '') {
                analysisPrompt += `\n\nAdditional Context:\n${additionalContext}`;
                logSteps.push({
                    timestamp: new Date().toISOString(),
                    step: 'Additional context added',
                    details: `Additional context provided to Gemini: ${additionalContext.substring(0, 100)}${additionalContext.length > 100 ? '...' : ''}`
                });
            }

            logSteps.push({
                timestamp: new Date().toISOString(),
                step: 'Sending to Gemini',
                details: 'Sending prompt to Gemini for idea generation'
            });

            // Send to Gemini for idea generation
            const analysisResult = await generateBusinessIdeas(analysisPrompt);

            logSteps.push({
                timestamp: new Date().toISOString(),
                step: 'Received response from Gemini',
                details: 'Successfully received response from Gemini API'
            });

            // Try to parse the JSON response
            try {
                // Clean up the response by removing markdown code blocks if present
                let cleanResponse = analysisResult.trim();
                if (cleanResponse.startsWith('```json')) {
                    cleanResponse = cleanResponse.substring(7); // Remove ```json
                } else if (cleanResponse.startsWith('```')) {
                    cleanResponse = cleanResponse.substring(3); // Remove ```
                }

                if (cleanResponse.endsWith('```')) {
                    cleanResponse = cleanResponse.substring(0, cleanResponse.length - 3); // Remove trailing ```
                }

                cleanResponse = cleanResponse.trim();

                const parsedIdeas = JSON.parse(cleanResponse);

                if (Array.isArray(parsedIdeas) && parsedIdeas.length === ideaTypes.length) {
                    // Attach category information to each idea
                    const ideasWithCategories = parsedIdeas.map((idea, index) => ({
                        ...idea,
                        category: ideaTypes[index].category
                    }));

                    logSteps.push({
                        timestamp: new Date().toISOString(),
                        step: 'Ideas parsed successfully',
                        details: `Successfully parsed ${parsedIdeas.length} ideas from Gemini response`
                    });

                    return {
                        success: true,
                        ideas: ideasWithCategories
                    };
                } else {
                    console.warn('Generated ideas do not match expected format or count');
                    logSteps.push({
                        timestamp: new Date().toISOString(),
                        step: 'Failed to parse ideas',
                        details: 'Generated ideas do not match expected format'
                    });
                    return {
                        success: false,
                        error: 'Generated ideas do not match expected format'
                    };
                }
            } catch (parseError) {
                console.error('Error parsing Gemini response:', parseError);
                console.log('Raw response:', analysisResult);
                logSteps.push({
                    timestamp: new Date().toISOString(),
                    step: 'Failed to parse Gemini response',
                    details: parseError.message
                });
                return {
                    success: false,
                    error: 'Failed to parse Gemini response'
                };
            }
        } catch (error) {
            console.error('Error generating ideas:', error);
            logSteps.push({
                timestamp: new Date().toISOString(),
                step: 'Error generating ideas',
                details: error.message
            });
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Generate ideas with real-time logging for SSE
    async generateIdeasFromContextWithRealTimeLogging(redditData, realTimeLogger, additionalContext = null) {
        try {
            if (!redditData.success || !redditData.data) {
                console.warn('No Reddit data available for idea generation');
                realTimeLogger.log('No Reddit data available', 'No Reddit data available for idea generation');
                return {
                    success: false,
                    error: 'No Reddit data available'
                };
            }

            realTimeLogger.log('Preparing context for Gemini', `Preparing context with ${redditData.postCount} Reddit posts and additional context: ${additionalContext ? 'Yes' : 'No'}`);

            // Prepare category information for the prompt
            const categoriesInfo = ideaTypes.map(type =>
                `- ${type.category}: ${type.description}\n  Focus: ${type.prompt.split('\n')[0]}`
            ).join('\n\n');

            // Create a comprehensive prompt for Gemini
            let analysisPrompt = `Analyze the following Reddit posts and extract key user pain points, unmet needs, and potential business opportunities. Then, generate specific business ideas that fit into the provided categories.

Reddit Posts Context:
${redditData.data}

Available Business Idea Categories:
${categoriesInfo}

Instructions:
1. First, analyze the Reddit posts to identify common themes, pain points, and unmet needs
2. Then, generate ONE specific business idea for EACH category listed above
3. Each idea should directly address insights from the Reddit data
4. Format each idea as a JSON object with these fields:
  - title: A catchy, specific name for the idea
  - description: A brief explanation of what the idea does
  - marketOpportunity: Why this idea addresses a real market need based on the Reddit data
  - targetAudience: Who would benefit most from this idea
  - revenueModel: How this business could make money
  - keyChallenges: Potential obstacles or difficulties in implementing this idea

Provide your response as a JSON array, with one object per category in the same order as listed above. Ensure each object has all the required fields.`;

            // Add additional context if provided
            if (additionalContext && additionalContext.trim() !== '') {
                analysisPrompt += `\n\nAdditional Context:\n${additionalContext}`;
                realTimeLogger.log('Additional context added', `Additional context provided to Gemini: ${additionalContext.substring(0, 100)}${additionalContext.length > 100 ? '...' : ''}`);
            }

            realTimeLogger.log('Sending to Gemini', 'Sending prompt to Gemini for idea generation');

            // Send to Gemini for idea generation
            const analysisResult = await generateBusinessIdeas(analysisPrompt);

            realTimeLogger.log('Received response from Gemini', 'Successfully received response from Gemini API');

            // Try to parse the JSON response
            try {
                // Clean up the response by removing markdown code blocks if present
                let cleanResponse = analysisResult.trim();
                if (cleanResponse.startsWith('```json')) {
                    cleanResponse = cleanResponse.substring(7); // Remove ```json
                } else if (cleanResponse.startsWith('```')) {
                    cleanResponse = cleanResponse.substring(3); // Remove ```
                }

                if (cleanResponse.endsWith('```')) {
                    cleanResponse = cleanResponse.substring(0, cleanResponse.length - 3); // Remove trailing ```
                }

                cleanResponse = cleanResponse.trim();

                const parsedIdeas = JSON.parse(cleanResponse);

                if (Array.isArray(parsedIdeas) && parsedIdeas.length === ideaTypes.length) {
                    // Attach category information to each idea
                    const ideasWithCategories = parsedIdeas.map((idea, index) => ({
                        ...idea,
                        category: ideaTypes[index].category
                    }));

                    realTimeLogger.log('Ideas parsed successfully', `Successfully parsed ${parsedIdeas.length} ideas from Gemini response`);

                    return {
                        success: true,
                        ideas: ideasWithCategories
                    };
                } else {
                    console.warn('Generated ideas do not match expected format or count');
                    realTimeLogger.log('Failed to parse ideas', 'Generated ideas do not match expected format');
                    return {
                        success: false,
                        error: 'Generated ideas do not match expected format'
                    };
                }
            } catch (parseError) {
                console.error('Error parsing Gemini response:', parseError);
                console.log('Raw response:', analysisResult);
                realTimeLogger.log('Failed to parse Gemini response', parseError.message);
                return {
                    success: false,
                    error: 'Failed to parse Gemini response'
                };
            }
        } catch (error) {
            console.error('Error generating ideas:', error);
            realTimeLogger.log('Error generating ideas', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Main function to collect data and generate ideas
    async collectAndGenerate(additionalContext = null) {
        try {
            console.log('Starting comprehensive Reddit data collection...');

            // Step 1: Collect Reddit data
            const redditData = await this.collectComprehensiveRedditData();

            if (!redditData.success) {
                return {
                    success: false,
                    error: redditData.error || 'Failed to collect Reddit data'
                };
            }

            console.log(`Collected data from ${redditData.postCount} Reddit posts`);

            // Step 2: Generate ideas from the collected data
            console.log('Generating business ideas from collected data...');
            const ideasResult = await this.generateIdeasFromContext(redditData, additionalContext);

            if (!ideasResult.success) {
                return {
                    success: false,
                    error: ideasResult.error || 'Failed to generate ideas'
                };
            }

            return {
                success: true,
                ideas: ideasResult.ideas,
                postCount: redditData.postCount
            };
        } catch (error) {
            console.error('Error in collectAndGenerate:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Main function to collect data and generate ideas with detailed logging
    async collectAndGenerateWithLogging(logSteps, additionalContext = null) {
        try {
            logSteps.push({
                timestamp: new Date().toISOString(),
                step: 'Starting comprehensive Reddit data collection',
                details: 'Beginning the process of collecting data from various subreddits'
            });

            // Step 1: Collect Reddit data
            logSteps.push({
                timestamp: new Date().toISOString(),
                step: 'Collecting data from Reddit',
                details: 'Initializing collection from target subreddits'
            });

            const redditData = await this.collectComprehensiveRedditData();

            if (!redditData.success) {
                logSteps.push({
                    timestamp: new Date().toISOString(),
                    step: 'Failed to collect Reddit data',
                    details: redditData.error || 'Failed to collect Reddit data'
                });
                return {
                    success: false,
                    error: redditData.error || 'Failed to collect Reddit data'
                };
            }

            logSteps.push({
                timestamp: new Date().toISOString(),
                step: 'Reddit data collected successfully',
                details: `Collected data from ${redditData.postCount} Reddit posts`
            });

            // Step 2: Generate ideas from the collected data
            logSteps.push({
                timestamp: new Date().toISOString(),
                step: 'Generating business ideas from collected data',
                details: 'Sending collected data to Gemini for idea generation'
            });

            const ideasResult = await this.generateIdeasFromContextWithLogging(redditData, logSteps, additionalContext);

            if (!ideasResult.success) {
                logSteps.push({
                    timestamp: new Date().toISOString(),
                    step: 'Failed to generate ideas',
                    details: ideasResult.error || 'Failed to generate ideas'
                });
                return {
                    success: false,
                    error: ideasResult.error || 'Failed to generate ideas'
                };
            }

            logSteps.push({
                timestamp: new Date().toISOString(),
                step: 'Ideas generated successfully',
                details: `Successfully generated ${ideasResult.ideas.length} ideas`
            });

            return {
                success: true,
                ideas: ideasResult.ideas,
                postCount: redditData.postCount
            };
        } catch (error) {
            console.error('Error in collectAndGenerateWithLogging:', error);
            logSteps.push({
                timestamp: new Date().toISOString(),
                step: 'Error in collectAndGenerateWithLogging',
                details: error.message
            });
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Main function to collect data and generate ideas with real-time logging for SSE
    async collectAndGenerateWithRealTimeLogging(realTimeLogger, additionalContext = null) {
        try {
            realTimeLogger.log('Starting comprehensive Reddit data collection', 'Beginning the process of collecting data from various subreddits');

            // Step 1: Collect Reddit data
            realTimeLogger.log('Collecting data from Reddit', 'Initializing collection from target subreddits');

            const redditData = await this.collectComprehensiveRedditData();

            if (!redditData.success) {
                realTimeLogger.log('Failed to collect Reddit data', redditData.error || 'Failed to collect Reddit data');
                return {
                    success: false,
                    error: redditData.error || 'Failed to collect Reddit data'
                };
            }

            realTimeLogger.log('Reddit data collected successfully', `Collected data from ${redditData.postCount} Reddit posts`);

            // Step 2: Generate ideas from the collected data
            realTimeLogger.log('Generating business ideas from collected data', 'Sending collected data to Gemini for idea generation');

            const ideasResult = await this.generateIdeasFromContextWithRealTimeLogging(redditData, realTimeLogger, additionalContext);

            if (!ideasResult.success) {
                realTimeLogger.log('Failed to generate ideas', ideasResult.error || 'Failed to generate ideas');
                return {
                    success: false,
                    error: ideasResult.error || 'Failed to generate ideas'
                };
            }

            realTimeLogger.log('Ideas generated successfully', `Successfully generated ${ideasResult.ideas.length} ideas`);

            return {
                success: true,
                ideas: ideasResult.ideas,
                postCount: redditData.postCount
            };
        } catch (error) {
            console.error('Error in collectAndGenerateWithRealTimeLogging:', error);
            realTimeLogger.log('Error in collectAndGenerateWithRealTimeLogging', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Export a function to create an instance of SimpleIdeaGenerator
export async function createSimpleIdeaGenerator() {
    const generator = new SimpleIdeaGenerator();
    await generator.setupClients(); // Ensure setup is completed before returning
    return generator;
}