// twitterRateLimitHandler.js
// Handles Twitter API rate limiting for multiple category searches
// Implements request queuing and state persistence to avoid hitting rate limits

import { TwitterApi } from 'twitter-api-v2';
import { createPersistenceAdapter, loadTwitterState, saveTwitterState } from './twitterStatePersistence.js';

class TwitterRateLimitHandler {
    constructor(persistenceAdapter = null) {
        // Twitter API setup for app-only (for search/trends)
        if (process.env.TWITTER_BEARER_TOKEN) {
            this.twitterReadOnly = new TwitterApi(process.env.TWITTER_BEARER_TOKEN).readOnly;
        } else {
            throw new Error('Twitter Bearer Token not configured - TWITTER_BEARER_TOKEN environment variable required');
        }

        // Rate limiting configuration for Twitter API v2 search endpoint
        // 300 requests per 15-minute window (90 seconds) = 1 request every 3 seconds on average
        this.RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes in milliseconds
        this.MAX_REQUESTS_PER_WINDOW = 300;
        this.MIN_DELAY_BETWEEN_REQUESTS = 3000; // 3 seconds minimum delay

        // Track request timestamps to manage rate limiting
        this.requestTimestamps = [];
        this.isProcessing = false;
        this.requestQueue = [];
        this.processingState = {
            completedCategories: [],
            remainingCategories: [],
            results: {},
            lastProcessedAt: null
        };

        // Initialize persistence adapter
        this.persistence = persistenceAdapter;
    }

    // Initialize the handler with optional state loading
    async initialize(loadSavedState = true) {
        if (!this.persistence) {
            this.persistence = await createPersistenceAdapter();
        }

        if (loadSavedState) {
            const savedState = await this.persistence.loadState();
            if (savedState) {
                this.loadState(savedState);
                console.log('Loaded saved state from persistence');
            }
        }
    }

    // Utility function for adding delays
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Check if we're within rate limits
    isWithinRateLimit() {
        const now = Date.now();
        const windowStart = now - this.RATE_LIMIT_WINDOW;

        // Filter out requests that are outside the current window
        this.requestTimestamps = this.requestTimestamps.filter(timestamp => timestamp > windowStart);

        // Check if we've hit the max requests per window
        return this.requestTimestamps.length < this.MAX_REQUESTS_PER_WINDOW;
    }

    // Wait until we're within rate limits
    async waitForRateLimit() {
        while (!this.isWithinRateLimit()) {
            const now = Date.now();
            const windowStart = now - this.RATE_LIMIT_WINDOW;
            const oldestRequest = this.requestTimestamps[0] || now;
            const timeUntilWindowReset = windowStart + this.RATE_LIMIT_WINDOW - now;

            console.log(`Rate limit reached. Waiting ${Math.ceil(timeUntilWindowReset / 1000)} seconds until window reset...`);
            await this.delay(timeUntilWindowReset + 1000); // Add 1 second buffer
        }
    }

    // Add a request to the queue
    async enqueueRequest(searchQuery, category) {
        const request = {
            query: searchQuery,
            category: category,
            timestamp: Date.now()
        };

        this.requestQueue.push(request);
        console.log(`Enqueued request for category: ${category}. Queue size: ${this.requestQueue.length}`);

        // Start processing if not already processing
        if (!this.isProcessing) {
            await this.processQueue();
        }

        return this.processingState.results[category];
    }

    // Process the request queue with rate limiting
    async processQueue() {
        if (this.isProcessing || this.requestQueue.length === 0) {
            return;
        }

        this.isProcessing = true;
        console.log('Starting to process request queue...');

        while (this.requestQueue.length > 0) {
            const request = this.requestQueue.shift();
            const { query, category } = request;

            try {
                // Wait for rate limit if necessary
                await this.waitForRateLimit();

                // Add minimum delay between requests
                const now = Date.now();
                const timeSinceLastRequest = now - (this.requestTimestamps[this.requestTimestamps.length - 1] || 0);
                if (timeSinceLastRequest < this.MIN_DELAY_BETWEEN_REQUESTS) {
                    const delayNeeded = this.MIN_DELAY_BETWEEN_REQUESTS - timeSinceLastRequest;
                    console.log(`Waiting ${delayNeeded}ms for minimum delay between requests...`);
                    await this.delay(delayNeeded);
                }

                console.log(`Processing request for category: ${category}`);

                // Make the API request with retry logic
                const result = await this.makeTwitterRequestWithRetry(query, category);

                // Store the result
                this.processingState.results[category] = result;
                this.processingState.completedCategories.push(category);

                // Record this request timestamp
                this.requestTimestamps.push(Date.now());

                console.log(`Successfully processed category: ${category}`);

            } catch (error) {
                console.error(`Error processing category ${category}:`, error.message);

                // Store error result
                this.processingState.results[category] = {
                    success: false,
                    error: error.message,
                    data: null
                };
                this.processingState.completedCategories.push(category);
            }

            // Update last processed time
            this.processingState.lastProcessedAt = new Date().toISOString();
        }

        this.isProcessing = false;
        console.log('Finished processing all requests in queue');
    }

