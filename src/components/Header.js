"use client";

import { useState, useRef, useEffect } from 'react';
import { useSupabase } from './SupabaseProvider';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getCurrentDate, formatDate } from '@/utils/dateUtils';
import { Grid, Star, Lightbulb, Trophy, Search, User, LogOut, Gamepad2 } from 'lucide-react';
import Image from 'next/image';

export default function Header({
    onViewChange,
    activeView = 'grid',
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    categories,
    limits,
    onSlotMachineOpen,
    onUpgradeClick,
    isFixed = true // Default to fixed, but can be overridden
}) {
    const { user, loading, signOut, tier } = useSupabase();
    const router = useRouter();
    const pathname = usePathname();
    const today = getCurrentDate();
    const formattedDate = formatDate(today);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [imageError, setImageError] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen]);

    // Reset image error state when user changes
    useEffect(() => {
        setImageError(false);
    }, [user]);

    const handleViewChange = (view) => {
        if (onViewChange) {
            onViewChange(view);
        }
    };

    const handleLogout = async () => {
        await signOut();
    };

    // Check if we're on the landing page (home page)
    const isLandingPage = pathname === '/';

    // Check if user tier is free
    const isFreeTier = tier === 'free';
    // Check if user tier is free or basic
    const isFreeOrBasicTier = tier === 'free' || tier === 'basic';

    // Handle search submission (when Enter is pressed)
    const handleSearchSubmit = async (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            try {
                const response = await fetch(`/api/ideas/search?keyword=${encodeURIComponent(searchTerm.trim())}&limit=50`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.results) {
                        // Update the ideas list in the parent component with search results
                        // This would need to be handled by the parent component
                        console.log('Search results:', data.results);
                    }
                }
            } catch (error) {
                console.error('Error searching ideas:', error);
            }
        }
    };

    const getNextTier = () => {
        if (tier === 'free') return 'Basic';
        if (tier === 'basic') return 'Pro';
        return 'Premium';
    };

    return (
        <div className={`w-full p-4 md:p-4 flex flex-col bg-black/70 backdrop-blur-md ${isFixed ? 'fixed top-0 left-0 z-50' : ''}`}>
            {/* Top row with title/date on left and view buttons on right */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <Image src="/logo.png" alt="Ideaspire Logo" width={40} height={40} />
                        <div className="flex flex-col">
                            <Link href="/" className="text-3xl font-bold tracking-wider uppercase hover:scale-102 transition-transform">
                                <span className="text-gradient">IDEASPIRE</span>
                            </Link>
                            <h2 className="text-[#5c5290] text-base font-semibold uppercase">
                                Ignite Possibilities, Build Tomorrow! {/* {formattedDate} */}
                            </h2>
                        </div>
                    </div>

                </div>

                <div className="flex items-center space-x-4">
                    {/* View buttons as icons - only show on landing page, grid for basic+ and leaderboard for pro+ */}
                    {isLandingPage && (
                        <div className="flex space-x-2">
                            {!isFreeTier && (
                                <button
                                    className={`flex items-center justify-center w-10 h-10 rounded-full hover:scale-110 transition-all ${activeView === 'grid'
                                        ? 'text-white bg-[#42309d]'
                                        : 'text-white hover:bg-opacity-80 '
                                        } backdrop-blur-sm`}
                                    onClick={() => handleViewChange('grid')}
                                    title="Grid View"
                                >
                                    <Grid size={18} />
                                </button>
                            )}
                            <button
                                className={`flex items-center justify-center w-10 h-10 rounded-full hover:scale-110 transition-all  ${activeView === 'liked'
                                    ? 'text-yellow-400 bg-[#42309d]'
                                    : 'text-white hover:bg-opacity-80 '
                                    } backdrop-blur-sm`}
                                onClick={() => handleViewChange('liked')}
                                title="Liked Ideas"
                            >
                                <Star size={18} fill={activeView === 'liked' ? 'yellow' : 'none'} />
                            </button>
                            {/* Leaderboard button - only for pro and enterprise tiers */}
                            {!isFreeOrBasicTier && (
                                <button
                                    className={`flex items-center justify-center w-10 h-10 rounded-full hover:scale-110 transition-all  ${activeView === 'leaderboard'
                                        ? 'text-white bg-[#42309d]'
                                        : 'text-white hover:bg-opacity-80'
                                        } backdrop-blur-sm`}
                                    onClick={() => handleViewChange('leaderboard')}
                                    title="Leaderboard"
                                >
                                    <Trophy size={18} />
                                </button>
                            )}
                        </div>
                    )}

                    {/* Slot Machine Button - only for free and basic tier users, and only on landing page */}
                    {isLandingPage && isFreeOrBasicTier && (
                        <button
                            onClick={onSlotMachineOpen}
                            className="flex items-center justify-center w-10 h-10 rounded-full bg-[#42309d] text-white hover:bg-opacity-80 backdrop-blur-sm hover:scale-110 transition-all"
                            title="Open Slot Machine"
                        >
                            <Gamepad2 size={18} />
                        </button>
                    )}

                    <div className="flex">
                        {/* Limits display */}
                        {limits && (
                            <div className="flex items-center space-x-3 text-sm font-semibold info-box !rounded-r-none rounded-l-lg !border-r-0">
                                <span className="font-bold uppercase ">{tier} Plan</span>
                                {isFreeOrBasicTier && (
                                    <>
                                        <span>
                                            <span className="text-gray-300">Spins Left:</span>{' '}
                                            <span className="">{limits.spins.limit === -1 ? '∞' : limits.spins.limit - limits.spins.used}</span>
                                        </span>
                                        <span>
                                            <span className="text-gray-300">Reveals Left:</span>{' '}
                                            <span className="">{limits.reveals.limit === -1 ? '∞' : limits.reveals.limit - limits.reveals.used}</span>
                                        </span>
                                    </>
                                )}
                            </div>
                        )}

                        {/* CTA button */}
                        <button
                            onClick={() => onUpgradeClick ? onUpgradeClick() : router.push('/pricing')}
                            className="px-4 py-2 bg-gradient-to-r from-[#03438c6a] to-[#17ffc5ba] text-white text-sm font-semibold rounded-r-lg !rounded-l-none hover:from-[#023a7a] hover:to-[#16e5b3] transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                            Unlock {getNextTier()}
                        </button>
                    </div>

                    {/* Profile dropdown */}
                    {!loading && user && (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium transition-colors border bg-[#42309d] border-[#42309d]/70 text-[#17ffc6] hover:bg-opacity-80 hover:border-[#17ffc6]/70 backdrop-blur-sm overflow-hidden"
                            >
                                {(() => {
                                    const avatarUrl = user.user_metadata?.avatar_url ||
                                        user.user_metadata?.picture ||
                                        user.user_metadata?.profile_picture ||
                                        user.app_metadata?.avatar_url ||
                                        user.app_metadata?.picture;

                                    return avatarUrl && !imageError ? (
                                        <Image
                                            src={avatarUrl}
                                            alt="Profile"
                                            width={32}
                                            height={32}
                                            className="w-10 h-10 rounded-full object-cover"
                                            onError={() => setImageError(true)}
                                            onLoad={() => setImageError(false)}
                                        />
                                    ) : (
                                        <User size={20} />
                                    );
                                })()}
                            </button>
                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-[100]">
                                    <button
                                        onClick={() => { router.push('/profile'); setIsDropdownOpen(false); }}
                                        className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                                    >
                                        <User size={16} className="mr-2" /> Profile
                                    </button>
                                    <button
                                        onClick={() => { router.push('/subscription'); setIsDropdownOpen(false); }}
                                        className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                                    >
                                        <Star size={16} className="mr-2" /> Subscription
                                    </button>
                                    <a
                                        href="/admin"
                                        className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                                        onClick={() => setIsDropdownOpen(false)}
                                    >
                                        <Lightbulb size={16} className="mr-2" /> Admin
                                    </a>
                                    <button
                                        onClick={() => { handleLogout(); setIsDropdownOpen(false); }}
                                        className="flex items-center w-full text-left px-4 py-2 text-sm text-red-300 hover:bg-red-700"
                                    >
                                        <LogOut size={16} className="mr-2" /> Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Search and filter controls - Only show on landing page */}
            {isLandingPage && (
                <div className="w-full z-[-1] mt-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="w-full md:w-1/4">
                            <div className="relative">
                                <form onSubmit={handleSearchSubmit}>
                                    <input
                                        type="text"
                                        placeholder="Search ideas..."
                                        className="w-full px-4 py-2 pl-10 border border-[#7673d761] rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-900/80 text-white backdrop-blur-sm"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleSearchSubmit(e);
                                            }
                                        }}
                                    />
                                    <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#13fac37d]" />
                                </form>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {categories.map(category => (
                                <button
                                    key={category}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${selectedCategory === category
                                        ? `bg-indigo-600 ${getCategoryBorderColor(category)} text-white`
                                        : `bg-gray-800/80 ${getCategoryBorderColor(category)} text-[gray-300] hover:bg-gray-700/80 hover:border-gray-500`
                                        } backdrop-blur-sm`}
                                    onClick={() => setSelectedCategory(category)}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
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
