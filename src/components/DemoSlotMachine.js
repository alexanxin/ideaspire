"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { RotateCw, Sparkles } from 'lucide-react';

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
                border-t-4 py-3 ${getCategoryClasses(category).border} ${getCategoryClasses(category).bg}
                flex flex-col overflow-hidden
                ${isWinning ? ' hover:scale-105' : ''}
                ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : onClick ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
            `}
            onClick={handleClick}
        >
            <div className="p-3 flex flex-col items-center justify-center h-full">
                <h4 className={`font-bold text-sm leading-tight mb-2 tracking-tight text-center ${disabled ? 'text-gray-400' : 'text-white'}`}>
                    {category}
                </h4>
            </div>
        </div>
    );
};



export default React.forwardRef(function DemoSlotMachine({ onIdeaRevealed, paused = false }, ref) {
    const containerRef = useRef(null);

    // Expose method to reset global idea tracking
    React.useImperativeHandle(ref, () => ({
        resetGlobalIdeaTracking: () => {
            globallyUsedIdeaIds.current.clear();
        },
        getBoundingClientRect: () => {
            return containerRef.current?.getBoundingClientRect();
        }
    }));
    const [spinning, setSpinning] = useState(false);
    const [loading, setLoading] = useState(false);
    const [revealedCategory, setRevealedCategory] = useState(null);
    const [columnLoading, setColumnLoading] = useState(true);
    const [countdown, setCountdown] = useState(7);
    const columnControls = useAnimation();

    // Track recently used categories to avoid repetition
    const [recentCategories, setRecentCategories] = useState([]);

    // State for randomized categories
    const [columnCategories, setColumnCategories] = useState([]);

    // Store all mock ideas fetched once
    const [allIdeas, setAllIdeas] = useState([]);

    // Track globally used idea IDs to prevent duplicates across all floating ideas
    const globallyUsedIdeaIds = useRef(new Set());

    // Initialize column and fetch all ideas on mount
    useEffect(() => {
        initializeColumn();
        fetchAllIdeas();
    }, []);

    const fetchAllIdeas = async () => {
        try {
            const response = await fetch('/api/mock-ideas');
            if (response.ok) {
                const data = await response.json();
                setAllIdeas(data.ideas || []);
            }
        } catch (error) {
            console.error('Error fetching all mock ideas:', error);
        }
    };

    // Track if first spin has been triggered
    const [firstSpinTriggered, setFirstSpinTriggered] = useState(false);

    // Trigger first spin when ideas are loaded
    useEffect(() => {
        if (!firstSpinTriggered && allIdeas.length > 0 && !columnLoading) {
            setFirstSpinTriggered(true);
            setCountdown(7); // Reset countdown for first spin
            // Small delay to ensure smooth loading transition
            const firstSpinTimer = setTimeout(() => {
                if (!spinning && !loading && !paused) {
                    handleAutoSpin();
                }
            }, 1000);

            return () => clearTimeout(firstSpinTimer);
        }
    }, [allIdeas.length, columnLoading, spinning, loading, paused]);

    // Countdown timer
    useEffect(() => {
        if (!firstSpinTriggered) return;

        const countdownInterval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    return 0; // Show 0s at the end
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(countdownInterval);
    }, [firstSpinTriggered]);

    // Reset countdown when spin finishes (button becomes enabled)
    useEffect(() => {
        if (!spinning && firstSpinTriggered) {
            setCountdown(7);
        }
    }, [spinning, firstSpinTriggered]);

    // Regular auto-spin interval
    useEffect(() => {
        const interval = setInterval(() => {
            if (!spinning && !loading && !paused && firstSpinTriggered) {
                handleAutoSpin();
            }
        }, 7000);

        return () => clearInterval(interval);
    }, [spinning, loading, paused]);

    const initializeColumn = async () => {
        // Create randomized categories for smooth continuous spinning
        const extendedCategories = [];
        for (let i = 0; i < 50; i++) {
            // Get categories excluding recent ones to avoid repetition
            const availableCategories = CATEGORIES.filter(cat => !recentCategories.includes(cat));
            // If we don't have enough categories left, use all categories
            const categoriesToUse = availableCategories.length > 0 ? availableCategories : CATEGORIES;
            extendedCategories.push(...categoriesToUse.sort(() => Math.random() - 0.5));
        }
        setColumnCategories(extendedCategories);

        // Stagger the loading
        setTimeout(() => {
            setColumnLoading(false);
        }, 500);
    };

    const getRandomIdeaByCategory = (category) => {
        // Get available ideas for this category that haven't been used globally
        const availableIdeas = allIdeas.filter(
            idea => idea.category === category && !globallyUsedIdeaIds.current.has(idea.id)
        );

        if (availableIdeas.length === 0) {
            return null; // No available ideas for this category
        }

        // Pick a random available idea
        const randomIndex = Math.floor(Math.random() * availableIdeas.length);
        const selectedIdea = availableIdeas[randomIndex];

        // Mark this idea as globally used
        globallyUsedIdeaIds.current.add(selectedIdea.id);

        return selectedIdea;
    };


    const handleAutoSpin = async () => {
        if (spinning || loading) return;

        setSpinning(true);
        setLoading(true);
        setRevealedCategory(null);

        // Randomize categories before each spin, excluding recent ones
        const randomizedCategories = [];
        for (let i = 0; i < 50; i++) {
            // Get categories excluding recent ones to avoid repetition
            const availableCategories = CATEGORIES.filter(cat => !recentCategories.includes(cat));
            // If we don't have enough categories left, use all categories
            const categoriesToUse = availableCategories.length > 0 ? availableCategories : CATEGORIES;
            randomizedCategories.push(...categoriesToUse.sort(() => Math.random() - 0.5));
        }
        setColumnCategories(randomizedCategories);

        try {
            // Start spinning animation with random duration
            const spinDuration = 2 + Math.random() * 2; // 2-4 seconds

            columnControls.start({
                y: [0, -1840], // Move to center item 25 exactly at container center
                transition: {
                    duration: spinDuration,
                    ease: "easeOut"
                }
            });

            // Wait for animation to complete
            await new Promise(resolve => setTimeout(resolve, spinDuration * 1000));

            // Get the center category from the newly randomized array
            const centerCategory = randomizedCategories[25];
            setRevealedCategory(centerCategory);

            // Update recent categories - keep only the last 3
            setRecentCategories(prev => {
                const newRecent = [...prev, centerCategory];
                // Keep only the last 3 categories to avoid repetition
                return newRecent.slice(-3);
            });

            // Auto-reveal the idea after a short delay
            setTimeout(() => {
                handleCategoryReveal(centerCategory);
            }, 500);

            setSpinning(false);
            setLoading(false);

        } catch (error) {
            console.error('Auto-spin error:', error);
            setSpinning(false);
            setLoading(false);
        }
    };

    const handleCategoryReveal = (category) => {
        if (spinning || allIdeas.length === 0) return;

        setLoading(true);

        // Get a random unused idea from the winning category
        const idea = getRandomIdeaByCategory(category);

        if (idea && onIdeaRevealed) {
            onIdeaRevealed(idea);
        }
        // If no idea is available for this category, we don't show one
        // This ensures the slot machine always lands on the winning category visually

        setLoading(false);
    };

    const handleManualSpin = () => {
        handleAutoSpin();
    };


    return (
        <div className="mx-auto p-4 bg-gradient-to-br shadow-sm max-w-sm relative border border-gray-700 rounded-xl" ref={containerRef}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                    <Sparkles className="h-5 w-5 text-purple-500 mr-2" />
                    <h2 className="text-lg font-bold text-white">Spin to Inspire Yourself</h2>
                </div>
            </div>
            <p className="text-gray-400 text-xs text-left mb-4 leading-relaxed">
                Discover daily curated business ideas based on real user pain points, market gaps, and emerging opportunities. From innovative tools to solve common problems to scalable ventures addressing global challenges.
            </p>

            {/* Single Column Slot Machine */}
            <div className="relative mb-4 flex justify-center items-center">
                <div className="w-full max-w-xs">
                    <div className="relative h-[400px] rounded-lg border border-gray-700 overflow-hidden bg-gray-900">
                        {/* Center indicator line */}
                        <div className='absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-gray-900 to-gray-900/10 z-50'></div>
                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-[#03438c6a] via-[#17ffc5] to-[#03438c6a] transform -translate-y-10 z-10"></div>
                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-[#03438c6a] via-[#17ffc5] to-[#03438c6a] transform translate-y-10 z-10"></div>
                        <div className='absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-b from-gray-900/10 to-gray-900 z-50'></div>

                        {/* Loading state */}
                        {columnLoading && (
                            <div className="absolute inset-0 flex items-center justify-center z-20">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            </div>
                        )}

                        {/* Slot items container with animation */}
                        {!columnLoading && (
                            <motion.div
                                className="absolute inset-0 flex-col"
                                animate={columnControls}
                            >
                                {Array.from({ length: 50 }).map((_, idx) => {
                                    const isCenterItem = idx === 25;
                                    const category = columnCategories[idx % columnCategories.length];
                                    return (
                                        <div key={`col-${idx}`} className="h-20 flex items-center justify-center p-1 ">
                                            <CategoryItem
                                                category={category}
                                                isWinning={!spinning && isCenterItem && revealedCategory === category}
                                                onClick={!spinning && isCenterItem ? () => handleCategoryReveal(category) : undefined}
                                                disabled={revealedCategory && revealedCategory !== category && isCenterItem}
                                            />
                                        </div>
                                    );
                                })}
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>

            {/* Spin Button */}
            <div className="text-center items-center justify-center">
                <button
                    onClick={handleManualSpin}
                    disabled={spinning || loading || paused}
                    className="relative flex flex-col items-center justify-center py-3 mt-2 max-w-[320px] mx-auto bg-gradient-to-r from-[#03438c6a] to-[#17ffc5ba] text-white rounded-lg font-bold text-sm transition-all duration-200 shadow-lg hover:shadow-xl hover:from-[#023a7a] hover:to-[#16e5b3] disabled:opacity-50 disabled:cursor-not-allowed w-full"
                >
                    <div className="flex items-center">
                        <RotateCw size={16} className={`mr-2 ${spinning ? 'animate-spin' : ''}`} />
                        {spinning ? 'Spinning...' : `Spin Now (${countdown}s)`}
                    </div>
                </button>
                <p className="text-xs text-gray-500 mt-2">
                    These are mock ideas for demo purposes • Feel free to realize any that vibes with you!
                </p>
            </div>

        </div>
    );
});