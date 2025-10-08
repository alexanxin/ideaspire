'use client';

import { useState, useEffect } from 'react';
import IdeaCard from '@/components/IdeaCard';
import ResponsiveIdeaView from '@/components/ResponsiveIdeaView';
import DetailedIdeaView from '@/components/DetailedIdeaView';
import './styles.css';

export default function TestIdeas() {
    const [selectedIdea, setSelectedIdea] = useState(null);
    const [showDetailedView, setShowDetailedView] = useState(false);
    const [sampleIdeas, setSampleIdeas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const limits = {
        tier: 'pro',
        spins: { limit: 10, used: 3 },
        reveals: { limit: 5, used: 2 }
    };

    useEffect(() => {
        const fetchTestIdeas = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/test-ideas?count=5');
                if (!response.ok) {
                    throw new Error('Failed to fetch test ideas');
                }
                const data = await response.json();
                setSampleIdeas(data.ideas || []);
            } catch (err) {
                setError(err.message);
                console.error('Error fetching test ideas:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchTestIdeas();
    }, []);

    const handleIdeaClick = (idea) => {
        setSelectedIdea(idea);
        setShowDetailedView(true);
    };

    const closeDetailedView = () => {
        setShowDetailedView(false);
        setSelectedIdea(null);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 text-white p-8">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold mb-8">Idea Components Test Page</h1>
                    <div className="flex items-center justify-center py-12">
                        <div className="text-lg">Loading test ideas...</div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 text-white p-8">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold mb-8">Idea Components Test Page</h1>
                    <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
                        <h2 className="text-red-400 font-semibold mb-2">Error Loading Ideas</h2>
                        <p className="text-gray-300">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Idea Components Test Page</h1>

                <div className="mb-12">
                    <h2 className="text-2xl font-semibold mb-4">Enhanced Reveal Cards (Wider with Minting Guidance)</h2>
                    <div className="space-y-8">
                        {sampleIdeas.map((idea) => (
                            <IdeaCard
                                key={idea.id}
                                idea={idea}
                                onIdeaClick={handleIdeaClick}
                                limits={limits}
                            />
                        ))}
                    </div>
                </div>

                <div className="mb-12">
                    <h2 className="text-2xl font-semibold mb-4">Responsive Idea Grid (Original)</h2>
                    <ResponsiveIdeaView
                        ideas={sampleIdeas}
                        onIdeaClick={handleIdeaClick}
                        limits={limits}
                    />
                </div>

                {showDetailedView && selectedIdea && (
                    <DetailedIdeaView
                        idea={selectedIdea}
                        onClose={closeDetailedView}
                        limits={limits}
                    />
                )}
            </div>
        </div>
    );
}