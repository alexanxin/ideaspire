// Utility functions for calculating similarity between ideas

/**
 * Calculates the similarity between two text strings using the Jaccard similarity coefficient
 * @param {string} str1 - First text string
 * @param {string} str2 - Second text string
 * @returns {number} Similarity coefficient between 0 and 1
 */
export function calculateTextSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;

    // Convert strings to lowercase and split into words
    const words1 = new Set(
        str1
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 0)
    );

    const words2 = new Set(
        str2
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 0)
    );

    // Calculate intersection and union
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);

    // Return Jaccard similarity coefficient
    return union.size > 0 ? intersection.size / union.size : 0;
}

/**
 * Calculates the overall similarity between two ideas based on title and description
 * @param {Object} idea1 - First idea object
 * @param {Object} idea2 - Second idea object
 * @param {Object} weights - Weights for different fields (title, description)
 * @returns {number} Overall similarity coefficient between 0 and 1
 */
export function calculateIdeaSimilarity(idea1, idea2, weights = { title: 0.6, description: 0.4 }) {
    const titleSimilarity = calculateTextSimilarity(idea1.title, idea2.title);
    const descriptionSimilarity = calculateTextSimilarity(idea1.description, idea2.description);

    // Calculate weighted average
    const totalWeight = weights.title + weights.description;
    const weightedSimilarity =
        (titleSimilarity * weights.title + descriptionSimilarity * weights.description) / totalWeight;

    return weightedSimilarity;
}

/**
 * Checks if a new idea is similar to any existing ideas in the array
 * @param {Object} newIdea - The new idea to check
 * @param {Array} existingIdeas - Array of existing ideas to compare against
 * @param {number} threshold - Similarity threshold (0-1) above which ideas are considered similar
 * @param {Object} weights - Weights for different fields (title, description)
 * @returns {Object} Result object with isSimilar flag and similarIdea if found
 */
export function findSimilarIdea(newIdea, existingIdeas, threshold = 0.7, weights = { title: 0.6, description: 0.4 }) {
    for (const existingIdea of existingIdeas) {
        const similarity = calculateIdeaSimilarity(newIdea, existingIdea, weights);

        if (similarity >= threshold) {
            return {
                isSimilar: true,
                similarIdea: existingIdea,
                similarity: similarity
            };
        }
    }

    return {
        isSimilar: false,
        similarIdea: null,
        similarity: 0
    };
}

/**
 * Filters out similar ideas from an array based on a threshold
 * @param {Array} ideas - Array of ideas to filter
 * @param {number} threshold - Similarity threshold (0-1) above which ideas are considered duplicates
 * @param {Object} weights - Weights for different fields (title, description)
 * @returns {Array} Filtered array with similar ideas removed
 */
export function filterSimilarIdeas(ideas, threshold = 0.7, weights = { title: 0.6, description: 0.4 }) {
    const uniqueIdeas = [];

    for (const idea of ideas) {
        const similarResult = findSimilarIdea(idea, uniqueIdeas, threshold, weights);

        if (!similarResult.isSimilar) {
            uniqueIdeas.push(idea);
        } else {
            console.log(`Skipping similar idea: "${idea.title}" (similarity: ${similarResult.similarity.toFixed(2)}) with existing idea: "${similarResult.similarIdea.title}"`);
        }
    }

    return uniqueIdeas;
}