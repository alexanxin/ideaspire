"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/components/SupabaseProvider';
import { Heart, Loader, LogOut, Eye, BarChart3, Calendar, Crown, Zap, Star, TrendingUp, Search, Filter, Trophy, Gauge } from 'lucide-react';
import { PropagateLoader } from 'react-spinners';
import IdeaCard from '@/components/IdeaCard';
import IdeaCard_update_full from '@/components/IdeaCard_update_full';
import Header from '@/components/Header';
import SlotMachine from '@/components/SlotMachine';
import ResponsiveIdeaView from '@/components/ResponsiveIdeaView';
import UpgradeModal from '@/components/UpgradeModal';
import { subscriptionPlans } from '@/data/plans';
import Leaderboard from '@/components/Leaderboard'; // Keep Leaderboard import

// Function to get category border color for filter buttons (copied from profile page)
const getCategoryBorderColor = (category) => {
    const categoryBorderColors = {
        'Tech': 'border-indigo-600',
        'Startup': 'border-purple-500',
        'E-commerce': 'border-green-500',
        'Service': 'border-yellow-500',
        'Vibe Coding': 'border-indigo-500',
        'Quick Money': 'border-red-500',
        'Social Impact': 'border-teal-500',
        'Remote Work': 'border-cyan-500',
        'Health & Wellness': 'border-pink-500',
        'Education': 'border-orange-500',
        'default': 'border-gray-500'
    };
    return categoryBorderColors[category] || categoryBorderColors.default;
};


