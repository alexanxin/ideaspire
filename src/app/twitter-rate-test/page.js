'use client';

import { useState } from 'react';

export default function TwitterRateLimitTest() {
    const [categories, setCategories] = useState('');
    const [searchTemplate, setSearchTemplate] = useState('"{category}" OR "{category} ideas" lang:en -is:retweet');
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Predefined categories with checkboxes
    const predefinedCategories = [
        'technology', 'healthcare', 'finance', 'education', 'marketing',
        'ecommerce', 'artificial intelligence', 'sustainability', 'remote work',
        'cybersecurity', 'gaming', 'fitness', 'travel', 'food', 'fashion'
    ];

    const [selectedCategories, setSelectedCategories] = useState({
        technology: true,
        healthcare: true,
        finance: true,
        education: true,
        marketing: true,
        ecommerce: false,
        'artificial intelligence': false,
        sustainability: false,
        'remote work': false,
        cybersecurity: false,
        gaming: false,
        fitness: false,
        travel: false,
        food: false,
        fashion: false
    });

    const handleTest = async () => {
        setError('');
        setLoading(true);
        setResults(null);

        try {
            // Get selected categories from checkboxes
            const selectedCategoryList = Object.entries(selectedCategories)
                .filter(([_, isSelected]) => isSelected)
                .map(([category, _]) => category);

            // Also include any manually entered categories
            const manualCategories = categories.split(',').map(cat => cat.trim()).filter(cat => cat && !selectedCategoryList.includes(cat));
            const allCategories = [...selectedCategoryList, ...manualCategories];

            if (allCategories.length === 0) {
                setError('Please select at least one category');
                return;
            }

            const response = await fetch('/api/twitter-rate-limit-handler', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    categories: allCategories,
                    searchQueryTemplate: searchTemplate
                }),
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

    const handleCategoryToggle = (category) => {
        setSelectedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    const handleSelectAll = () => {
        setSelectedCategories(prev => {
            const updated = {};
            for (const cat of predefinedCategories) {
                updated[cat] = true;
            }
            return updated;
        });
    };

    const handleClearAll = () => {
        setSelectedCategories(prev => {
            const updated = {};
            for (const cat of predefinedCategories) {
                updated[cat] = false;
            }
            return updated;
        });
    };

    return (
        <div className="max-w-4xl mx-auto p-8">
            <h1 className="text-3xl font-bold mb-8">Twitter Rate Limit Handler Test</h1>

            <div className="mb-8 p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Test Configuration</h2>

                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium">
                            Predefined Categories:
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-4">
                        {predefinedCategories.map((category) => (
                            <div key={category} className="flex items-center">
                                <input
                                    type="checkbox"
                                    id={category}
                                    checked={selectedCategories[category] || false}
                                    onChange={() => handleCategoryToggle(category)}
                                    className="h-4 w-4 text-blue-60 rounded"
                                />
                                <label htmlFor={category} className="ml-2 text-sm">
                                    {category}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">
                        Additional Categories (comma-separated):
                    </label>
                    <input
                        type="text"
                        value={categories}
                        onChange={(e) => setCategories(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md"
                        placeholder="e.g., saas,startups,blockchain"
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">
                        Search Query Template:
                    </label>
                    <textarea
                        value={searchTemplate}
                        onChange={(e) => setSearchTemplate(e.target.value)}
                        className="w-full p-3 border-gray-300 rounded-md h-24"
                        placeholder="Use {category} as placeholder"
                    />
                    <p className="text-xs text-gray-500 mt-1">Use {`{category}`} as a placeholder for the category name</p>
                </div>

                <button
                    onClick={handleTest}
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-md disabled:opacity-50 hover:bg-blue-700 transition-colors"
                >
                    {loading ? 'Processing Categories...' : 'Start Rate-Limited Search'}
                </button>

                {error && (
                    <div className="mt-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-md">
                        {error}
                    </div>
                )}
            </div>

            {results && (
                <div className="mt-8 p-6 border-gray-200 rounded-lg">
                    <h2 className="text-xl font-semibold mb-4">Results</h2>

                    <div className="mb-4 p-4 bg-green-50 rounded-md">
                        <p><span className="font-medium">Status:</span> {results.success ? 'Success' : 'Failed'}</p>
                        <p><span className="font-medium">Message:</span> {results.message}</p>
                        <p><span className="font-medium">Completed Categories:</span> {results.state?.completedCategories?.length || 0}</p>
                        <p><span className="font-medium">Queue Size:</span> {results.state?.queueSize || 0}</p>
                        <p><span className="font-medium">Is Processing:</span> {results.state?.isProcessing ? 'Yes' : 'No'}</p>
                    </div>

                    {results.results && Object.keys(results.results).length > 0 && (
                        <div>
                            <h3 className="font-medium mb-2">Category Results:</h3>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {Object.entries(results.results).map(([category, data], index) => (
                                    <div key={index} className="p-3 border border-gray-200 rounded-md">
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium">{category}:</span>
                                            <span className={`px-2 py-1 rounded text-xs ${data.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {data.success ? 'Success' : 'Failed'}
                                            </span>
                                        </div>
                                        {!data.success && data.error && (
                                            <p className="text-sm text-red-600 mt-1">{data.error}</p>
                                        )}
                                        {data.success && data.data && (
                                            <p className="text-sm text-gray-600 mt-1">
                                                Retrieved {data.data?.data?.length || 0} tweets
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="mt-8 p-4 bg-blue-50 border-blue-200 rounded-md">
                <h3 className="font-semibold mb-2">How it works:</h3>
                <ul className="list-disc list-inside text-sm space-y-1">
                    <li>Automatically queues requests to avoid hitting Twitter API rate limits</li>
                    <li>Processes categories one by one with appropriate delays</li>
                    <li>Persists state between requests to resume if interrupted</li>
                    <li>Handles rate limit errors with exponential backoff</li>
                    <li>Allows resuming from where it left off if the process is stopped</li>
                </ul>
            </div>
        </div>
    );
}