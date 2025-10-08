'use client';

import { useState } from 'react';

export default function RedditTest() {
    const [subreddits, setSubreddits] = useState('startups,entrepreneurship,smallbusiness');
    const [searchQuery, setSearchQuery] = useState('I need a tool for');
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Predefined search queries for common needs
    const predefinedQueries = [
        'I need a tool for',
        'I need something for',
        'looking for a tool',
        'need a tool to',
        'what tool should I use for',
        'need a mobile app for',
        'need a web application for',
        'pain point with',
        'struggling with',
        'recommend a tool for',
        'best tool for',
        'can\'t find a tool',
        'needing help with',
        'frustrated with my current',
        'what software do you use',
        'alternative to'
    ];

    const [selectedQueries, setSelectedQueries] = useState({
        'I need a tool for': true,
        'I need something for': true,
        'looking for a tool': true,
        'need a tool to': true,
        'what tool should I use for': true,
        'need a mobile app for': true,
        'need a web application for': true,
        'pain point with': false,
        'struggling with': false,
        'recommend a tool for': false,
        'best tool for': false,
        'can\'t find a tool': false,
        'needing help with': false,
        'frustrated with my current': false,
        'what software do you use': false,
        'alternative to': false
    });

    const handleTest = async () => {
        setError('');
        setLoading(true);
        setResults(null);

        try {
            // Get selected queries from checkboxes
            const selectedQueryList = Object.entries(selectedQueries)
                .filter(([_, isSelected]) => isSelected)
                .map(([query, _]) => query);

            // Also include any manually entered query
            const manualQueries = searchQuery.split(',').map(q => q.trim()).filter(q => q && !selectedQueryList.includes(q));
            const allQueries = [...selectedQueryList, ...manualQueries];

            if (allQueries.length === 0) {
                setError('Please enter at least one search query');
                return;
            }

            // Format subreddits
            const subredditList = subreddits.split(',').map(s => s.trim()).filter(s => s);

            if (subredditList.length === 0) {
                setError('Please enter at least one subreddit');
                return;
            }

            // Call the test research API with Reddit platform
            const response = await fetch(`/api/test-research?platform=reddit`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const data = await response.json();
            setResults(data);
        } catch (err) {
            setError(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleQueryToggle = (query) => {
        setSelectedQueries(prev => ({
            ...prev,
            [query]: !prev[query]
        }));
    };

    const handleSelectAll = () => {
        setSelectedQueries(prev => {
            const updated = {};
            for (const query of predefinedQueries) {
                updated[query] = true;
            }
            return updated;
        });
    };

    const handleClearAll = () => {
        setSelectedQueries(prev => {
            const updated = {};
            for (const query of predefinedQueries) {
                updated[query] = false;
            }
            return updated;
        });
    };

    return (
        <div className="max-w-4xl mx-auto p-8">
            <h1 className="text-3xl font-bold mb-8">Reddit Research Test</h1>

            <div className="mb-8 p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Test Configuration</h2>

                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium">
                            Predefined Search Queries:
                        </label>
                        <div className="space-x-2">
                            <button
                                type="button"
                                onClick={handleSelectAll}
                                className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                            >
                                Select All
                            </button>
                            <button
                                type="button"
                                onClick={handleClearAll}
                                className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                            >
                                Clear All
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                        {predefinedQueries.map((query) => (
                            <div key={query} className="flex items-center">
                                <input
                                    type="checkbox"
                                    id={query}
                                    checked={selectedQueries[query] || false}
                                    onChange={() => handleQueryToggle(query)}
                                    className="h-4 w-4 text-blue-600 rounded"
                                />
                                <label htmlFor={query} className="ml-2 text-sm">
                                    {query}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">
                        Additional Search Queries (comma-separated):
                    </label>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md"
                        placeholder="e.g., business idea, startup advice, productivity tool"
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">
                        Subreddits to Search (comma-separated):
                    </label>
                    <input
                        type="text"
                        value={subreddits}
                        onChange={(e) => setSubreddits(e.target.value)}
                        className="w-full p-3 border-gray-300 rounded-md"
                        placeholder="e.g., startups,entrepreneurship,smallbusiness"
                    />
                    <p className="text-xs text-gray-500 mt-1">Common subreddits: startups, entrepreneurship, smallbusiness, AskReddit, business</p>
                </div>

                <button
                    onClick={handleTest}
                    disabled={loading}
                    className="px-6 py-3 bg-blue-60 text-white rounded-md disabled:opacity-50 hover:bg-blue-700 transition-colors"
                >
                    {loading ? 'Searching Reddit...' : 'Start Reddit Search'}
                </button>

                {loading && (
                    <p className="text-xs text-gray-500 mt-2">
                        {loading ? 'Currently searching Reddit for posts matching your queries...' : 'Click to start searching Reddit for business idea opportunities'}
                    </p>
                )}

                {error && (
                    <div className="mt-4 p-4 bg-red-100 border-red-300 text-red-700 rounded-md">
                        {error}
                    </div>
                )}
            </div>

            {results && (
                <div className="mt-8 p-6 border-gray-200 rounded-lg">
                    <h2 className="text-xl font-semibold mb-4">Results</h2>

                    <div className="mb-4 p-4 rounded-md">
                        <p><span className="font-medium">Status:</span> {results.success ? 'Success' : 'Failed'}</p>
                        {results.error && <p><span className="font-medium">Error:</span> {results.error}</p>}
                        {results.postsFound && <p><span className="font-medium">Posts Found:</span> {results.postsFound}</p>}
                        {results.usedAi && <p><span className="font-medium">AI Analysis:</span> Completed</p>}
                    </div>

                    {results.trends && results.trends.length > 0 && (
                        <div>
                            <h3 className="font-medium mb-2">Trending Needs/Pain Points:</h3>
                            <div className="">
                                {results.trends.map((trend, index) => (
                                    <div key={index} className="p-3 border border-gray-200 rounded-md">
                                        <p className="text-sm">{trend}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="mt-8 p-4 border border-blue-200 rounded-md">
                <h3 className="font-semibold mb-2">How it works:</h3>
                <ul className="list-disc list-inside text-sm space-y-1">
                    <li>Searches specified subreddits for posts matching your queries</li>
                    <li>Extracts user pain points, needs, and business opportunities</li>
                    <li>Uses AI to analyze and summarize the findings</li>
                    <li>Focuses on actionable insights for business idea generation</li>
                </ul>
            </div>
        </div>
    );
}