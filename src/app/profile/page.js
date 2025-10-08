"use client";

import { useSupabase } from '@/components/SupabaseProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Heart, Loader, LogOut, Eye, BarChart3, Calendar, Crown, Zap, Star, TrendingUp, Search, Filter, Trophy, Gauge } from 'lucide-react';
import { PropagateLoader } from 'react-spinners';
import IdeaCard from '@/components/IdeaCard';
import IdeaCard_update_full from '@/components/IdeaCard_update_full';
import Header from '@/components/Header';
import SlotMachine from '@/components/SlotMachine';
import ResponsiveIdeaView from '@/components/ResponsiveIdeaView';
import ActivityLog from '@/components/ActivityLog';
import Leaderboard from '@/components/Leaderboard';
import UpgradeModal from '@/components/UpgradeModal';
import { subscriptionPlans } from '@/data/plans';

export default function ProfilePage() {
    const { user, loading: authLoading, signOut, tier } = useSupabase();
    const router = useRouter();
    const [likedIdeas, setLikedIdeas] = useState([]);
    const [likedIdeasPage, setLikedIdeasPage] = useState(0);
    const [loadingMoreLiked, setLoadingMoreLiked] = useState(false);
    const [loadingLikedTab, setLoadingLikedTab] = useState(false);
    const [hasMoreLiked, setHasMoreLiked] = useState(true);
    const [revealedIdeas, setRevealedIdeas] = useState([]);
    const [revealedIdeasPage, setRevealedIdeasPage] = useState(0);
    const [loadingMoreRevealed, setLoadingMoreRevealed] = useState(false);
    const [loadingRevealedTab, setLoadingRevealedTab] = useState(false);
    const [hasMoreRevealed, setHasMoreRevealed] = useState(true);
    const [userStats, setUserStats] = useState(null);
    const [limits, setLimits] = useState(null);
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedIdea, setSelectedIdea] = useState(null);
    const [allIdeas, setAllIdeas] = useState([]);
    const [allIdeasPage, setAllIdeasPage] = useState(0);
    const [loadingAllIdeas, setLoadingAllIdeas] = useState(false);
    const [hasMoreAllIdeas, setHasMoreAllIdeas] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        if (user) {
            fetchAllData();
        }
    }, [user, authLoading, router, searchTerm, selectedCategory]); // Added searchTerm and selectedCategory to dependencies

    // Refetch limits when tier changes (e.g., after subscription upgrade)
    useEffect(() => {
        if (user && tier) {
            updateLimits();
        }
    }, [tier]);

    useEffect(() => {
        if (!user) return;

        // Debounce search and category changes
        const handler = setTimeout(() => {
            setAllIdeas([]); // Clear existing ideas
            setAllIdeasPage(0); // Reset page to 0

            if (searchTerm.trim()) {
                // Use search API when there's a search term
                searchIdeasBySimilarity(searchTerm, selectedCategory);
            } else {
                // Use regular fetch when no search term
                fetchAllIdeas(true, '', selectedCategory);
            }
        }, 300); // 300ms debounce

        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm, selectedCategory, user]);

    // Initial fetch of all ideas when component mounts and user is available, if no filters are active
    useEffect(() => {
        if (user && !authLoading && searchTerm === '' && selectedCategory === 'All' && allIdeas.length === 0) {
            fetchAllIdeas(true);
        }
    }, [user, authLoading]); // Only run on initial load and user/authLoading changes


    useEffect(() => {
        if (limits && activeTab === null) {
            setActiveTab(limits.tier === 'pro' || limits.tier === 'enterprise' ? 'idea-grid' : 'idea-generator');
        }
    }, [limits, activeTab]);

    // Infinite scroll for revealed ideas
    useEffect(() => {
        if (activeTab !== 'latest-revealed' || !hasMoreRevealed || loadingMoreRevealed) {
            return;
        }

        const sentinel = document.getElementById('revealed-sentinel');
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMoreRevealed && !loadingMoreRevealed) {
                    fetchRevealedIdeas(false);
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(sentinel);

        return () => observer.disconnect();
    }, [activeTab, hasMoreRevealed, loadingMoreRevealed, revealedIdeasPage]);

    // Infinite scroll for liked ideas
    useEffect(() => {
        if (activeTab !== 'liked-ideas' || !hasMoreLiked || loadingMoreLiked) {
            return;
        }

        const sentinel = document.getElementById('liked-sentinel');
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMoreLiked && !loadingMoreLiked) {
                    fetchLikedIdeas(false);
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(sentinel);

        return () => observer.disconnect();
    }, [activeTab, hasMoreLiked, loadingMoreLiked, likedIdeasPage]);

    const fetchAllData = async () => {
        try {
            setLoading(true);

            const [likedRes, revealedRes, statsRes, limitsRes] = await Promise.all([
                fetch('/api/profile/liked-ideas'),
                fetch('/api/profile/revealed-ideas'),
                fetch('/api/profile/stats'),
                fetch('/api/user/limits')
            ]);

            if (!likedRes.ok || !revealedRes.ok || !statsRes.ok || !limitsRes.ok) {
                throw new Error('Failed to fetch profile data');
            }

            const [likedData, revealedData, statsData, limitsData] = await Promise.all([
                likedRes.json(),
                revealedRes.json(),
                statsRes.json(),
                limitsRes.json()
            ]);

            setLikedIdeas(likedData.ideas || []);
            setRevealedIdeas(revealedData.ideas || []);
            setUserStats(statsData);
            setLimits(limitsData);
            setSubscription(subscriptionPlans[limitsData.tier]);
        } catch (err) {
            console.error('Error fetching profile data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchRevealedIdeas = async (reset = false) => {
        try {
            if (reset) {
                setLoadingMoreRevealed(true);
            }

            const offset = reset ? 0 : revealedIdeasPage * 10;
            const response = await fetch(`/api/profile/revealed-ideas?limit=10&offset=${offset}`);

            if (response.ok) {
                const data = await response.json();

                if (reset) {
                    setRevealedIdeas(data.ideas || []);
                    setRevealedIdeasPage(1);
                } else {
                    setRevealedIdeas(prev => [...prev, ...(data.ideas || [])]);
                    setRevealedIdeasPage(prev => prev + 1);
                }

                setHasMoreRevealed(data.hasMore);
            } else {
                console.error('Failed to fetch revealed ideas');
            }
        } catch (error) {
            console.error('Error fetching revealed ideas:', error);
        } finally {
            if (reset) {
                setLoadingMoreRevealed(false);
            }
        }
    };

    const fetchLikedIdeas = async (reset = false) => {
        try {
            if (reset) {
                setLoadingMoreLiked(true);
            }

            const offset = reset ? 0 : likedIdeasPage * 10;
            const response = await fetch(`/api/profile/liked-ideas?limit=10&offset=${offset}`);

            if (response.ok) {
                const data = await response.json();

                if (reset) {
                    setLikedIdeas(data.ideas || []);
                    setLikedIdeasPage(1);
                } else {
                    setLikedIdeas(prev => [...prev, ...(data.ideas || [])]);
                    setLikedIdeasPage(prev => prev + 1);
                }

                setHasMoreLiked(data.hasMore);
            } else {
                console.error('Failed to fetch liked ideas');
            }
        } catch (error) {
            console.error('Error fetching liked ideas:', error);
        } finally {
            if (reset) {
                setLoadingMoreLiked(false);
            }
        }
    };

    // Function to search ideas by similarity
    const searchIdeasBySimilarity = async (keyword, category = selectedCategory) => {
        if (!keyword.trim()) {
            // If search term is empty, fetch all ideas with category filter
            fetchAllIdeas(true, '', category);
            return;
        }

        try {
            setLoadingAllIdeas(true);
            let url = `/api/ideas/search?keyword=${encodeURIComponent(keyword.trim())}&limit=50`;

            // Note: The search API doesn't support category filtering yet
            // For now, we'll search and then filter client-side if needed
            const response = await fetch(url);
            const data = await response.json();

            if (response.ok && data.success) {
                let results = data.results || [];

                // Apply category filter client-side if needed
                if (category && category !== 'All') {
                    results = results.filter(idea => idea.category === category);
                }

                setAllIdeas(results);
                setAllIdeasPage(1);
                setHasMoreAllIdeas(false); // Search results don't have pagination for now
            } else {
                console.error('Search failed:', data.error);
                // Fallback to regular ideas fetch
                fetchAllIdeas(true, '', category);
            }
        } catch (error) {
            console.error('Error searching ideas:', error);
            // Fallback to regular ideas fetch
            fetchAllIdeas(true, '', category);
        } finally {
            setLoadingAllIdeas(false);
        }
    };

    const fetchAllIdeas = async (reset = false, currentSearchTerm = searchTerm, currentSelectedCategory = selectedCategory) => {
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
    };

    const renderTabContent = () => {
        const isProOrEnterprise = limits?.tier === 'pro' || limits?.tier === 'enterprise';


        if (!activeTab) return null; // Don't render until activeTab is set

        switch (activeTab) {
            case 'idea-generator':
                return (
                    <div className="mb-8">
                        <div className="w-full">
                            <SlotMachine
                                tier={limits?.tier}
                                limits={limits}
                                onIdeaSelect={handleIdeaSelect}
                                onUpdateLimits={updateLimits}
                                onUpgradePrompt={() => setShowUpgradeModal(true)}
                            />
                        </div>
                    </div>
                );
            case 'idea-grid':
                // Get unique categories from ideas


                return (
                    <div className="mb-8">
                        {/* Search and filter controls for pro/enterprise users */}

                        <div className="w-full">
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
                        </div>
                    </div>
                );
            case 'latest-revealed':
                return (
                    <div>
                        {/* <div className="flex items-center mb-6">
                            <Eye className="h-6 w-6 text-blue-50 mr-2" />
                            <h2 className="text-2xl font-bold text-white">Latest Revealed Ideas</h2>
                            <span className="ml-2 text-gray-40">({revealedIdeas.length})</span>
                        </div> */}

                        {loading || loadingRevealedTab ? (
                            <div className="flex justify-center py-12">
                                <PropagateLoader color="#4f46e5" />
                            </div>
                        ) : revealedIdeas.length === 0 ? (
                            <div className="text-center py-12  rounded-xl border border-gray-700">
                                <Eye className="h-16 w-16 text-gray-60 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-40 mb-2">No revealed ideas yet</h3>
                                <p className="text-gray-500 mb-4">Start spinning and revealing ideas to see them here!</p>
                                <button
                                    onClick={() => router.push('/dashboard')}
                                    className="px-6 py-3 bg-[#42309d] hover:bg-opacity-80 text-white rounded-lg font-medium transition-colors backdrop-blur-sm"
                                >
                                    Go to Dashboard
                                </button>
                            </div>
                        ) : (
                            <div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
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
                                {loadingMoreRevealed && (
                                    <div className="flex flex-col items-center justify-center py-8">
                                        <PropagateLoader color="#4f46e5" />
                                        <p className="text-gray-400">Loading more...</p>
                                    </div>
                                )}
                                {hasMoreRevealed && !loadingMoreRevealed && (
                                    <div id="revealed-sentinel" className="h-4"></div>
                                )}
                            </div>
                        )}
                    </div>
                );
            case 'liked-ideas':
                return (
                    <div>
                        {/* <div className="flex items-center mb-6">
                            <Heart className="h-6 w-6 text-red-50 mr-2" />
                            <h2 className="text-2xl font-bold text-white">Liked Ideas</h2>
                            <span className="ml-2 text-gray-400">({likedIdeas.length})</span>
                        </div> */}

                        {loading || loadingLikedTab ? (
                            <div className="flex justify-center py-12">
                                <PropagateLoader color="#4f46e5" />
                            </div>
                        ) : likedIdeas.length === 0 ? (
                            <div className="text-center py-12  rounded-xl border border-gray-700">
                                <Heart className="h-16 w-16 text-gray-60 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-40 mb-2">No liked ideas yet</h3>
                                <p className="text-gray-500 mb-4">Start exploring and liking business ideas to see them here!</p>
                                <button
                                    onClick={() => router.push('/profile')}
                                    className="px-6 py-3 bg-[#42309d] hover:bg-opacity-80 text-white rounded-lg font-medium transition-colors backdrop-blur-sm"
                                >
                                    Explore Ideas
                                </button>
                            </div>
                        ) : (
                            <div>
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
                                            limits={limits}
                                        />
                                    ))}
                                </div>
                                {loadingMoreLiked && (
                                    <div className="flex flex-col items-center justify-center py-8">
                                        <PropagateLoader color="#4f46e5" />
                                        <p className="text-gray-400">Loading more...</p>
                                    </div>
                                )}
                                {hasMoreLiked && !loadingMoreLiked && (
                                    <div id="liked-sentinel" className="h-4"></div>
                                )}
                            </div>
                        )}
                    </div>
                );
            case 'leaderboard':
                if (limits?.tier === 'pro' || limits?.tier === 'enterprise') {
                    return (
                        <div className="rounded-xl">
                            <Leaderboard />
                        </div>
                    );
                } else {
                    return (
                        <div className="text-center py-12 rounded-xl border border-gray-700">
                            <Trophy className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-400 mb-2">Leaderboard Access Required</h3>
                            <p className="text-gray-500 mb-4">
                                The leaderboard is available for Pro and Enterprise tier users only.
                            </p>
                            <button
                                onClick={() => router.push('/pricing')}
                                className="px-6 py-3 bg-gradient-to-r from-[#03438c6a] to-[#17ffc5ba] text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl hover:from-[#023a7a] hover:to-[#16e5b3]"
                            >
                                Upgrade Now
                            </button>
                        </div>
                    );
                }
            case 'recent-activity':
                return (
                    <div className=" rounded-xl border border-gray-700 p-6">
                        <div className="flex items-center mb-4">
                            <TrendingUp className="h-6 w-6 text-purple-500 mr-2" />
                            <h2 className="text-xl font-bold text-white">Recent Activity</h2>
                        </div>
                        <ActivityLog userId={user?.id} />
                    </div>
                );
            default:
                return null;
        }
    };

    // Function to update limits when spin or reveal occurs
    const updateLimits = async () => {
        try {
            const response = await fetch('/api/user/limits');
            if (response.ok) {
                const limitsData = await response.json();
                setLimits(limitsData);
                setSubscription(subscriptionPlans[limitsData.tier]);
            }
        } catch (error) {
            console.error('Error updating limits:', error);
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

    const handleLogout = async () => {
        await signOut();
        router.push('/login');
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

    return (
        <main className="relative w-full h-screen flex flex-col">
            <Header
                onViewChange={() => { }}
                activeView="profile"
                searchTerm=""
                setSearchTerm={() => { }}
                selectedCategory=""
                setSelectedCategory={() => { }}
                categories={[]}
                limits={limits}
                onUpgradeClick={() => setShowUpgradeModal(true)}
                isFixed={false}
            />
            <div className="flex-grow overflow-y-auto bg-gray-900 -z-10">
                <div className="mx-auto px-4 py-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <div>
                            <h1 className="text-xl font-bold text-[#c0b7e6] ml-7">THE DASHBOARD</h1>
                        </div>
                        {/* Tabs */}
                        <div className="flex flex-wrap gap-2">
                            {limits?.tier === 'pro' || limits?.tier === 'enterprise' ? (
                                <button
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'idea-grid'
                                        ? 'bg-[#42309d] text-white'
                                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                        }`}
                                    onClick={() => setActiveTab('idea-grid')}
                                >
                                    <span className="flex items-center gap-2">
                                        <BarChart3 className="h-4 w-4" />
                                        Idea Grid
                                    </span>
                                </button>
                            ) : (
                                <>
                                    <button
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'idea-generator'
                                            ? 'bg-[#42309d] text-white'
                                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                            }`}
                                        onClick={() => setActiveTab('idea-generator')}
                                    >
                                        <span className="flex items-center gap-2">
                                            <Zap className="h-4 w-4" />
                                            Idea Generator
                                        </span>
                                    </button>
                                    <button
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'latest-revealed'
                                            ? 'bg-[#42309d] text-white'
                                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                            }`}
                                        onClick={async () => {
                                            setActiveTab('latest-revealed');
                                            setLoadingRevealedTab(true);
                                            await fetchRevealedIdeas(true);
                                            setLoadingRevealedTab(false);
                                        }}
                                    >
                                        <span className="flex items-center gap-2">
                                            <Eye className="h-4 w-4" />
                                            Latest Revealed Ideas
                                        </span>
                                    </button>
                                </>
                            )}
                            <button
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'liked-ideas'
                                    ? 'bg-[#42309d] text-white'
                                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                    }`}
                                onClick={async () => {
                                    setActiveTab('liked-ideas');
                                    setLoadingLikedTab(true);
                                    await fetchLikedIdeas(true);
                                    setLoadingLikedTab(false);
                                }}
                            >
                                <span className="flex items-center gap-2">
                                    <Heart className="h-4 w-4" />
                                    Liked Ideas
                                </span>
                            </button>
                            {(limits?.tier === 'pro' || limits?.tier === 'enterprise') && (
                                <button
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'leaderboard'
                                        ? 'bg-[#42309d] text-white'
                                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                        }`}
                                    onClick={() => setActiveTab('leaderboard')}
                                >
                                    <span className="flex items-center gap-2">
                                        <Trophy className="h-4 w-4" />
                                        Leaderboard
                                    </span>
                                </button>
                            )}
                            <button
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'recent-activity'
                                    ? 'bg-[#42309d] text-white'
                                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                    }`}
                                onClick={() => setActiveTab('recent-activity')}
                            >
                                <span className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4" />
                                    Recent Activity
                                </span>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {/* Left Column - Plan & Stats */}
                        <div className="lg:col-span-1 xl:col-span-1 space-y-6">
                            {/* For Pro/Enterprise users, show search and filter functionality first */}
                            {limits?.tier === 'pro' || limits?.tier === 'enterprise' ? (
                                // Search and filter functionality for pro/enterprise users
                                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 p-6">
                                    <div className="flex items-center mb-4">
                                        <Filter className="h-6 w-6 text-indigo-500 mr-2" />
                                        <h2 className="text-xl font-bold text-white">Search & Filter</h2>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Search ideas..."
                                                className="w-full px-4 py-2 pl-10 border border-[#7673d761] rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-900/80 text-white backdrop-blur-sm"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#13fac37d]" />
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {['All', 'Tech', 'Startup', 'E-commerce', 'Service', 'Vibe Coding', 'Quick Money', 'Social Impact', 'Remote Work', 'Health & Wellness', 'Education'].map(category => (
                                                <button
                                                    key={category}
                                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${selectedCategory === category
                                                        ? `bg-indigo-600 ${getCategoryBorderColor(category)} text-white`
                                                        : `bg-gray-700/80 ${getCategoryBorderColor(category)} text-gray-300 hover:bg-gray-600/80`
                                                        } backdrop-blur-sm`}
                                                    onClick={() => setSelectedCategory(category)}
                                                >
                                                    {category}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : null}


                            {/* For non-pro/enterprise users, show stats and limits */}
                            {!(limits?.tier === 'pro' || limits?.tier === 'enterprise') && (
                                <>
                                    {/* Remaining Limits - only for non-pro/enterprise users */}
                                    {limits ? (
                                        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 p-6">
                                            <div className="flex items-center mb-4">
                                                <Gauge className="h-6 w-6 text-green-500 mr-2" />
                                                <h2 className="text-xl font-bold text-white">Daily Limits</h2>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-400">Spins Remaining</span>
                                                    <span className="text-white font-semibold">
                                                        {limits.spins.limit === -1 ? '∞' : `${Math.max(0, limits.spins.limit - limits.spins.used)}/${limits.spins.limit}`}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-400">Reveals Remaining</span>
                                                    <span className="text-white font-semibold">
                                                        {limits.reveals.limit === -1 ? '∞' : `${Math.max(0, limits.reveals.limit - limits.reveals.used)}/${limits.reveals.limit}`}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 flex items-center justify-center h-48">
                                            <PropagateLoader color="#4f46e5" />
                                        </div>
                                    )}

                                    {/* User Stats - only for non-pro/enterprise users */}
                                    {userStats ? (
                                        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 p-6">
                                            <div className="flex items-center mb-4">
                                                <BarChart3 className="h-6 w-6 text-blue-500 mr-2" />
                                                <h2 className="text-xl font-bold text-white">Your Stats</h2>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-400">Total Spins</span>
                                                    <span className="text-white font-semibold">{userStats.totalSpins}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-400">Total Reveals</span>
                                                    <span className="text-white font-semibold">{userStats.totalReveals}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-400">Liked Ideas</span>
                                                    <span className="text-white font-semibold">{userStats.totalLikes}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-400">Member Since</span>
                                                    <span className="text-white font-semibold">
                                                        {new Date(userStats.joinDate).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="rounded-xl border border-gray-700 p-6 flex items-center justify-center h-48">
                                            <PropagateLoader color="#4f46e5" />
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Current Plan */}
                            {subscription ? (
                                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 p-6">
                                    <div className="flex items-center mb-4">
                                        <Crown className="h-6 w-6 text-yellow-500 mr-2" />
                                        <h2 className="text-xl font-bold text-white">Current Plan - {subscription.name}</h2>
                                    </div>
                                    <div className="mb-4">
                                        <p className="text-gray-400 text-sm">{subscription.description}</p>
                                    </div>
                                    <div className="space-y-2">
                                        {subscription.features.map((feature, index) => (
                                            <div key={index} className="flex items-center text-sm text-gray-300">
                                                <Star className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                                                {feature}
                                            </div>
                                        ))}
                                    </div>
                                    {limits?.tier !== 'pro' && limits?.tier !== 'enterprise' && (
                                        <button
                                            onClick={() => setShowUpgradeModal(true)}
                                            className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-[#03438c6a] to-[#17ffc5ba] text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl hover:from-[#023a7a] hover:to-[#16e5b3]"
                                        >
                                            Upgrade Plan
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 flex items-center justify-center h-48">
                                    <PropagateLoader color="#4f46e5" />
                                </div>
                            )}
                        </div>

                        {/* Right Column - Ideas */}
                        <div className="lg:col-span-2 xl:col-span-3 space-y-8">
                            {/* Tab Content */}
                            <div>
                                {renderTabContent()}
                            </div>
                        </div>
                    </div>
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

// Function to get category border color for filter buttons
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
