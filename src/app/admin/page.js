'use client';

import { useState } from 'react';
import Head from 'next/head';

export default function AdminPage() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [logSteps, setLogSteps] = useState([]);
    const [additionalContext, setAdditionalContext] = useState('');
    const [result, setResult] = useState(null);

    const handleGenerateIdeas = async () => {
        setIsGenerating(true);
        setLogSteps([]);
        setResult(null);

        try {
            const response = await fetch('/api/admin/generate-ideas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ additionalContext }),
            });

            if (response.ok && response.body) {
                const reader = response.body.getReader();
                const decoder = new TextDecoder();

                let buffer = '';

                while (true) {
                    const { done, value } = await reader.read();

                    if (done) {
                        break;
                    }

                    buffer += decoder.decode(value, { stream: true });

                    // Process each complete SSE message
                    const lines = buffer.split('\n');
                    buffer = lines.pop(); // Keep incomplete line in buffer

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.slice(6)); // Remove 'data: ' prefix

                                switch (data.type) {
                                    case 'log':
                                        setLogSteps(prev => [...prev, data.payload]);
                                        break;
                                    case 'error':
                                        setResult({
                                            success: false,
                                            error: data.payload.error || 'Failed to generate ideas',
                                        });
                                        setIsGenerating(false);
                                        return; // Stop processing
                                    case 'complete':
                                        setResult({
                                            success: true,
                                            message: data.payload.message,
                                            count: data.payload.count,
                                            postCount: data.payload.postCount,
                                        });
                                        setLogSteps(data.payload.logSteps || []);
                                        setIsGenerating(false);
                                        return; // Stop processing
                                    case 'init':
                                        // Initial message, can be ignored or used for UI feedback
                                        break;
                                    default:
                                        console.warn('Unknown SSE event type:', data.type);
                                }
                            } catch (e) {
                                console.error('Error parsing SSE data:', e);
                            }
                        }
                    }
                }
            } else {
                setResult({
                    success: false,
                    error: 'Failed to connect to the server',
                });
            }
        } catch (error) {
            setResult({
                success: false,
                error: error.message || 'An error occurred while generating ideas',
            });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-100 p-8">
            <Head>
                <title>Admin - Idea Generation</title>
            </Head>

            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-white mb-8">Admin Dashboard - Idea Generation</h1>

                <div className="bg-gray-900/80 backdrop-blur-md rounded-lg shadow-md p-6 mb-8 border border-gray-700">
                    <h2 className="text-xl font-semibold text-white mb-4">Generate Business Ideas</h2>

                    <div className="mb-6">
                        <label htmlFor="additionalContext" className="block text-sm font-medium text-gray-300 mb-2">
                            Additional Context for Gemini
                        </label>
                        <textarea
                            id="additionalContext"
                            value={additionalContext}
                            onChange={(e) => setAdditionalContext(e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-800/80 text-white backdrop-blur-sm"
                            placeholder="Enter any additional context, insights, or information you've gathered from Twitter or other sources that might help Gemini generate better ideas..."
                        />
                        <p className="mt-2 text-sm text-gray-400">
                            This additional context will be provided to Gemini to help generate more targeted and relevant business ideas.
                        </p>
                    </div>

                    <button
                        onClick={handleGenerateIdeas}
                        disabled={isGenerating}
                        className={`px-6 py-3 rounded-md text-white font-medium ${isGenerating
                            ? 'bg-gray-600 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                            }`}
                    >
                        {isGenerating ? 'Generating Ideas...' : 'Generate Ideas'}
                    </button>
                </div>

                {result && (
                    <div className={`bg-gray-900/80 backdrop-blur-md rounded-lg shadow-md p-6 mb-8 border border-gray-700 ${result.success ? 'border-green-500' : 'border-red-500'}`}>
                        <h2 className="text-xl font-semibold text-white mb-4">Generation Result</h2>
                        {result.success ? (
                            <div className="text-green-400">
                                <p className="font-medium">{result.message}</p>
                                <p>{result.count} ideas generated from {result.postCount} Reddit posts.</p>
                            </div>
                        ) : (
                            <div className="text-red-400">
                                <p className="font-medium">Error: {result.error}</p>
                            </div>
                        )}
                    </div>
                )}

                {logSteps.length > 0 && (
                    <div className="bg-gray-900/80 backdrop-blur-md rounded-lg shadow-md p-6 border border-gray-700">
                        <h2 className="text-xl font-semibold text-white mb-4">Detailed Generation Log</h2>
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                            {logSteps.map((log, index) => (
                                <div key={index} className="border-l-4 border-indigo-50 pl-4 py-2 bg-gray-800/50 rounded-r">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-medium text-white">{log.step}</div>
                                            <div className="text-sm text-gray-300 mt-1">{log.details}</div>
                                        </div>
                                        <div className="text-xs text-gray-500 whitespace-nowrap">
                                            {new Date(log.timestamp).toLocaleTimeString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}