    // Make a Twitter API request with retry logic for rate limiting
    async makeTwitterRequestWithRetry(query, category, maxRetries = 3) {
        let retries = 0;

        while (retries <= maxRetries) {
            try {
                const result = await this.twitterReadOnly.v2.search(query, {
                    max_results: 20, // Adjust based on your needs
                    sort_order: 'recency'
                });

                return {
                    success: true,
                    data: result,
                    category: category,
                    requestTime: new Date().toISOString()
                };

            } catch (error) {
                const isRateLimitError = this.isRateLimitError(error);

                if (isRateLimitError && retries < maxRetries) {
                    const delayMs = Math.pow(2, retries) * 5000; // Exponential backoff starting at 5 seconds
                    console.warn(`Rate limit hit for category ${category}. Retrying in ${delayMs}ms... (Attempt ${retries + 1}/${maxRetries})`);

                    // Check if error has rate limit reset information
                    if (error.rateLimit && error.rateLimit.reset) {
                        const resetTime = error.rateLimit.reset * 1000; // Convert to milliseconds
                        const currentTime = Date.now();
                        const timeUntilReset = resetTime - currentTime;

                        if (timeUntilReset > 0) {
                            console.warn(`Using rate limit reset time: ${new Date(resetTime).toISOString()}`);
                            await this.delay(timeUntilReset + 1000); // Add 1 second buffer
                        } else {
                            await this.delay(delayMs);
                        }
                    } else {
                        await this.delay(delayMs);
                    }

                    retries++;
                } else if (isRateLimitError) {
                    throw new Error(`Rate limit exceeded after ${maxRetries} retries for category ${category}`);
                } else {
                    // Not a rate limit error, throw immediately
                    throw error;
                }
            }
        }
    }

    // Check if error is a rate limit error
    isRateLimitError(error) {
        return error.code === 429 ||
            error.status === 429 ||
            (error.data && error.data.title === 'Too Many Requests') ||
            (error.rateLimitResetAt) ||
            (error.message && error.message.includes('429')) ||
            (error.rateLimit && error.rateLimit.remaining === 0);
    }

    // Get current processing state
    getProcessingState() {
        return {
            ...this.processingState,
            queueSize: this.requestQueue.length,
            isProcessing: this.isProcessing,
            rateLimitInfo: {
                currentRequests: this.requestTimestamps.length,
                maxRequests: this.MAX_REQUESTS_PER_WINDOW,
                windowMs: this.RATE_LIMIT_WINDOW,
                withinLimit: this.isWithinRateLimit()
            }
        };
    }

    // Process multiple categories with rate limiting
    async processMultipleCategories(categories, searchQueryTemplate = '"{category}" lang:en -is:retweet') {
        console.log(`Starting to process ${categories.length} categories with rate limiting...`);

        // Initialize remaining categories if not already set
        if (this.processingState.remainingCategories.length === 0) {
            this.processingState.remainingCategories = [...categories];
        }

        // Filter out already completed categories
        const pendingCategories = categories.filter(cat => !this.processingState.completedCategories.includes(cat));

        if (pendingCategories.length === 0) {
            console.log('All categories have already been processed');
            return this.processingState.results;
        }

        console.log(`Processing ${pendingCategories.length} pending categories:`, pendingCategories);

        // Enqueue all requests
        const promises = pendingCategories.map(category => {
            const searchQuery = searchQueryTemplate.replace('{category}', category);
            return this.enqueueRequest(searchQuery, category);
        });

        // Wait for all requests to complete
        await Promise.all(promises);

        return this.processingState.results;
    }

    // Save current state to a file or database (simplified implementation using memory)
    saveState() {
        // In a real implementation, you might want to save this to a file or database
        // For now, we're keeping it in memory
        return this.getProcessingState();
    }

    // Load state from a file or database (simplified implementation using memory)
    loadState(state) {
        if (state) {
            this.processingState = {
                ...this.processingState,
                ...state
            };
        }
        return this.processingState;
    }
}

// Export a function to create an instance of TwitterRateLimitHandler
export async function createTwitterRateLimitHandler(persistenceAdapter = null) {
    const handler = new TwitterRateLimitHandler(persistenceAdapter);
    await handler.initialize();
    return handler;
}

// Convenience function to process multiple categories with rate limiting
export async function processTwitterCategoriesWithRateLimit(categories, searchQueryTemplate = '"{category}" lang:en -is:retweet') {
    const handler = await createTwitterRateLimitHandler();

    const results = await handler.processMultipleCategories(categories, searchQueryTemplate);

    // Save state after processing
    const stateToSave = handler.getProcessingState();
    await handler.persistence.saveState(stateToSave);

    return {
        results,
        state: stateToSave
    };
}