// This file should only be used on the server side.
// It contains imports for 'fs' (via twitter-api-v2) and other Node.js specific modules.
// If you need to use research utilities on the client, consider creating a separate client-side safe module.

'use server';

import axios from 'axios';
import * as cheerio from 'cheerio';
import { getJson } from 'serpapi';
import Snoowrap from 'snoowrap';
import { getRedditRateLimitHandler } from './redditRateLimitHandler.js';
import { TwitterApi } from 'twitter-api-v2';
import { generateBusinessIdeas } from './geminiClient.js';

// Note: You will need to install these packages:
// npm install axios cheerio serpapi snoowrap twitter-api-v2

// Research class to handle data from multiple platforms
class IdeaResearch {
    constructor() {
        this.redditClient = null;
        this.rateLimitHandler = null;
        this.twitterApi = null;
        this.twitterRequestCount = 0;
        this.twitterLastRequestTime = 0;
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
                ratelimit: 50,  // Use 50 requests per minute to stay under the 60 limit
                warnings: true
            });
        } else {
            console.warn('Reddit API not configured - credentials incomplete.');
            this.redditClient = null;
        }

        // Twitter setup for user auth (for future use)
        if (process.env.TWITTER_API_KEY && process.env.TWITTER_API_SECRET && process.env.TWITTER_ACCESS_TOKEN && process.env.TWITTER_ACCESS_TOKEN_SECRET) {
            this.twitterApi = new TwitterApi({
                appKey: process.env.TWITTER_API_KEY,
                appSecret: process.env.TWITTER_API_SECRET,
                accessToken: process.env.TWITTER_ACCESS_TOKEN,
                accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET
            });
        } else {
            this.twitterApi = null;
        }

        // Twitter setup for app-only (for search/trends)
        if (process.env.TWITTER_BEARER_TOKEN) {
            this.twitterReadOnly = new TwitterApi(process.env.TWITTER_BEARER_TOKEN).readOnly;
        } else {
            console.warn('Twitter Bearer Token not configured - Twitter search will not work');
            this.twitterReadOnly = null;
        }
    }

    // Utility function for adding delays
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Twitter API request with exponential backoff for rate limiting
    async twitterApiRequestWithBackoff(params, maxRetries = 3, baseDelay = 1500) {
        let retries = 0;

        // Implement request throttling based on Twitter's rate limits
        // Twitter allows 300 requests per 15-minute window for search endpoints
        // This means we should wait at least 3 seconds between requests on average
        const now = Date.now();
        const timeSinceLastRequest = now - this.twitterLastRequestTime;
        const minDelay = 3000; // Minimum 3 seconds between requests

        if (timeSinceLastRequest < minDelay) {
            const delayNeeded = minDelay - timeSinceLastRequest;
            await this.delay(delayNeeded);
        }

        while (retries <= maxRetries) {
            try {
                // Update request tracking
                this.twitterRequestCount++;
                this.twitterLastRequestTime = Date.now();

                // Make the API request
                const result = await this.twitterReadOnly.v2.search(params);
                return result;
            } catch (error) {
                console.log('Twitter API error:', JSON.stringify(error, null, 2));

                // Check if it's a rate limit error (429) or usage cap error
                const isRateLimitError = error.code === 429 ||
                    error.status === 429 ||
                    (error.data && error.data.title === 'Too Many Requests') ||
                    (error.rateLimitResetAt) ||
                    (error.message && error.message.includes('429')) ||
                    (error.rateLimit && error.rateLimit.remaining === 0);

                // Check if it's a usage cap error
                const isUsageCapError = (error.data && error.data.title === 'UsageCapExceeded') ||
                    (error.message && error.message.includes('UsageCapExceeded')) ||
                    (error.data && error.data.detail && error.data.detail.includes('Usage cap exceeded'));

                if (isRateLimitError || isUsageCapError) {
                    // If it's a usage cap error, disable Twitter for the session
                    if (isUsageCapError) {
                        console.warn('Twitter API usage cap exceeded. Disabling Twitter for this session.');
                        this.twitterReadOnly = null;
                        throw new Error(`Twitter API usage cap exceeded: ${error.message}`);
                    }

                    if (retries < maxRetries) {
                        let delayMs = baseDelay * Math.pow(2, retries);

                        // If we have rate limit reset info, use that instead
                        if (error.rateLimit && error.rateLimit.reset) {
                            const resetTime = error.rateLimit.reset * 1000; // Convert to milliseconds
                            const currentTime = Date.now();
                            const timeUntilReset = resetTime - currentTime;

                            if (timeUntilReset > 0) {
                                // Add a small buffer to ensure we're past the reset time
                                delayMs = timeUntilReset + 1000;
                                console.warn(`Twitter API rate limit hit. Waiting until reset at ${new Date(resetTime).toISOString()} (${delayMs}ms)`);
                            }
                        } else {
                            console.warn(`Twitter API rate limit hit. Retrying in ${delayMs}ms... (Attempt ${retries + 1}/${maxRetries})`);
                        }

                        // Wait before retrying
                        await this.delay(delayMs);
                        retries++;
                    } else {
                        console.error(`Twitter API rate limit exceeded after ${maxRetries} retries.`);
                        throw new Error(`Twitter API rate limit exceeded: ${error.message}`);
                    }
                } else {
                    // Not a rate limit error, re-throw
                    throw error;
                }
            }
        }
    }

    // Google Trends - Not implemented due to API restrictions
    async getGoogleTrends(keyword = 'business ideas') {
        return {
            success: false,
            trends: this.getFallbackTrends()
        };
    }

    // Get trending topics from Twitter API by searching for user needs and pain points
    async getTwitterTrends() {
        try {
            if (!this.twitterReadOnly) {
                console.warn('Twitter Bearer Token not configured or usage cap exceeded - using fallback data');
                return {
                    success: false,
                    trends: this.getFallbackTwitter()
                };
            }

            // Single comprehensive search query to minimize API calls and rate limiting
            const searchQuery = '("I need a tool for" OR "I need something for" OR "looking for a tool" OR "need a tool to" OR "what tool should I use for" OR "need a mobile app for" OR "need a web application for" OR "pain point with" OR "struggling with" OR "recommend a tool for" OR "best tool for" OR "can\'t find a tool" OR "needing help with" OR "frustrated with my current" OR "what software do you use" OR "alternative to") (business OR startup OR SaaS) lang:en -is:retweet';

            const allTexts = [];
            const maxTweets = 20; // Get more tweets since we have only one request

            // Add rate limiting delay to prevent hitting Twitter API limits
            await this.delay(1000); // 1 second delay between requests

            try {
                // Implement exponential backoff for rate limit handling
                const searchResult = await this.twitterApiRequestWithBackoff({
                    query: searchQuery,
                    max_results: maxTweets,
                    sort_order: 'recency'
                });

                // Debug: Log the actual structure of the response
                // console.log('Twitter API response structure:', JSON.stringify(searchResult, null, 2));

                // Ensure we have a valid response structure
                // Twitter API v2 search response has data as an array of tweet objects
                // The actual data is in searchResult._realData.data
                let tweets = [];
                if (searchResult && searchResult._realData && searchResult._realData.data) {
                    if (Array.isArray(searchResult._realData.data)) {
                        tweets = searchResult._realData.data;
                    } else {
                        console.warn('Twitter API response _realData.data is not an array:', typeof searchResult._realData.data);
                    }
                } else if (searchResult && searchResult.data) {
                    // Fallback to direct data access if _realData is not present
                    if (Array.isArray(searchResult.data)) {
                        tweets = searchResult.data;
                    } else {
                        console.warn('Twitter API response data is not an array:', typeof searchResult.data);
                    }
                } else {
                    console.warn('Twitter API response does not contain expected data structure');
                }

                // Process tweets if we have them
                if (Array.isArray(tweets) && tweets.length > 0) {
                    for (const tweet of tweets) {
                        // Ensure tweet has text property
                        if (tweet && tweet.text) {
                            const tweetText = `Tweet: ${tweet.text}\n`;
                            allTexts.push(tweetText);
                        }
                    }
                } else {
                    console.warn('No valid tweets found in Twitter API response');
                }
            } catch (err) {
                console.warn(`Error searching Twitter:`, err.message);
                // Single request failed, will fall back
            }

            if (allTexts.length === 0) {
                console.warn('No relevant tweets found - using fallback');
                return {
                    success: false,
                    trends: this.getFallbackTwitter(),
                    tweetsFound: 0,
                    usedAi: false,
                    error: 'No relevant tweets found'
                };
            }

            // Combine all texts and analyze with Gemini
            const combinedText = allTexts.join('\n\n---\n\n');

            const analysisPrompt = `Analyze the following Twitter tweets and extract key user pain points, unmet needs, and potential business opportunities for tools/services. Focus on frustration, gaps in existing solutions, and desires for new tools in business/startup contexts.

Tweets:
${combinedText}

Please summarize the most common and significant pain points, tool gaps, and user needs. Respond with a JSON array of strings, where each string is a specific pain point or need (similar to business opportunity descriptions). Limit to 30 items. Example format: ["Pain point 1", "Pain point 2", "Pain point 3"]`;

            const analysisResult = await generateBusinessIdeas(analysisPrompt);

            console.log('Raw Twitter AI response:', analysisResult); // Debug logging

            // Try to parse as JSON first
            let needs = [];
            try {
                const parsed = JSON.parse(analysisResult);
                if (Array.isArray(parsed)) {
                    needs = parsed.slice(0, 30);
                }
            } catch (e) {
                // If not JSON, try to extract from bullet points or numbered lists
                const lines = analysisResult.split('\n').map(line => line.trim());
                const bulletPoints = lines.filter(line =>
                    line.startsWith('-') || line.startsWith('*') || /^\d+\./.test(line)
                );
                needs = bulletPoints.map(line =>
                    line.replace(/^[-*\d\.\s]*/, '').trim()
                ).slice(0, 30);
            }

            // If still no needs, try to extract from paragraphs
            if (needs.length === 0) {
                const sentences = analysisResult.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 20);
                needs = sentences.slice(0, 30);
            }

            // If AI didn't provide valid pain points, fall back with reduced success
            if (needs.length === 0) {
                console.warn('No valid pain points extracted from Twitter AI response');
                return {
                    success: false,
                    trends: this.getFallbackTwitter(),
                    tweetsFound: allTexts.length,
                    usedAi: false,
                    error: 'AI response received but no valid pain points extracted',
                    rawResponse: analysisResult.substring(0, 500) // Log first 500 chars for debugging
                };
            }

            return {
                success: true,
                trends: needs,
                tweetsFound: allTexts.length,
                usedAi: true
            };
        } catch (error) {
            // Check if it's a usage cap error that caused Twitter to be disabled
            if (error.message && error.message.includes('usage cap exceeded')) {
                console.warn('Twitter API usage cap exceeded - using fallback data');
                return {
                    success: false,
                    error: error.message,
                    trends: this.getFallbackTwitter(),
                    tweetsFound: 0,
                    usedAi: false
                };
            }

            console.error('Error extracting Twitter needs:', error);
            return {
                success: false,
                error: error.message,
                trends: this.getFallbackTwitter(),
                tweetsFound: 0,
                usedAi: false
            };
        }
    }

    // NEW FUNCTION for Sentiment and Emotion Analysis
    async analyzeSentimentAndEmotion(text) {
        try {
            const analysisPrompt = `Analyze the sentiment and primary emotion of the following text. Provide the output in a structured JSON format.

Text to Analyze:
"""
${text}
"""

Respond with a JSON object with two keys: "sentiment" and "emotion".
- "sentiment" should be one of: "Positive", "Neutral", "Negative".
- "emotion" should be one of: "Frustration", "Anger", "Desperation", "Hopeful", "Excitement", "Curiosity", "Neutral".

Example Response:
{
  "sentiment": "Negative",
  "emotion": "Frustration"
}
`;
            const rawResult = await generateBusinessIdeas(analysisPrompt);

            // Clean the raw result to ensure it's valid JSON
            const cleanedResult = rawResult.replace(/```json/g, '').replace(/```/g, '').trim();

            const result = JSON.parse(cleanedResult);
            return { success: true, data: result };
        } catch (error) {
            console.error('Error during sentiment and emotion analysis:', error);
            return { success: false, error: error.message, data: { sentiment: 'Neutral', emotion: 'Neutral' } };
        }
    }

    // Extract user needs and pain points from Reddit posts
    async getRedditTrends() {
        try {
            if (!this.redditClient) {
                console.warn('Reddit API not configured - using fallback data');
                return {
                    success: false,
                    trends: this.getFallbackReddit()
                };
            }

            const targetSubreddits = [
                // Business and Productivity:
                'startups',          // original subreddit for startup-related discussions
                'entrepreneurship',  // original subreddit for entrepreneurship topics
                'smallbusiness',     // original subreddit for small business issues
                'productivity',      // for tools related to time management, workflows, and efficiency
                'sidehustle',        // side projects and small-scale entrepreneurial pains
                'freelance',         // freelancer-specific tools and challenges
                'marketing',         // digital marketing tools and strategies

                // Tech and Development:
                'learnprogramming', // beginner coding issues and tool needs
                'webdev',            // web development tools and pain points
                'SaaS',              // software as a service discussions, great for app ideas
                'indiehackers',      // indie developers sharing problems and solutions

                // Niche Communities (for targeted problems):
                'personalfinance',   // financial management tools and frustrations
                'fitness',           // apps and tools for health tracking
                'writing',           // writing software and creative blocks
                'photography',       // editing tools and gear alternatives
                'gaming',            // game development or player tools

                // General Problem-Solving and Ideas:
                'AskReddit',         // broad questions like "What's your biggest daily frustration?"
                'LifeProTips',       // hacks and tool suggestions for everyday life
                'ideas',             // direct idea sharing and problem brainstorming
                'needadvice'         // personal and professional advice requests
            ];

            const searchQueries = [
                // Problem-Focused Phrases:
                "having trouble with",
                "issue with",
                "problem solving for",
                "fix for",
                "workaround for",
                "hate when",
                "annoying thing about",
                "biggest challenge in",

                // Request for Recommendations:
                "suggest a solution for",
                "any good apps for",
                "recommend software for",
                "looking for alternatives to",
                "better way to",
                "tool recommendations for",
                "what do you recommend for",

                // Frustration and Venting:
                "tired of",
                "sick of dealing with",
                "why is it so hard to",
                "raging about",
                "vent: ",
                "anyone else hate",
                "worst part of",

                // Idea Generation and Needs:
                "wish there was a",
                "idea for a tool that",
                "if only there was",
                "dream tool for",
                "invent a",
                "brainstorm solutions for",
                "how to improve",

                // Original queries (maintaining existing functionality):
                "I need a tool for",
                "I need something for",
                "looking for a tool",
                "need a tool to",
                "what tool should I use for",
                "need a mobile app for",
                "need a web application for",
                "pain point with",
                "struggling with",
                "recommend a tool for",
                "best tool for",
                "can't find a tool",
                "needing help with",
                "frustrated with my current",
                "what software do you use",
                "alternative to"
            ];

            const allTexts = [];

            // Limit the number of queries to reduce API calls
            const limitedQueries = searchQueries.slice(0, 5);

            for (const subredditName of targetSubreddits) {
                try {
                    // Use rate limit handler to get subreddit
                    const subreddit = await this.rateLimitHandler.getSubredditWithRateLimit(subredditName);

                    for (const query of limitedQueries) {
                        try {
                            // Use rate limit handler to search subreddit
                            const searchResults = await this.rateLimitHandler.searchSubredditWithRateLimit(subredditName, {
                                query: query,
                                limit: 1, // Further limit posts per query to reduce API calls
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
                        await this.delay(2000);
                    }
                } catch (err) {
                    console.warn(`Error accessing subreddit ${subredditName}:`, err.message);
                }

                // Add a delay between subreddits to respect rate limits
                await this.delay(3000);
            }

            if (allTexts.length === 0) {
                console.warn('No relevant posts found - using fallback');
                return {
                    success: false,
                    trends: this.getFallbackReddit(),
                    postsFound: 0,
                    usedAi: false,
                    error: 'No relevant posts found in the specified subreddits'
                };
            }

            // Combine all texts and analyze with Gemini
            const combinedText = allTexts.join('\n\n---\n\n');

            // NEW STEP: Analyze sentiment and emotion before generating ideas
            const sentimentAnalysisResult = await this.analyzeSentimentAndEmotion(combinedText);

            const analysisPrompt = `Analyze the following Reddit posts and extract key user pain points, unmet needs, and potential business opportunities for tools/services. Focus on frustration, gaps in existing solutions, and desires for new tools.

Posts:
${combinedText}

Please summarize the most common and significant pain points, tool gaps, and user needs. Respond with a JSON array of strings, where each string is a specific pain point or need. Limit to 30 items. Example format: ["Pain point 1", "Pain point 2", "Pain point 3"]`;

            const analysisResult = await generateBusinessIdeas(analysisPrompt);

            console.log('Raw AI response:', analysisResult); // Debug logging

            // Try to parse as JSON first
            let needs = [];
            try {
                const parsed = JSON.parse(analysisResult);
                if (Array.isArray(parsed)) {
                    needs = parsed.slice(0, 30);
                }
            } catch (e) {
                // If not JSON, try to extract from bullet points or numbered lists
                const lines = analysisResult.split('\n').map(line => line.trim());
                const bulletPoints = lines.filter(line =>
                    line.startsWith('-') || line.startsWith('*') || /^\d+\./.test(line)
                );
                needs = bulletPoints.map(line =>
                    line.replace(/^[-*\d\.\s]*/, '').trim()
                ).slice(0, 30);
            }

            // If still no needs, try to extract from paragraphs
            if (needs.length === 0) {
                const sentences = analysisResult.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 20);
                needs = sentences.slice(0, 30);
            }

            // If AI didn't provide valid pain points, fall back with reduced success
            if (needs.length === 0) {
                console.warn('No valid pain points extracted from AI response');
                return {
                    success: false,
                    trends: this.getFallbackReddit(),
                    postsFound: allTexts.length,
                    usedAi: false,
                    error: 'AI response received but no valid pain points extracted',
                    rawResponse: analysisResult.substring(0, 500) // Log first 500 chars for debugging
                };
            }

            return {
                success: true,
                trends: needs,
                postsFound: allTexts.length,
                usedAi: true,
                sentimentData: sentimentAnalysisResult.data
            };
        } catch (error) {
            console.error('Error extracting Reddit needs:', error);
            return {
                success: false,
                error: error.message,
                trends: this.getFallbackReddit(),
                postsFound: allTexts ? allTexts.length : 0,
                usedAi: false
            };
        }
    }

    // Combine research from all platforms
    async getCombinedResearch(topic = '') {
        try {
            console.log(`Researching trends for: ${topic}`);

            // Check if Twitter is configured and available
            if (!this.twitterReadOnly) {
                // Twitter is disabled, only use Reddit
                console.log('Twitter API not configured or usage cap exceeded - using Reddit only');
                const redditData = await this.getRedditTrends();

                return {
                    success: redditData.success,
                    trends: redditData.trends || [],
                    sources: {
                        twitter: false,
                        reddit: redditData.success
                    },
                    error: redditData.error
                };
            }

            // Twitter is available, use both platforms
            const [twitterData, redditData] = await Promise.allSettled([
                this.getTwitterTrends(),
                this.getRedditTrends()
            ]);

            const allTrends = [
                // Include all Reddit needs (they are already filtered to be relevant)
                ...(redditData.status === 'fulfilled' ? redditData.value.trends || [] : []),
                // Include all Twitter needs (they are now also pain points similar to Reddit)
                ...(twitterData.status === 'fulfilled' ? twitterData.value.trends || [] : [])
            ];

            // Remove duplicates
            const uniqueTrends = [...new Set(allTrends)];

            const redditSentimentData = redditData.status === 'fulfilled' ? redditData.value.sentimentData : null;

            return {
                success: true,
                trends: uniqueTrends.length > 0 ? uniqueTrends.slice(0, 30) : this.getFallbackTrends(), // Limit to 30 trends
                sources: {
                    twitter: twitterData.status === 'fulfilled',
                    reddit: redditData.status === 'fulfilled'
                },
                sentimentData: redditSentimentData
            };
        } catch (error) {
            console.error('Error in combined research:', error);
            return {
                success: false,
                error: error.message,
                trends: this.getFallbackTrends()
            };
        }
    }

    // Fallback data for when APIs are not available
    getFallbackTrends() {
        return [
            'Sustainable energy solutions',
            'AI-powered productivity tools',
            'Remote work collaboration platforms',
            'E-commerce optimization',
            'Mental health apps',
            'Micro-SaaS solutions',
            'NFT marketplaces',
            'Crypto payment systems',
            'Virtual reality education',
            'Smart home automation'
        ];
    }

    getFallbackTwitter() {
        return [
            '#BusinessTips',
            '#StartUpLife',
            '#Entrepreneurship',
            '#Innovation',
            '#TechTrends',
            '#DigitalMarketing',
            '#ProductivityHacks',
            '#SaaS',
            '#Ecommerce',
            '#FinTech'
        ];
    }

    getFallbackReddit() {
        return [
            'Need better tools for tracking project expenses and budgeting',
            'Frustration with managing multiple social media accounts manually',
            'Lack of affordable HR tools for small teams',
            'Difficulty finding reliable freelance talent quickly',
            'Pain point with inventory management for physical products',
            'Need for automated lead generation for service businesses',
            'Struggling with SEO tools that provide actionable insights',
            'Looking for simple accounting software without complexity',
            'Need tools for scheduling and automating content creation',
            'Pain with customer feedback collection and analysis'
        ];
    }
}

// Function to enhance prompts with research data
export const enhancePromptWithResearch = async (basePrompt, researchData) => {
    if (!researchData.success || !researchData.trends || researchData.trends.length === 0) {
        return basePrompt;
    }

    const trendsList = researchData.trends.slice(0, 5).map(trend =>
        `"${trend.replace(/[#"']/g, '')}"`
    ).join(', ');

    const enhancedPrompt = `${basePrompt}

Incorporate insights from current market trends including: ${trendsList}.
Consider these trending topics when developing your business idea recommendations to ensure relevance and timeliness.`;

    return enhancedPrompt;
};

// Export a function to create an instance of IdeaResearch
export async function createIdeaResearch() {
    const research = new IdeaResearch();
    await research.setupClients(); // Ensure setup is completed before returning
    return research;
}
