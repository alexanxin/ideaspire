// redditRateLimitHandler.js
// Handles Reddit API rate limiting for snoowrap
// Implements request queuing and rate limiting to avoid exceeding Reddit's API limits

import Snoowrap from 'snoowrap';

class RedditRateLimitHandler {
    constructor() {
        // Reddit API rate limits: 60 requests per minute per IP/user
        // 10 requests per minute for unauthenticated requests
        this.RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
        this.MAX_REQUESTS_PER_WINDOW = 50; // Set slightly below limit to be safe
        this.MIN_DELAY_BETWEEN_REQUESTS = 1200; // 1.2 seconds minimum delay (60/50 requests per minute)

        // Track request timestamps to manage rate limiting
        this.requestTimestamps = [];
        this.isProcessing = false;
        this.requestQueue = [];
        this.setupRedditClient();
    }

    setupRedditClient() {
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
                requestDelay: this.MIN_DELAY_BETWEEN_REQUESTS,
                maxRetryAttempts: 3,
                retryErrorCodes: [502, 503, 504, 522]
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

            console.log(`Reddit rate limit reached. Waiting ${Math.ceil(timeUntilWindowReset / 1000)} seconds until window reset...`);
            await this.delay(timeUntilWindowReset + 1000); // Add 1 second buffer
        }
    }

    // Add a request to the queue
    async enqueueRequest(requestFn, requestType, ...args) {
        const request = {
            fn: requestFn,
            args: args,
            type: requestType,
            timestamp: Date.now()
        };

        this.requestQueue.push(request);
        console.log(`Enqueued ${requestType} request. Queue size: ${this.requestQueue.length}`);

        // Start processing if not already processing
        if (!this.isProcessing) {
            await this.processQueue();
        }

        return this.lastResult;
    }

    // Process the request queue with rate limiting
    async processQueue() {
        if (this.isProcessing || this.requestQueue.length === 0) {
            return;
        }

        this.isProcessing = true;
        console.log('Starting to process Reddit request queue...');

        while (this.requestQueue.length > 0) {
            const request = this.requestQueue.shift();
            const { fn, args, type } = request;

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

                console.log(`Processing ${type} request`);

                // Make the API request with retry logic
                const result = await this.makeRedditRequestWithRetry(fn, ...args);

                // Record this request timestamp
                this.requestTimestamps.push(Date.now());

                // Store the result
                this.lastResult = result;

                console.log(`Successfully processed ${type} request`);

            } catch (error) {
                console.error(`Error processing ${type} request:`, error.message);

                // Check if it's a rate limit error
                if (error.message && (error.message.includes('ratelimit') || error.message.includes('429'))) {
                    console.warn(`Rate limit error detected. Waiting before continuing...`);
                    await this.delay(60000); // Wait 1 minute for rate limit reset
                }

                // Re-queue the request if it's a rate limit issue
                if (error.message && error.message.includes('ratelimit')) {
                    this.requestQueue.unshift(request); // Add back to front of queue
                    console.log(`Re-queued ${type} request due to rate limit`);
                }
            }
        }

        this.isProcessing = false;
        console.log('Finished processing all requests in queue');
    }

    // Make a Reddit API request with retry logic for rate limiting
    async makeRedditRequestWithRetry(requestFn, ...args) {
        let retries = 0;
        const maxRetries = 3;

        while (retries <= maxRetries) {
            try {
                const result = await requestFn(...args);

                // If the result has response headers (for snoowrap requests), check rate limit info
                if (result && result.constructor.name === 'Listing') {
                    // Extract rate limit information if available
                    const response = result._r;
                    if (response && response.headers) {
                        const rateLimitUsed = response.headers['x-ratelimit-used'];
                        const rateLimitRemaining = response.headers['x-ratelimit-remaining'];
                        const rateLimitReset = response.headers['x-ratelimit-reset'];

                        if (rateLimitUsed && rateLimitRemaining && rateLimitReset) {
                            console.log(`Rate limit status - Used: ${rateLimitUsed}, Remaining: ${rateLimitRemaining}, Reset in: ${rateLimitReset}s`);
                        }
                    }
                }

                return result;
            } catch (error) {
                const isRateLimitError = this.isRateLimitError(error);

                if (isRateLimitError && retries < maxRetries) {
                    const delayMs = Math.pow(2, retries) * 5000; // Exponential backoff starting at 5 seconds
                    console.warn(`Rate limit hit. Retrying in ${delayMs}ms... (Attempt ${retries + 1}/${maxRetries})`);

                    await this.delay(delayMs);
                    retries++;
                } else if (isRateLimitError) {
                    throw new Error(`Rate limit exceeded after ${maxRetries} retries: ${error.message}`);
                } else {
                    // Not a rate limit error, throw immediately
                    throw error;
                }
            }
        }
    }

    // Check if error is a rate limit error
    isRateLimitError(error) {
        return error.message &&
            (error.message.toLowerCase().includes('ratelimit') ||
                error.message.includes('429') ||
                error.message.toLowerCase().includes('too many requests') ||
                error.message.toLowerCase().includes('exceeded'));
    }

    // Get subreddit by name
    async getSubreddit(subredditName) {
        if (!this.redditClient) {
            throw new Error('Reddit API not configured');
        }

        return this.redditClient.getSubreddit(subredditName);
    }

    // Search in a subreddit
    async searchSubreddit(subredditName, searchOptions) {
        if (!this.redditClient) {
            throw new Error('Reddit API not configured');
        }

        const subreddit = this.redditClient.getSubreddit(subredditName);
        return await subreddit.search(searchOptions);
    }

    // Get comments for a post
    async getPostComments(post, commentOptions) {
        if (!this.redditClient) {
            throw new Error('Reddit API not configured');
        }

        return await post.comments.fetchAll(commentOptions);
    }

    // Get subreddit instance with rate limiting
    async getSubredditWithRateLimit(subredditName) {
        if (!this.redditClient) {
            throw new Error('Reddit API not configured');
        }

        const result = await this.enqueueRequest(
            (name) => this.redditClient.getSubreddit(name),
            'getSubreddit',
            subredditName
        );
        return result;
    }

    // Search subreddit with rate limiting
    async searchSubredditWithRateLimit(subredditName, searchOptions) {
        if (!this.redditClient) {
            throw new Error('Reddit API not configured');
        }

        const subreddit = await this.getSubredditWithRateLimit(subredditName);
        return await this.enqueueRequest(
            async (sub, opts) => {
                const searchResult = await sub.search(opts);

                // Check rate limit headers if available
                if (searchResult && searchResult._r && searchResult._r.headers) {
                    const headers = searchResult._r.headers;
                    const rateLimitUsed = headers['x-ratelimit-used'];
                    const rateLimitRemaining = headers['x-ratelimit-remaining'];
                    const rateLimitReset = headers['x-ratelimit-reset'];

                    if (rateLimitUsed && rateLimitRemaining && rateLimitReset) {
                        console.log(`Search rate limit - Used: ${rateLimitUsed}, Remaining: ${rateLimitRemaining}, Reset in: ${rateLimitReset}s`);

                        // If we're running low on requests, add a small delay
                        if (parseInt(rateLimitRemaining) < 5) {
                            console.log(`Low on rate limit requests, adding delay...`);
                            await this.delay(5000); // 5 second delay if running low
                        }
                    }
                }

                return searchResult;
            },
            'search',
            subreddit,
            searchOptions
        );
    }

    // Get comments with rate limiting
    async getPostCommentsWithRateLimit(post, commentOptions) {
        if (!this.redditClient) {
            throw new Error('Reddit API not configured');
        }

        return await this.enqueueRequest(
            async (p, opts) => {
                const commentsResult = await p.comments.fetchAll(opts);

                // Check rate limit headers if available
                if (commentsResult && commentsResult._r && commentsResult._r.headers) {
                    const headers = commentsResult._r.headers;
                    const rateLimitUsed = headers['x-ratelimit-used'];
                    const rateLimitRemaining = headers['x-ratelimit-remaining'];
                    const rateLimitReset = headers['x-ratelimit-reset'];

                    if (rateLimitUsed && rateLimitRemaining && rateLimitReset) {
                        console.log(`Comments rate limit - Used: ${rateLimitUsed}, Remaining: ${rateLimitRemaining}, Reset in: ${rateLimitReset}s`);

                        // If we're running low on requests, add a small delay
                        if (parseInt(rateLimitRemaining) < 5) {
                            console.log(`Low on rate limit requests, adding delay...`);
                            await this.delay(5000); // 5 second delay if running low
                        }
                    }
                }

                return commentsResult;
            },
            'comments',
            post,
            commentOptions
        );
    }

    // Get current rate limit status
    getRateLimitStatus() {
        const now = Date.now();
        const windowStart = now - this.RATE_LIMIT_WINDOW;
        const currentRequests = this.requestTimestamps.filter(timestamp => timestamp > windowStart).length;

        return {
            currentRequests,
            maxRequests: this.MAX_REQUESTS_PER_WINDOW,
            windowMs: this.RATE_LIMIT_WINDOW,
            withinLimit: currentRequests < this.MAX_REQUESTS_PER_WINDOW,
            remainingRequests: this.MAX_REQUESTS_PER_WINDOW - currentRequests,
            queueSize: this.requestQueue.length,
            isProcessing: this.isProcessing
        };
    }
}

// Export a function to create an instance of RedditRateLimitHandler
export async function createRedditRateLimitHandler() {
    return new RedditRateLimitHandler();
}

// Convenience function to create and initialize the handler
export async function getRedditRateLimitHandler() {
    if (!global.__reddit_rate_limit_handler) {
        global.__reddit_rate_limit_handler = await createRedditRateLimitHandler();
    }
    return global.__reddit_rate_limit_handler;
}