export default function HomePage() {
    const { user, loading: authLoading, signOut, tier } = useSupabase();
    const router = useRouter();
    const [limits, setLimits] = useState(null);
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedIdea, setSelectedIdea] = useState(null);
    const [allIdeas, setAllIdeas] = useState([]);
    const [allIdeasPage, setAllIdeasPage] = useState(0);
    const [loadingAllIdeas, setLoadingAllIdeas] = useState(false);
    const [hasMoreAllIdeas, setHasMoreAllIdeas] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [activeView, setActiveView] = useState('grid'); // Default view for home page
    const [userRole, setUserRole] = useState(null);

    // Get user role from localStorage on initial load
    useEffect(() => {
        const role = localStorage.getItem('userRole');
        if (role) {
            setUserRole(role);
        } else {
            // If no role is set, redirect to login to select a role
            router.push('/login');
        }
    }, [router]);

    // --- Data Fetching Functions ---

    const updateLimits = useCallback(async () => {
        try {
            const response = await fetch('/api/user/limits');
            if (response.ok) {
                const limitsData = await response.json();
                setLimits(limitsData);
                setSubscription(subscriptionPlans[limitsData.tier]);
                return limitsData;
            }
        } catch (error) {
            console.error('Error updating limits:', error);
        }
        return null;
    }, []);

    const searchIdeasBySimilarity = useCallback(async (keyword, category = selectedCategory) => {
        if (!keyword.trim()) {
            fetchAllIdeas(true, '', category);
            return;
        }

        try {
            setLoadingAllIdeas(true);
            let url = `/api/ideas/search?keyword=${encodeURIComponent(keyword.trim())}&limit=50`;

            const response = await fetch(url);
            const data = await response.json();

            if (response.ok && data.success) {
                let results = data.results || [];

                if (category && category !== 'All') {
                    results = results.filter(idea => idea.category === category);
                }

                setAllIdeas(results);
                setAllIdeasPage(1);
                setHasMoreAllIdeas(false);
            } else {
                console.error('Search failed:', data.error);
                fetchAllIdeas(true, '', category);
            }
        } catch (error) {
            console.error('Error searching ideas:', error);
            fetchAllIdeas(true, '', category);
        } finally {
            setLoadingAllIdeas(false);
        }
    }, [selectedCategory]);

    const fetchAllIdeas = useCallback(async (reset = false, currentSearchTerm = searchTerm, currentSelectedCategory = selectedCategory) => {
        try {
            setLoadingAllIdeas(true);
            const offset = reset ? 0 : allIdeasPage * 10;
            let url = `/api/ideas?limit=10&offset=${offset}`;

            if (currentSelectedCategory && currentSelectedCategory !== 'All') {
                url += `&category=${encodeURIComponent(currentSelectedCategory)}`;
            }

            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                if (reset) {
                    setAllIdeas(data.ideas || []);
                    setAllIdeasPage(1);
                } else {
                    setAllIdeas(prev => [...prev, ...(data.ideas || [])]);
                    setAllIdeasPage(prev => prev + 1);
                }
                setHasMoreAllIdeas(data.hasMore);
            } else {
                console.error('Failed to fetch all ideas');
            }
        } catch (error) {
            console.error('Error fetching all ideas:', error);
        } finally {
            setLoadingAllIdeas(false);
        }
    }, [allIdeasPage, searchTerm, selectedCategory]);

    // --- Effects ---

    // 1. Authentication Check
    useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/login');
        } else if (user) {
            setLoading(false);
            updateLimits();
        }
    }, [user, authLoading, router, updateLimits]);

    // 2. Debounce Search/Category Change
    useEffect(() => {
        if (!user) return;

        const handler = setTimeout(() => {
            setAllIdeas([]);
            setAllIdeasPage(0);

            if (searchTerm.trim()) {
                searchIdeasBySimilarity(searchTerm, selectedCategory);
            } else {
                fetchAllIdeas(true, '', selectedCategory);
            }
        }, 300);

        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm, selectedCategory, user, searchIdeasBySimilarity, fetchAllIdeas]);

    // 3. Initial Idea Fetch (if no filters active)
    useEffect(() => {
        if (user && !authLoading && searchTerm === '' && selectedCategory === 'All' && allIdeas.length === 0) {
            fetchAllIdeas(true);
        }
    }, [user, authLoading, fetchAllIdeas]);

    // --- Handlers ---

    const handleIdeaSelect = (idea) => {
        setSelectedIdea(idea);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedIdea(null);
    };

    const handleViewChange = (view) => {
        setActiveView(view);
    };

    const handleLogout = async () => {
        await signOut();
        router.push('/login');
    };

    // --- Render Logic ---

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-white text-center">
                    <Loader className="animate-spin h-8 w-8 mx-auto mb-4" />
                    <p>Loading Ideaspire...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null; // Redirect handled by useEffect
    }

    const isProOrEnterprise = limits?.tier === 'pro' || limits?.tier === 'enterprise';
    const isFreeOrBasicTier = limits?.tier === 'free' || limits?.tier === 'basic';

    // Render content based on user role
    const renderContent = () => {
        if (userRole === 'founder') {
            // For founders, render dashboard content similar to profile page
            return renderFounderContent();
        } else if (userRole === 'backer') {
            // For backers, render placeholder content
            return renderBackerContent();
        }
        return null;
    };

    // Render founder-specific content (similar to profile page)
    const renderFounderContent = () => {
        switch (activeView) {
            case 'grid':
                return (
                    <ResponsiveIdeaView
                        ideas={allIdeas}
                        onIdeaClick={handleIdeaSelect}
                        onLoadMore={() => {
                            if (!searchTerm.trim()) {
                                fetchAllIdeas(false, searchTerm, selectedCategory);
                            }
                        }}
                        hasMore={hasMoreAllIdeas && !searchTerm.trim()}
                        loading={loadingAllIdeas}
                        searchTerm={searchTerm}
                        selectedCategory={selectedCategory}
                        tier={limits?.tier}
                        limits={limits}
                    />
                );
            case 'liked':
                // NOTE: Liked ideas logic is complex and was in profile page. For simplicity on the home page,
                // we will redirect to profile for the full liked experience, or implement a simplified fetch here.
                // Given the complexity, let's redirect to the profile page's liked tab for now.
                router.push('/profile?tab=liked-ideas');
                return null;
            case 'leaderboard':
                if (isProOrEnterprise) {
                    return <Leaderboard />;
                }
            // Fallthrough to upgrade prompt if not Pro/Enterprise
            case 'generator':
                if (isFreeOrBasicTier) {
                    return (
                        <SlotMachine
                            tier={limits?.tier}
                            limits={limits}
                            onIdeaSelect={handleIdeaSelect}
                            onUpdateLimits={updateLimits}
                            onUpgradePrompt={() => setShowUpgradeModal(true)}
                        />
                    );
                }
            // Fallthrough to grid if Pro/Enterprise
            default:
                return renderFounderContent(); // Recurse to default to grid view
        }
    };

    // Render backer-specific placeholder content
    const renderBackerContent = () => {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-white mb-4">Backer Dashboard</h2>
                <p className="text-gray-400 mb-8">Welcome to your backer dashboard. This is where you can explore and support business ideas.</p>

                <div className="max-w-2xl mx-auto bg-gray-800 rounded-xl p-6 border-gray-700">
                    <h3 className="text-xl font-semibold text-white mb-4">As a Backer, you can:</h3>
                    <ul className="space-y-2 text-gray-300 text-left max-w-md mx-auto">
                        <li className="flex items-start">
                            <span className="text-green-400 mr-2">✓</span>
                            <span>Browse business ideas from founders</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-green-40 mr-2">✓</span>
                            <span>Soft-stake to support promising ideas</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-green-40 mr-2">✓</span>
                            <span>Track the performance of ideas you've supported</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-green-40 mr-2">✓</span>
                            <span>Earn rewards through Idea Shares</span>
                        </li>
                    </ul>

                    <div className="mt-8 p-4 bg-gray-90 rounded-lg">
                        <p className="text-gray-40 italic">"The future belongs to those who believe in the beauty of their dreams" - Backer's perspective</p>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <main className="relative w-full h-screen flex flex-col bg-gray-900">
            <Header
                onViewChange={handleViewChange}
                activeView={activeView}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                categories={['All', 'Tech', 'Startup', 'E-commerce', 'Service', 'Vibe Coding', 'Quick Money', 'Social Impact', 'Remote Work', 'Health & Wellness', 'Education']}
                limits={limits}
                onSlotMachineOpen={() => setActiveView('generator')}
                onUpgradeClick={() => setShowUpgradeModal(true)}
            />
            <div className="flex-grow overflow-y-auto pt-24 md:pt-28 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {renderContent()}
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
                            limits={limits}
                        />
                    </div>
                </div>
            )}

            {/* Upgrade Modal */}
            <UpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                onUpgradeSuccess={updateLimits}
            />
        </main>
    );
}