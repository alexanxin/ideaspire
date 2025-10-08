"use client";

import React, { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { TrendingUp, Zap } from 'lucide-react';
import { RotateCw } from 'lucide-react';

// Available categories
const CATEGORIES = [
    'Tech', 'Startup', 'E-commerce', 'Service', 'Quick Money',
    'Social Impact', 'Remote Work', 'Health & Wellness', 'Education'
];

// Category display component
const CategoryItem = ({ category, isWinning = false, onClick, disabled = false }) => {
    const getCategoryClasses = (category) => {
        const categoryStyles = {
            'Tech': { border: 'border-indigo-600/40', bg: 'bg-indigo-900/15' },
            'Startup': { border: 'border-purple-600/40', bg: 'bg-purple-900/15' },
            'E-commerce': { border: 'border-green-600/40', bg: 'bg-green-900/15' },
            'Service': { border: 'border-yellow-600/40', bg: 'bg-yellow-900/15' },
            'Quick Money': { border: 'border-red-600/40', bg: 'bg-red-900/15' },
            'Social Impact': { border: 'border-teal-600/40', bg: 'bg-teal-900/15' },
            'Remote Work': { border: 'border-cyan-600/40', bg: 'bg-cyan-900/15' },
            'Health & Wellness': { border: 'border-pink-600/40', bg: 'bg-pink-900/15' },
            'Education': { border: 'border-orange-600/40', bg: 'bg-orange-900/15' },
            'default': { border: 'border-gray-60/40', bg: 'bg-gray-900/15' }
        };
        return categoryStyles[category] || categoryStyles.default;
    };

    const handleClick = () => {
        if (onClick && !disabled) {
            onClick();
        }
    };

    return (
        <div
            className={`
                w-full relative rounded-lg shadow-sm transition-all duration-200 transform
                border-t-4 ${getCategoryClasses(category).border} ${getCategoryClasses(category).bg}
                flex flex-col overflow-hidden
                ${isWinning ? ' hover:scale-105' : ''}
                ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : onClick ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
            `}
            onClick={handleClick}
        >
            <div className="p-4 flex flex-col items-center justify-center h-full">
                <h4 className={`font-bold text-xl leading-tight mb-3 tracking-tight text-center ${disabled ? 'text-gray-400' : 'text-white'}`}>
                    {category}
                </h4>
            </div>
        </div>
    );
};


export default function SlotMachine({ tier = 'free', limits, onIdeaSelect, onUpdateLimits, onUpgradePrompt }) {
    const [spinning, setSpinning] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [revealedCategories, setRevealedCategories] = useState([false, false, false]); // Track which center categories have been clicked
    const [columnLoading, setColumnLoading] = useState([true, true, true]); // Loading state for each column
    const columnControls = [useAnimation(), useAnimation(), useAnimation()];

    // State for randomized categories for each column
    const [column1Categories, setColumn1Categories] = useState([]);
    const [column2Categories, setColumn2Categories] = useState([]);
    const [column3Categories, setColumn3Categories] = useState([]);

    // Initialize columns on mount
    useEffect(() => {
        initializeColumns();
    }, []);

    const initializeColumns = async () => {
        // Create randomized categories for each column before showing them
        const getRandomizedCategories = () => {
            // Create enough categories for smooth continuous spinning (extend to 50 items)
            const extendedCategories = [];
            for (let i = 0; i < 50; i++) {
                extendedCategories.push(...CATEGORIES.sort(() => Math.random() - 0.5));
            }
            return extendedCategories;
        };

        // Randomize categories for all columns
        setColumn1Categories(getRandomizedCategories());
        setColumn2Categories(getRandomizedCategories());
        setColumn3Categories(getRandomizedCategories());

        // Stagger the loading of each column for visual effect
        for (let i = 0; i < 3; i++) {
            await new Promise(resolve => setTimeout(resolve, i * 300)); // 0ms, 300ms, 600ms delay
            setColumnLoading(prev => {
                const newLoading = [...prev];
                newLoading[i] = false;
                return newLoading;
            });
        }
    };

    const fetchRandomIdeaByCategory = async (category) => {
        try {
            const response = await fetch(`/api/ideas?category=${encodeURIComponent(category)}&random=true`);
            if (response.ok) {
                const data = await response.json();
                return data.ideas?.[0] || null;
            }
        } catch (error) {
            console.error('Error fetching random idea by category:', error);
        }
        return null;
    };

    const handleSpin = async () => {
        if (spinning || loading) return;

        // Check limits
        if (limits && limits.spins.limit !== -1 && limits.spins.used >= limits.spins.limit) {
            // Show upgrade modal when spins are exhausted
            if (onUpgradePrompt) {
                onUpgradePrompt();
            }
            return;
        }

        setSpinning(true);
        setError(null);
        setLoading(true);
        setRevealedCategories([false, false, false]); // Reset reveal states

        try {
            // Start spinning animations with random durations for more realistic slot machine feel
            const spinDuration1 = 2 + Math.random() * 2; // 2-4 seconds
            const spinDuration2 = 2 + Math.random() * 2; // 2-4 seconds
            const spinDuration3 = 2 + Math.random() * 2; // 2-4 seconds

            columnControls[0].start({
                y: [0, -1840], // Move to center item 25 exactly at container center
                transition: {
                    duration: spinDuration1,
                    ease: "easeOut"
                }
            });
            columnControls[1].start({
                y: [0, -1840],
                transition: {
                    duration: spinDuration2,
                    ease: "easeOut"
                }
            });
            columnControls[2].start({
                y: [0, -1840],
                transition: {
                    duration: spinDuration3,
                    ease: "easeOut"
                }
            });

            // Wait for all animations to complete
            await Promise.all([
                new Promise(resolve => setTimeout(resolve, spinDuration1 * 1000)),
                new Promise(resolve => setTimeout(resolve, spinDuration2 * 1000)),
                new Promise(resolve => setTimeout(resolve, spinDuration3 * 1000))
            ]);

            // Update limits
            if (limits) {
                // Get the center categories for tracking (index 25 in the 50-item array)
                const centerCategory1 = column1Categories[25 % column1Categories.length];
                const centerCategory2 = column2Categories[25 % column2Categories.length];
                const centerCategory3 = column3Categories[25 % column3Categories.length];

                await fetch('/api/interactions/spin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ category: [centerCategory1, centerCategory2, centerCategory3].join(',') })
                });

                // Call onUpdateLimits to update the limits in the parent component
                if (onUpdateLimits) {
                    onUpdateLimits();
                }
            }

            setSpinning(false);
            setLoading(false);

        } catch (error) {
            console.error('Spin error:', error);
            setError('Failed to spin. Please try again.');
            setSpinning(false);
            setLoading(false);
        }
    };

    const handleCategoryReveal = async (category, colIndex) => {
        if (spinning) return;

        // Check if free or basic tier user has used their reveal limit
        if ((tier === 'free' || tier === 'basic') && limits && limits.reveals.used >= limits.reveals.limit) {
            if (onUpgradePrompt) {
                onUpgradePrompt();
            }
            return;
        }

        // Mark this category as revealed
        setRevealedCategories(prev => {
            const newRevealed = [...prev];
            newRevealed[colIndex] = true;
            return newRevealed;
        });

        // Then fetch and show the idea
        await handleCategorySelect(category);
    };

    const handleCategorySelect = async (category) => {
        if (spinning) return;

        try {
            setLoading(true);
            const idea = await fetchRandomIdeaByCategory(category);

            if (idea) {
                // Record the reveal interaction
                await fetch('/api/interactions/reveal', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ideaId: idea.id })
                });

                if (onIdeaSelect) {
                    onIdeaSelect(idea);
                }

                // Call onUpdateLimits to update the limits in the parent component
                if (onUpdateLimits) {
                    onUpdateLimits();
                }
            } else {
                setError('No ideas available in this category. Please try again.');
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching idea by category:', error);
            setError('Failed to fetch idea. Please try again.');
            setLoading(false);
        }
    };


    return (
        <div className="mx-auto p-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <Zap className="h-6 w-6 text-purple-500 mr-2" />
                    <h2 className="text-2xl font-bold text-white">Idea Generator</h2>
                </div>
            </div>
            <p className="text-gray-400 text-sm text-left mb-6 leading-relaxed mx-auto">
                Discover new business ideas by spinning the slot machine. Each spin reveals a unique combination of categories to inspire your next venture. Click the spin button to get started and unlock creative business concepts tailored to your interests. Spend your spins wisely!
                Once you find a category you like, click on it to reveal a business idea. Free and Basic users have limited reveals per day, so consider upgrading for unlimited access!
            </p>

            {/* Slot Machine with 3 Columns */}
            <div className="relative mb-6 flex justify-center items-center gap-4">
                <div className="w-1/3">
                    <div className="relative h-[400px] rounded-lg border-3 border-black/20 overflow-hidden bg-gray-900">
                        {/* Center indicator line */}
                        <div className='absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-gray-900 to-gray-900/10 z-50'></div>
                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-[#03438c6a] via-[#17ffc5] to-[#03438c6a] transform -translate-y-10 z-10"></div>
                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-[#03438c6a] via-[#17ffc5] to-[#03438c6a] transform translate-y-10 z-10"></div>
                        <div className='absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-b from-gray-900/10 to-gray-900 z-50'></div>

                        {/* Loading state */}
                        {columnLoading[0] && (
                            <div className="absolute inset-0 flex items-center justify-center z-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                            </div>
                        )}

                        {/* Slot items container with animation */}
                        {!columnLoading[0] && (
                            <motion.div
                                className="absolute inset-0 flex-col"
                                animate={columnControls[0]}
                            >
                                {Array.from({ length: 50 }).map((_, idx) => {
                                    const isCenterItem = idx === 25; // Middle item in the 50-item array
                                    const category = column1Categories[idx % column1Categories.length];
                                    return (
                                        <div key={`col1-${idx}`} className="h-20 flex items-center justify-center p-1">
                                            <CategoryItem
                                                category={category}
                                                isWinning={!spinning && isCenterItem}
                                                onClick={!spinning && isCenterItem ? () => handleCategoryReveal(category, 0) : undefined}
                                                disabled={revealedCategories[0] && isCenterItem}
                                            />
                                        </div>
                                    );
                                })}
                            </motion.div>
                        )}
                    </div>
                </div>

                <div className="w-1/3">
                    <div className="relative h-[400px] rounded-lg border-3 border-black/20 overflow-hidden bg-gray-900">
                        {/* Center indicator line */}
                        <div className='absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-gray-900 to-gray-900/10 z-50'></div>
                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-[#03438c6a] via-[#17ffc5] to-[#03438c6a] transform -translate-y-10 z-10"></div>
                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-[#03438c6a] via-[#17ffc5] to-[#03438c6a] transform translate-y-10 z-10"></div>
                        <div className='absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-b from-gray-900/10 to-gray-900 z-50'></div>

                        {/* Loading state */}
                        {columnLoading[1] && (
                            <div className="absolute inset-0 flex items-center justify-center z-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                            </div>
                        )}

                        {/* Slot items container with animation */}
                        {!columnLoading[1] && (
                            <motion.div
                                className="absolute inset-0 flex flex-col"
                                animate={columnControls[1]}
                            >
                                {Array.from({ length: 50 }).map((_, idx) => {
                                    const isCenterItem = idx === 25; // Middle item in the 50-item array
                                    const category = column2Categories[idx % column2Categories.length];
                                    return (
                                        <div key={`col2-${idx}`} className="h-20 flex items-center justify-center p-1">
                                            <CategoryItem
                                                category={category}
                                                isWinning={!spinning && isCenterItem}
                                                onClick={!spinning && isCenterItem ? () => handleCategoryReveal(category, 1) : undefined}
                                                disabled={revealedCategories[1] && isCenterItem}
                                            />
                                        </div>
                                    );
                                })}
                            </motion.div>
                        )}
                    </div>
                </div>

                <div className="w-1/3">
                    <div className="relative h-[400px] rounded-lg border-3 border-black/20 overflow-hidden bg-gray-900">
                        {/* Center indicator line */}
                        <div className='absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-gray-900 to-gray-900/10 z-50'></div>
                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-[#03438c6a] via-[#17ffc5] to-[#03438c6a] transform -translate-y-10 z-10"></div>
                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-[#03438c6a] via-[#17ffc5] to-[#03438c6a] transform translate-y-10 z-10"></div>
                        <div className='absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-b from-gray-900/10 to-gray-900 z-50'></div>

                        {/* Loading state */}
                        {columnLoading[2] && (
                            <div className="absolute inset-0 flex items-center justify-center z-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                            </div>
                        )}

                        {/* Slot items container with animation */}
                        {!columnLoading[2] && (
                            <motion.div
                                className="absolute inset-0 flex flex-col"
                                animate={columnControls[2]}
                            >
                                {Array.from({ length: 50 }).map((_, idx) => {
                                    const isCenterItem = idx === 25; // Middle item in the 50-item array
                                    const category = column3Categories[idx % column3Categories.length];
                                    return (
                                        <div key={`col3-${idx}`} className="h-20 flex items-center justify-center p-1">
                                            <CategoryItem
                                                category={category}
                                                isWinning={!spinning && isCenterItem}
                                                onClick={!spinning && isCenterItem ? () => handleCategoryReveal(category, 2) : undefined}
                                                disabled={revealedCategories[2] && isCenterItem}
                                            />
                                        </div>
                                    );
                                })}
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>

            {/* Spin Counter */}
            {/* {limits && (
                <div className="text-center text-sm text-gray-400 mt-4">
                    Spins left: {limits.spins.limit === -1 ? '∞' : Math.max(0, limits.spins.limit - limits.spins.used)}
                </div>
            )} */}

            {/* Spin Button */}
            <div className="text-center mt-4">
                <button
                    onClick={handleSpin}
                    disabled={spinning || loading}
                    className="relative flex flex-col items-center justify-center px-6 py-3 w-full mt-4 bg-gradient-to-r from-[#03438c6a] to-[#17ffc5ba] text-white rounded-lg font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:from-[#023a7a] hover:to-[#16e5b3] disabled:opacity-50 disabled:cursor-not-allowed animate-border-glow"
                    aria-label="Spin for business idea"
                >
                    <div className="flex items-center">
                        <RotateCw size={24} className={`mr-2 ${spinning ? 'animate-spin' : ''}`} />
                        {spinning ? 'Spinning...' : 'Spin'}
                    </div>
                    {!spinning && (
                        <span className="text-xs text-white mt-1">
                            {limits ? (limits.spins.limit === -1 ? '∞' : Math.max(0, limits.spins.limit - limits.spins.used)) : 'Loading...'} left today
                        </span>
                    )}
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mt-4 p-3 bg-red-900 border border-red-700 rounded-lg text-red-200 text-center">
                    {error}
                </div>
            )}

        </div>
    );
}
