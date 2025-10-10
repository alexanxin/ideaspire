import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API client
const genAI = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

// Get the generative model - using a more stable model name
const model = genAI ? genAI.getGenerativeModel({
    model: "gemini-flash-latest" // Using a more stable model name
}) : null;

// Function to generate business ideas using Gemini with retry logic
export const generateBusinessIdeas = async (prompt) => {
    if (!model) {
        console.warn('Gemini API key not set. Returning sample response.');
        return getSampleResponse();
    }

    // Maximum number of retry attempts
    const maxRetries = 3;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Gemini API call attempt ${attempt}/${maxRetries}`);

            const result = await model.generateContent({
                contents: [{
                    role: 'user',
                    parts: [{ text: prompt }]
                }]
            });

            const response = await result.response;
            const text = response.text();

            console.log('Successfully received response from Gemini API');
            return text;
        } catch (error) {
            console.error(`Error generating content with Gemini (attempt ${attempt}/${maxRetries}):`, error);
            lastError = error;

            // If this is not the last attempt, wait before retrying
            if (attempt < maxRetries) {
                const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
                console.log(`Waiting ${delay}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    // If all retries failed, log the final error and return sample response
    console.error('All Gemini API attempts failed. Returning sample response.', lastError);
    return getSampleResponse();
};

// Function to format Gemini response into structured business ideas
export const formatBusinessIdeas = (responseText, category = "General") => {
    try {
        // Strip markdown code block formatting if present
        let cleanResponseText = responseText.trim();
        if (cleanResponseText.startsWith('```json')) {
            cleanResponseText = cleanResponseText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanResponseText.startsWith('```')) {
            cleanResponseText = cleanResponseText.replace(/^```\w*\s*/, '').replace(/\s*```$/, '');
        }

        const parsedResponse = JSON.parse(cleanResponseText);

        // Ensure the parsed response is an array of ideas or convert a single object to an array
        const ideasArray = Array.isArray(parsedResponse) ? parsedResponse : [parsedResponse];

        const ideas = ideasArray.map((idea, index) => ({
            id: `${category.toLowerCase()}-${index + 1}`,
            title: idea.title || `Untitled ${category} Idea ${index + 1}`,
            description: idea.description || 'No description provided.',
            marketOpportunity: idea.marketOpportunity || 'No market opportunity provided.',
            targetAudience: idea.targetAudience || 'No target audience provided.',
            revenueModel: idea.revenueModel || 'No revenue model provided.',
            keyChallenges: idea.keyChallenges || 'No key challenges provided.',
            category: category,
            generated: true
        }));

        return ideas.slice(0, 5); // Return top 5 ideas per category
    } catch (error) {
        console.error('Error formatting business ideas:', error);
        // Fallback to a single sample idea if parsing fails
        return [
            {
                id: `${category.toLowerCase()}-fallback-1`,
                title: `Fallback ${category} Idea`,
                description: 'A business opportunity in the field.',
                marketOpportunity: 'Market need for innovative solutions.',
                targetAudience: 'General consumers and businesses.',
                revenueModel: 'Subscription-based.',
                keyChallenges: 'Competition and market adoption.',
                category: category,
                generated: true
            }
        ];
    }
};

// Helper function to extract a meaningful title from the AI response line
const extractTitleFromLine = (line, index) => {
    // Clean up the line and try to extract a title
    const cleanLine = line.replace(/^[\d\.\-\s]*[\:\.\-]?\s*/, '') // Remove numbering and punctuation
        .split('.')[0] // Take only the first sentence
        .trim();

    // If the line is short, use it as title
    if (cleanLine.length <= 60) {
        return cleanLine;
    }

    // Extract first few words as title
    const words = cleanLine.split(' ');
    const titleWords = words.slice(0, 8); // First 8 words
    let title = titleWords.join(' ');

    // Ensure title ends properly
    if (!title.endsWith('?') && !title.endsWith('!')) {
        title += '...';
    }

    return title;
};

// Sample response for development - pain points from Reddit analysis
const getSampleResponse = () => {
    return JSON.stringify([
        "Need better tools for tracking project expenses and budgeting",
        "Frustration with managing multiple social media accounts manually",
        "Lack of affordable HR tools for small teams",
        "Difficulty finding reliable freelance talent quickly",
        "Pain point with inventory management for physical products",
        "Need for automated lead generation for service businesses",
        "Struggling with SEO tools that provide actionable insights",
        "Looking for simple accounting software without complexity",
        "Need tools for scheduling and automating content creation",
        "Pain with customer feedback collection and analysis"
    ]);
};
