'use client';

import { useState } from 'react';

export default function TestResearch() {
    const [results, setResults] = useState({
        twitter: null,
        reddit: null,
        combined: null
    });

    const [loading, setLoading] = useState({
        twitter: false,
        reddit: false,
        combined: false
    });

    const testPlatform = async (platform) => {
        setLoading(prev => ({ ...prev, [platform]: true }));
        try {
            const response = await fetch(`/api/test-research?platform=${platform}`);
            const data = await response.json();
            setResults(prev => ({ ...prev, [platform]: data }));
        } catch (error) {
            setResults(prev => ({ ...prev, [platform]: { error: error.message } }));
        } finally {
            setLoading(prev => ({ ...prev, [platform]: false }));
        }
    };

    const renderResult = (platform) => {
        const data = results[platform];
        if (!data) return null;

        if (data.error) {
            return (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
                    <p className="text-red-600">Error: {data.error}</p>
                </div>
            );
        }

        return (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
                <p className="font-semibold">Success: {data.success ? 'Yes' : 'No'}</p>
                <p className="text-sm text-gray-600">{data.error && `Error: ${data.error}`}</p>
                {data.trends && data.trends.length > 0 && (
                    <div>
                        <p className="font-medium mt-2">Trends:</p>
                        <ul className="list-disc list-inside">
                            {data.trends.map((trend, index) => (
                                <li key={index} className="text-xs">{trend}</li>
                            ))}
                        </ul>
                    </div>
                )}
                {data.sources && (
                    <div className="mt-2">
                        <p className="font-medium">Sources:</p>
                        <p className="text-sm">Twitter: {data.sources.twitter ? 'Yes' : 'No'}, Reddit: {data.sources.reddit ? 'Yes' : 'No'}</p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto p-8">
            <h1 className="text-3xl font-bold mb-8">Research API Test Page</h1>

            <div className="space-y-8">
                <div>
                    <h2 className="text-xl font-semibold mb-2">Twitter Trends</h2>
                    <button
                        onClick={() => testPlatform('twitter')}
                        disabled={loading.twitter}
                        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
                    >
                        {loading.twitter ? 'Testing...' : 'Test Twitter Trends'}
                    </button>
                    {renderResult('twitter')}
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2">Reddit Trends</h2>
                    <button
                        onClick={() => testPlatform('reddit')}
                        disabled={loading.reddit}
                        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
                    >
                        {loading.reddit ? 'Testing...' : 'Test Reddit Trends'}
                    </button>
                    {renderResult('reddit')}
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2">Combined Research</h2>
                    <button
                        onClick={() => testPlatform('combined')}
                        disabled={loading.combined}
                        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
                    >
                        {loading.combined ? 'Testing...' : 'Test Combined Research'}
                    </button>
                    {renderResult('combined')}
                </div>
            </div>

            <div className="mt-8 p-4 border border-gray-200 rounded">
                <p className="text-sm text-gray-600">
                    Check the server console for additional logging messages about API configuration status.
                </p>
            </div>
        </div>
    );
}
