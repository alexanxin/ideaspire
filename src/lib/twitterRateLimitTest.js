// twitterRateLimitTest.js
// Test script to demonstrate the Twitter rate limit handler functionality

import { processTwitterCategoriesWithRateLimit } from './twitterRateLimitHandler.js';

async function runTwitterRateLimitTest() {
    console.log('Starting Twitter Rate Limit Handler Test...\n');

    // Define test categories
    const testCategories = [
        'technology',
        'healthcare',
        'finance',
        'education',
        'marketing',
        'ecommerce',
        'artificial intelligence',
        'sustainability',
        'remote work',
        'cybersecurity'
    ];

    console.log(`Testing with ${testCategories.length} categories:`, testCategories);

    try {
        // Process categories with rate limiting
        const result = await processTwitterCategoriesWithRateLimit(
            testCategories,
            '"{category}" OR "{category} ideas" OR "{category} trends" lang:en -is:retweet'
        );

        console.log('\n--- Processing Results ---');
        console.log('Completed categories:', result.state.completedCategories.length);
        console.log('Results received for categories:', Object.keys(result.results));

        console.log('\n--- Category Results ---');
        for (const [category, data] of Object.entries(result.results)) {
            if (data.success) {
                console.log(`✓ ${category}: Success (${data.data?.data?.length || 0} tweets)`);
            } else {
                console.log(`✗ ${category}: Failed - ${data.error}`);
            }
        }

        console.log('\n--- Rate Limit Information ---');
        console.log('Current requests in window:', result.state.rateLimitInfo.currentRequests);
        console.log('Max requests allowed:', result.state.rateLimitInfo.maxRequests);
        console.log('Within rate limit:', result.state.rateLimitInfo.withinLimit);
        console.log('Processing queue size:', result.state.queueSize);
        console.log('Is processing:', result.state.isProcessing);

        console.log('\nTest completed successfully!');

    } catch (error) {
        console.error('Test failed with error:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Also export a function to run the test
export async function runTest() {
    await runTwitterRateLimitTest();
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runTwitterRateLimitTest();
}