'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TestSimilarityPage() {
    const [threshold, setThreshold] = useState(0.7);
    const [weights, setWeights] = useState({ title: 0.6, description: 0.4 });
    const [results, setResults] = useState(null);
    const [removalResults, setRemovalResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [removing, setRemoving] = useState(false);
    const [error, setError] = useState(null);

    const runSimilarityTest = async () => {
        setLoading(true);
        setError(null);
        setResults(null);
        setRemovalResults(null);

        try {
            const response = await fetch('/api/test-similarity', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    threshold: parseFloat(threshold),
                    weights: {
                        title: parseFloat(weights.title),
                        description: parseFloat(weights.description)
                    }
                })
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Unauthorized: Please ensure your CRON_AUTH_TOKEN is set in environment variables');
                } else {
                    throw new Error(data.error || `Failed to run similarity test: ${response.status}`);
                }
            }

            setResults(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const removeDuplicatePair = async (idea1Id, idea2Id, strategy = 'keep-newer') => {
        setRemoving(true);
        setError(null);

        try {
            const response = await fetch('/api/remove-duplicates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    threshold: parseFloat(threshold),
                    weights: {
                        title: parseFloat(weights.title),
                        description: parseFloat(weights.description)
                    },
                    removeStrategy: strategy,
                    specificPair: {
                        idea1Id,
                        idea2Id
                    }
                })
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Unauthorized: Please ensure your CRON_AUTH_TOKEN is set in environment variables');
                } else {
                    throw new Error(data.error || `Failed to remove duplicates: ${response.status}`);
                }
            }

            setRemovalResults(data);
            // Refresh the similarity test to show updated results
            runSimilarityTest();
        } catch (err) {
            setError(err.message);
        } finally {
            setRemoving(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Test Idea Similarity</h1>

            <div className=" p-6 rounded-lg shadow-md mb-6">
                <h2 className="text-xl font-semibold mb-4">Configuration</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-70 mb-1">
                            Similarity Threshold (0-1)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="1"
                            value={threshold}
                            onChange={(e) => setThreshold(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-50 mt-1">
                            Ideas with similarity above this threshold will be considered duplicates
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Title Weight (0-1)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="1"
                            value={weights.title}
                            onChange={(e) => setWeights({ ...weights, title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-30 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-70 mb-1">
                            Description Weight (0-1)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="1"
                            value={weights.description}
                            onChange={(e) => setWeights({ ...weights, description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-30 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Total Weight: {parseFloat(weights.title) + parseFloat(weights.description)}
                        </label>
                        <p className="text-xs text-gray-50">
                            Adjust weights to fine-tune similarity calculation
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={runSimilarityTest}
                        disabled={loading}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Running Test...' : 'Run Similarity Test'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-100 border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {removalResults && (
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
                    <h3 className="font-bold">Duplicate Removal Results:</h3>
                    <p>Removed {removalResults.removedCount} ideas</p>
                    <p>Strategy used: {removalResults.removeStrategy}</p>
                </div>
            )}

            {results && (
                <div className=" p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Test Results</h2>

                    <div className="mb-4 p-4 rounded">
                        <p><strong>Threshold:</strong> {results.threshold}</p>
                        <p><strong>Title Weight:</strong> {results.weights.title}</p>
                        <p><strong>Description Weight:</strong> {results.weights.description}</p>
                        <p><strong>Total Ideas in Database:</strong> {results.totalIdeas}</p>
                        <p><strong>Similar Pairs Found:</strong> {results.similarPairsCount}</p>
                    </div>

                    {results.similarPairs.length > 0 ? (
                        <div>
                            <h3 className="text-lg font-medium mb-2">Similar Idea Pairs</h3>
                            <p className="text-sm text-gray-600 mb-4">Click the buttons below each pair to remove duplicates individually</p>
                            <div className="space-y-4">
                                {results.similarPairs.map((pair, index) => (
                                    <div key={index} className="border p-4 rounded">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-medium">Pair {index + 1} (Similarity: {pair.similarity.toFixed(3)})</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="border-r pr-4">
                                                <h5 className="font-medium text-blue-700">Idea 1</h5>
                                                <p className="font-semibold">{pair.idea1.title}</p>
                                                <p className="text-sm text-gray-600 mt-1">{pair.idea1.description.substring(0, 150)}...</p>
                                                <p className="text-xs text-gray-500 mt-1">Category: {pair.idea1.category}</p>
                                                <p className="text-xs text-gray-500 mt-1">Created: {new Date(pair.idea1.created_at).toLocaleString()}</p>
                                                <p className="text-xs text-gray-500 mt-1">ID: {pair.idea1.id}</p>
                                            </div>
                                            <div className="border-l pl-4">
                                                <h5 className="font-medium text-blue-700">Idea 2</h5>
                                                <p className="font-semibold">{pair.idea2.title}</p>
                                                <p className="text-sm text-gray-60 mt-1">{pair.idea2.description.substring(0, 150)}...</p>
                                                <p className="text-xs text-gray-50 mt-1">Category: {pair.idea2.category}</p>
                                                <p className="text-xs text-gray-500 mt-1">Created: {new Date(pair.idea2.created_at).toLocaleString()}</p>
                                                <p className="text-xs text-gray-500 mt-1">ID: {pair.idea2.id}</p>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex flex-wrap gap-2">
                                            <button
                                                onClick={() => removeDuplicatePair(pair.idea1.id, pair.idea2.id, 'keep-newer')}
                                                disabled={removing}
                                                className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 disabled:opacity-50"
                                            >
                                                Remove Older
                                            </button>
                                            <button
                                                onClick={() => removeDuplicatePair(pair.idea1.id, pair.idea2.id, 'keep-older')}
                                                disabled={removing}
                                                className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 disabled:opacity-50"
                                            >
                                                Remove Newer
                                            </button>
                                            <button
                                                onClick={() => removeDuplicatePair(pair.idea1.id, pair.idea2.id, 'keep-neither')}
                                                disabled={removing}
                                                className="bg-red-700 text-white px-3 py-1 rounded text-sm hover:bg-red-800 disabled:opacity-50"
                                            >
                                                Remove Both
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-green-100 border-green-400 text-green-700 px-4 py-3 rounded">
                            <p>No similar pairs found with the current threshold. The similarity threshold may be too high.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}