import { generateBusinessIdeas } from './src/lib/geminiClient.js';

async function testGeminiAPI() {
    console.log('Testing Gemini API connection...');

    const testPrompt = "Generate a simple business idea in the tech sector. Respond with just the idea title.";

    try {
        const result = await generateBusinessIdeas(testPrompt);
        console.log('Success! Received response from Gemini API:');
        console.log(result);
    } catch (error) {
        console.error('Error calling Gemini API:', error);
    }
}

// Run the test
testGeminiAPI();