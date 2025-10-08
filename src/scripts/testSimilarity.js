// Script to test similarity on existing database ideas
// Run with: npm run test-similarity (you'll need to add this script to package.json)

import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient.js';
import { calculateIdeaSimilarity, findSimilarIdea } from '@/lib/similarityUtils.js';

async function runSimilarityTest(threshold = 0.7, weights = { title: 0.6, description: 0.4 }) {
    console.log(`Starting similarity test with threshold: ${threshold}, weights:`, weights);

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
        console.error('Supabase is not configured. Database functionality is disabled.');
        process.exit(1);
    }

    // Fetch all ideas from the database
    console.log('Fetching all ideas from database for similarity test...');
    const { data: allIdeas, error: fetchError } = await supabase
        .from('business_ideas')
        .select('id, title, description, category, created_at');

    if (fetchError) {
        console.error('Error fetching ideas for similarity test:', fetchError);
        process.exit(1);
    }

    console.log(`Fetched ${allIdeas.length} ideas for similarity test`);

    // Find similar pairs of ideas
    const similarPairs = [];
    const processed = new Set(); // To avoid duplicate pairs

    for (let i = 0; i < allIdeas.length; i++) {
        for (let j = i + 1; j < allIdeas.length; j++) {
            // Create a unique key to avoid processing the same pair twice
            const pairKey = i < j ? `${i}-${j}` : `${j}-${i}`;

            if (processed.has(pairKey)) continue;
            processed.add(pairKey);

            const similarity = calculateIdeaSimilarity(allIdeas[i], allIdeas[j], weights);

            if (similarity >= threshold) {
                similarPairs.push({
                    idea1: allIdeas[i],
                    idea2: allIdeas[j],
                    similarity: similarity
                });
            }
        }
    }

    // Sort similar pairs by similarity in descending order
    similarPairs.sort((a, b) => b.similarity - a.similarity);

    console.log(`\n--- SIMILARITY TEST RESULTS ---`);
    console.log(`Threshold: ${threshold}`);
    console.log(`Weights:`, weights);
    console.log(`Total ideas in database: ${allIdeas.length}`);
    console.log(`Similar pairs found: ${similarPairs.length}`);

    if (similarPairs.length > 0) {
        console.log(`\n--- TOP 10 MOST SIMILAR PAIRS ---`);
        similarPairs.slice(0, 10).forEach((pair, index) => {
            console.log(`\n${index + 1}. Similarity: ${pair.similarity.toFixed(3)}`);
            console.log(`   Idea 1: "${pair.idea1.title}"`);
            console.log(`   Idea 2: "${pair.idea2.title}"`);
            console.log(`   Category 1: ${pair.idea1.category}, Category 2: ${pair.idea2.category}`);
        });
    } else {
        console.log('\nNo similar pairs found with the current threshold.');
    }

    console.log(`\n--- RECOMMENDATIONS ---`);
    if (similarPairs.length === 0) {
        console.log('No similar pairs found. Consider lowering the threshold to identify potential duplicates.');
    } else if (similarPairs.length > allIdeas.length * 0.1) { // More than 10% are similar
        console.log('A high number of similar pairs found. Consider increasing the threshold to avoid false positives.');
    } else {
        console.log('The current threshold seems appropriate for identifying duplicates.');
    }

    return {
        threshold,
        weights,
        totalIdeas: allIdeas.length,
        similarPairsCount: similarPairs.length,
        similarPairs: similarPairs
    };
}

// Run the test if this script is executed directly
if (require.main === module) {
    // Parse command line arguments
    const args = process.argv.slice(2);
    let threshold = 0.7;
    let weights = { title: 0.6, description: 0.4 };

    // Look for threshold in arguments
    const thresholdArg = args.find(arg => arg.startsWith('--threshold='));
    if (thresholdArg) {
        threshold = parseFloat(thresholdArg.split('=')[1]);
    }

    // Look for weights in arguments
    const weightsArg = args.find(arg => arg.startsWith('--weights='));
    if (weightsArg) {
        try {
            const weightsStr = weightsArg.split('=')[1];
            weights = JSON.parse(weightsStr);
        } catch (e) {
            console.error('Invalid weights format. Use: --weights=\'{"title": 0.6, "description": 0.4}\'');
            process.exit(1);
        }
    }

    runSimilarityTest(threshold, weights).catch(err => {
        console.error('Error running similarity test:', err);
        process.exit(1);
    });
}

export { runSimilarityTest };