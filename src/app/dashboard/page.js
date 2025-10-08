"use client";

import { useSupabase } from '@/components/SupabaseProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader } from 'lucide-react';
import SlotMachine from '@/components/SlotMachine';
import IdeaCard from '@/components/IdeaCard';
import IdeaCard_update_full from '@/components/IdeaCard_update_full';

export default function DashboardPage() {
    const { user, loading: authLoading } = useSupabase();
    const router = useRouter();
    const [tier, setTier] = useState('free');
    const [showModal, setShowModal] = useState(false);
    const [selectedIdea, setSelectedIdea] = useState(null);
    const [activeTab, setActiveTab] = useState('idea-generator');
    const [revealedIdeas, setRevealedIdeas] = useState([]);
    const [likedIdeas, setLikedIdeas] = useState([]);
    const [loadingTab, setLoadingTab] = useState(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        if (user) {
            fetchUserTier();
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user && activeTab) {
            fetchTabData();
        }
    }, [user, activeTab]);

    const fetchUserTier = async () => {
        try {
            const response = await fetch('/api/user/limits');
            if (response.ok) {
                const data = await response.json();
                setTier(data.tier || 'free');
            }
        } catch (error) {
            console.error('Error fetching user tier:', error);
        }
    };

    const fetchTabData = async () => {
        if (!user) return;

        try {
            if (activeTab === 'latest-revealed' && revealedIdeas.length === 0) {
                setLoadingTab('latest-revealed');
                const response = await fetch('/api/profile/revealed-ideas?limit=8');
                if (response.ok) {
                    const data = await response.json();
                    setRevealedIdeas(data.ideas || []);
                }
            } else if (activeTab === 'liked-ideas' && likedIdeas.length === 0) {
                setLoadingTab('liked-ideas');
                const response = await fetch('/api/profile/liked-ideas');
                if (response.ok) {
                    const data = await response.json();
                    setLikedIdeas(data.ideas || []);
                }
            }
        } catch (error) {
            console.error(`Error fetching ${activeTab} data:`, error);
        } finally {
            setLoadingTab(null);
        }
    };

    const handleIdeaSelect = (idea) => {
        setSelectedIdea(idea);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedIdea(null);
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-white text-center">
                    <Loader className="animate-spin h-8 w-8 mx-auto mb-4" />
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-white text-center">
                    <p className="text-gray-400">Redirecting to login...</p>
                </div>
            </div>
        );
    }

    const renderTabContent = () => {
        switch (activeTab) {
            case 'idea-generator':
                return (
                    <div>
                        <SlotMachine tier={tier} onIdeaSelect={handleIdeaSelect} />
                        {/* Additional Dashboard Content */}
                        <div className="mt-8 text-center">
                            <p className="text-gray-400 text-sm">
                                Current tier: <span className="text-white font-semibold capitalize">{tier}</span>
                            </p>
                        </div>
                    </div>
                );
            case 'latest-revealed':
                return (
                    <div>
                        {loadingTab === 'latest-revealed' ? (
                            <div className="flex justify-center py-12">
                                <Loader className="animate-spin h-8 w-8 text-gray-400" />
                            </div>
                        ) : revealedIdeas.length === 0 ? (
                            <div className="text-center py-12 bg-gray-800 rounded-xl border border-gray-700">
                                <p className="text-xl font-semibold text-gray-400 mb-2">No revealed ideas yet</p>
                                <p className="text-gray-500 mb-4">Start spinning and revealing ideas to see them here!</p>
                                <SlotMachine tier={tier} onIdeaSelect={handleIdeaSelect} />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                {revealedIdeas.map((idea) => (
                                    <IdeaCard
                                        key={idea.id}
                                        idea={idea}
                                        onIdeaClick={(idea) => {
                                            console.log('Clicked idea:', idea);
                                        }}
                                        onCategoryClick={(category) => {
                                            console.log('Clicked category:', category);
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                );
            case 'liked-ideas':
                return (
                    <div>
                        {loadingTab === 'liked-ideas' ? (
                            <div className="flex justify-center py-12">
                                <Loader className="animate-spin h-8 w-8 text-gray-400" />
                            </div>
                        ) : likedIdeas.length === 0 ? (
                            <div className="text-center py-12 bg-gray-800 rounded-xl border border-gray-700">
                                <p className="text-xl font-semibold text-gray-400 mb-2">No liked ideas yet</p>
                                <p className="text-gray-500 mb-4">Start exploring and liking business ideas to see them here!</p>
                                <button
                                    onClick={() => setActiveTab('idea-generator')}
                                    className="px-6 py-3 bg-[#42309d] hover:bg-opacity-80 text-white rounded-lg font-medium transition-colors backdrop-blur-sm"
                                >
                                    Discover Ideas
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                                {likedIdeas.map((idea) => (
                                    <IdeaCard
                                        key={idea.id}
                                        idea={idea}
                                        onIdeaClick={(idea) => {
                                            console.log('Clicked idea:', idea);
                                        }}
                                        onCategoryClick={(category) => {
                                            console.log('Clicked category:', category);
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                );
            case 'recent-activity':
                return (
                    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                        <div className="text-center py-8">
                            <p className="text-gray-400">Recent activity timeline coming soon...</p>
                            <p className="text-gray-500 text-sm">Track your spinning and revealing history</p>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-900">
            <div className="container mx-auto px-4 py-8">
                {/* Header with tabs */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Your Ideaspire Dashboard</h1>
                        <p className="text-gray-400 mt-2">
                            Welcome back, {user.email}! Spin the wheel to discover amazing business ideas.
                        </p>
                    </div>

                    {/* Tabs */}
                    <div className="flex flex-wrap gap-2">
                        <button
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'idea-generator'
                                ? 'bg-[#42309d] text-white'
                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                }`}
                            onClick={() => setActiveTab('idea-generator')}
                        >
                            Idea Generator
                        </button>
                        <button
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'latest-revealed'
                                ? 'bg-[#42309d] text-white'
                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                }`}
                            onClick={() => setActiveTab('latest-revealed')}
                        >
                            Latest Revealed Ideas
                        </button>
                        <button
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'liked-ideas'
                                ? 'bg-[#42309d] text-white'
                                : 'bg-gray-80 text-gray-300 hover:bg-gray-700'
                                }`}
                            onClick={() => setActiveTab('liked-ideas')}
                        >
                            Liked Ideas
                        </button>
                        <button
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'recent-activity'
                                ? 'bg-[#42309d] text-white'
                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                }`}
                            onClick={() => setActiveTab('recent-activity')}
                        >
                            Recent Activity
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="mt-8">
                    {renderTabContent()}
                </div>
            </div>

            {/* Idea Modal */}
            {showModal && selectedIdea && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-xl border border-gray-700 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                        <IdeaCard_update_full
                            idea={selectedIdea}
                            onIdeaClick={() => { }}
                            onCategoryClick={() => { }}
                            onClose={closeModal}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}