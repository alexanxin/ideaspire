"use client";

import React, { useState, useEffect } from 'react';
import {
    Copy,
    Star,
    Check,
    Computer,
    Rocket,
    ShoppingCart,
    Wrench,
    Code,
    Zap,
    Heart,
    Home,
    Activity,
    Book,
    Target,
    Users,
    FileText,
    AlertTriangle,
    ChevronDown,
    ChevronRight,
    Lightbulb,
    Wallet,
    TrendingUp
} from 'lucide-react';
import { trackUserInteraction, isIdeaSaved, removeSavedIdea } from '@/lib/businessIdeas';
import { useSupabase } from '@/components/SupabaseProvider';

export default function IdeaCard({ idea, onIdeaClick, onCategoryClick, limits, onClose }) {
    const { supabase, user } = useSupabase();
    const [isCopied, setIsCopied] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const isRevealLimitReached = limits && limits.reveals.limit !== -1 && limits.reveals.used >= limits.reveals.limit;

    // Check if the idea is already saved when the component mounts
    useEffect(() => {
        const checkIfSaved = async () => {
            if (idea.id) {
                try {
                    const result = await isIdeaSaved(supabase, user, idea.id);
                    if (result.success) {
                        setIsSaved(result.isSaved);
                    }
                } catch (error) {
                    console.error('Error checking if idea is saved:', error);
                }
            }
        };

        checkIfSaved();
    }, [idea.id, supabase, user]);

    const handleCopy = async (e) => {
        e.stopPropagation();
        try {
            // Try modern clipboard API first (works in HTTPS)
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(idea.prompt);
            } else {
                // Fallback for HTTP environments
                fallbackCopyTextToClipboard(idea.prompt);
            }
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);

            // Track reveal interaction
            if (idea.id) {
                await trackUserInteraction(
                    supabase,
                    user,
                    idea.id,
                    'reveal',
                    {
                        title: idea.title,
                        action: 'revealed',
                        timestamp: new Date().toISOString()
                    }
                );
            }
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    const fallbackCopyTextToClipboard = (text) => {
        const textArea = document.createElement('textarea');
        textArea.value = text;

        // Avoid scrolling to bottom
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            const successful = document.execCommand('copy');
            if (!successful) {
                throw new Error('Fallback copy method failed');
            }
        } catch (err) {
            console.error('Failed to copy text using fallback method: ', err);
        }

        document.body.removeChild(textArea);
    };

    const handleSave = async (e) => {
        e.stopPropagation();

        // Prevent multiple clicks during operation
        if (isSaving) return;

        try {
            // Set saving state
            setIsSaving(true);

            // Toggle the saved state
            const newSavedState = !isSaved;
            setIsSaved(newSavedState);

            // Track the interaction in the database
            if (idea.id) {
                let result;
                if (newSavedState) {
                    // Liking the idea
                    result = await trackUserInteraction(
                        supabase,
                        user,
                        idea.id,
                        'like',
                        {
                            title: idea.title,
                            action: 'liked',
                            timestamp: new Date().toISOString()
                        }
                    );
                } else {
                    // Removing the liked idea
                    result = await removeSavedIdea(supabase, user, idea.id);
                }

                if (!result.success) {
                    // If the operation failed, revert the state
                    setIsSaved(isSaved);
                    console.error('Error saving/unsaving idea:', result.error);
                }
            }
        } catch (error) {
            // If there was an error, revert the state
            setIsSaved(isSaved);
            console.error('Error saving/unsaving idea:', error);
        } finally {
            // Add a small delay to ensure visual feedback is visible
            setTimeout(() => {
                setIsSaving(false);
            }, 300); // 300ms delay
        }
    };

    // Determine color and icon based on category
    const getCategoryConfig = () => {
        const categoryConfig = {
            'Tech': {
                border: 'border-indigo-600/40',
                bg: 'bg-indigo-900/15',
                icon: Computer,
                textColor: 'text-indigo-300'
            },
            'Startup': {
                border: 'border-purple-600/40',
                bg: 'bg-purple-900/15',
                icon: Rocket,
                textColor: 'text-purple-300'
            },
            'E-commerce': {
                border: 'border-green-600/40',
                bg: 'bg-green-900/15',
                icon: ShoppingCart,
                textColor: 'text-green-300'
            },
            'Service': {
                border: 'border-yellow-600/40',
                bg: 'bg-yellow-900/15',
                icon: Wrench,
                textColor: 'text-yellow-300'
            },
            'Vibe Coding': {
                border: 'border-indigo-600/40',
                bg: 'bg-indigo-900/15',
                icon: Code,
                textColor: 'text-indigo-300'
            },
            'Quick Money': {
                border: 'border-red-600/40',
                bg: 'bg-red-900/15',
                icon: Zap,
                textColor: 'text-red-300'
            },
            'Social Impact': {
                border: 'border-teal-600/40',
                bg: 'bg-teal-900/15',
                icon: Heart,
                textColor: 'text-teal-300'
            },
            'Remote Work': {
                border: 'border-cyan-600/40',
                bg: 'bg-cyan-900/15',
                icon: Home,
                textColor: 'text-cyan-300'
            },
            'Health & Wellness': {
                border: 'border-pink-600/40',
                bg: 'bg-pink-900/15',
                icon: Activity,
                textColor: 'text-pink-300'
            },
            'Education': {
                border: 'border-orange-600/40',
                bg: 'bg-orange-900/15',
                icon: Book,
                textColor: 'text-orange-300'
            },
            'default': {
                border: 'border-gray-600/40',
                bg: 'bg-gray-900/15',
                icon: null,
                textColor: 'text-gray-500'
            }
        };
        return categoryConfig[idea.category] || categoryConfig.default;
    };

    // Get the border color for expandable sections
    const getExpandableBorderColor = () => {
        const categoryConfig = getCategoryConfig();
        return categoryConfig.border;
    };

    return (
        <div
            className={`
        relative rounded-xl shadow-lg cursor-pointer transition-all duration-300 transform idea-card-hover
        border-t-4 ${getCategoryConfig().border} ${getCategoryConfig().bg}
        flex flex-col overflow-hidden w-full max-w-6xl mx-auto
      `}
            onClick={() => onIdeaClick && onIdeaClick(idea)}
        >
            {/* Top bar with category button, date, and action buttons */}
            <div className="absolute top-6 left-8 right-8 flex justify-between items-center z-10">
                {/* Left side: Category button and date */}
                <div className="flex items-center space-x-4">
                    {/* Category button */}
                    <span
                        className="inline-flex items-center bg-gray-900 text-gray-300 text-base px-5 py-3 rounded-full cursor-pointer hover:bg-gray-700 transition-colors category-badge"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onCategoryClick) {
                                onCategoryClick(idea.category);
                            }
                        }}
                    >
                        {getCategoryConfig().icon && React.createElement(getCategoryConfig().icon, { size: 18, className: `mr-3 ${getCategoryConfig().textColor}` })}
                        {idea.category}
                    </span>

                    {/* Date display */}
                    {idea.date && (
                        <div className="text-base text-gray-400">
                            {new Date(idea.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                            })}
                        </div>
                    )}
                </div>

                {/* Right side: Close button and action buttons */}
                <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2 p-4 rounded-full shadow">
                        <button
                            onClick={handleCopy}
                            disabled={isRevealLimitReached}
                            className={`flex items-center justify-center p-4 rounded-full transition-colors flex-shrink-0 action-button ${isRevealLimitReached ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700'}`}
                            aria-label={isRevealLimitReached ? "Reveal limit reached" : "Copy idea"}
                        >
                            {isCopied ? (
                                <Check size={20} className="text-emerald-50" />
                            ) : (
                                <Copy size={20} className={isRevealLimitReached ? "text-gray-600" : "text-gray-400"} />
                            )}
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className={`flex items-center justify-center p-4 rounded-full hover:bg-gray-700 transition-colors flex-shrink-0 action-button ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                            aria-label="Save idea"
                        >
                            <Star size={20} className={isSaved ? "text-yellow-400 fill-current" : "text-gray-400"} />
                        </button>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                            aria-label="Close modal"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-12 pt-28 flex flex-col h-full">
                <h3 className="font-extrabold text-white text-4xl leading-tight mb-8 tracking-tight">
                    {idea.title}
                </h3>

                <p className="text-gray-300 mb-12 font-light leading-relaxed tracking-wide opacity-90">
                    {idea.description}
                </p>

                {/* Visual separator */}
                <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent mb-12"></div>

                {/* Expanded detailed research data - now always visible for all users */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-gray-300 mb-12 flex-grow">
                    {idea.marketOpportunity && (
                        <div className={`border-l-4 ${getExpandableBorderColor()} pl-8 py-4 bg-gray-800/30 rounded-r-lg`}>
                            <div className="flex items-center mb-4">
                                <Target size={24} className="text-blue-400 mr-4 flex-shrink-0" />
                                <h4 className="font-bold text-white text-xl">Market Opportunity</h4>
                            </div>
                            <p className="opacity-90 text-sm leading-relaxed">{idea.marketOpportunity}</p>
                        </div>
                    )}

                    {idea.targetAudience && (
                        <div className={`border-l-4 ${getExpandableBorderColor()} pl-8 py-4 bg-gray-800/30 rounded-r-lg`}>
                            <div className="flex items-center mb-4">
                                <Users size={24} className="text-blue-400 mr-4 flex-shrink-0" />
                                <h4 className="font-bold text-white text-xl">Target Audience</h4>
                            </div>
                            <p className="opacity-90 text-sm leading-relaxed">{idea.targetAudience}</p>
                        </div>
                    )}

                    {idea.revenueModel && (
                        <div className={`border-l-4 ${getExpandableBorderColor()} pl-8 py-4 bg-gray-800/30 rounded-r-lg`}>
                            <div className="flex items-center mb-4">
                                <FileText size={24} className="text-yellow-400 mr-4 flex-shrink-0" />
                                <h4 className="font-bold text-white text-xl">Revenue Model</h4>
                            </div>
                            <p className="opacity-90 text-sm leading-relaxed">{idea.revenueModel}</p>
                        </div>
                    )}

                    {idea.keyChallenges && (
                        <div className={`border-l-4 ${getExpandableBorderColor()} pl-8 py-4 bg-gray-800/30 rounded-r-lg`}>
                            <div className="flex items-center mb-4">
                                <AlertTriangle size={24} className="text-red-400 mr-4 flex-shrink-0" />
                                <h4 className="font-bold text-white text-xl">Key Challenges</h4>
                            </div>
                            <p className="opacity-90 text-sm leading-relaxed">{idea.keyChallenges}</p>
                        </div>
                    )}
                </div>

                {/* Visual separator before guidance */}
                <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent mb-12"></div>

                {/* Comprehensive Minting Guidance Section */}
                <div className="bg-gradient-to-r from-gray-700/50 to-gray-800/50 rounded-xl border border-gray-600 p-8 mb-8">
                    <div className="flex items-center mb-8">
                        <Lightbulb className="h-8 w-8 text-yellow-400 mr-4" />
                        <h4 className="font-bold text-white text-2xl">Idea Development & Minting Guide</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="flex items-start p-4 bg-gray-800/30 rounded-lg">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold mr-5 mt-1">1</div>
                            <div>
                                <h5 className="font-semibold text-white text-lg mb-2">Validate Your Idea</h5>
                                <p className="text-gray-300 text-base leading-relaxed text-sm">Research the market, validate demand, and refine your concept before development.</p>
                            </div>
                        </div>

                        <div className="flex items-start p-4 bg-gray-800/30 rounded-lg">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white text-lg font-bold mr-5 mt-1">2</div>
                            <div>
                                <h5 className="font-semibold text-white text-lg mb-2">Create a Business Plan</h5>
                                <p className="text-gray-300 text-base leading-relaxed text-sm">Develop a detailed business plan outlining your strategy, market analysis, and financial projections.</p>
                            </div>
                        </div>

                        <div className="flex items-start p-4 bg-gray-800/30 rounded-lg">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold mr-5 mt-1">3</div>
                            <div>
                                <h5 className="font-semibold text-white mb-2">Prototype & Test</h5>
                                <p className="text-gray-300 text-base leading-relaxed text-sm">Build a minimum viable product (MVP) and gather feedback from potential users.</p>
                            </div>
                        </div>

                        <div className="flex items-start p-4 bg-gray-800/30 rounded-lg">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold mr-5 mt-1">4</div>
                            <div>
                                <h5 className="font-semibold text-white mb-2">Mint as NFT (Optional)</h5>
                                <p className="text-gray-300 text-base leading-relaxed text-sm">Transform your idea into a digital asset to establish ownership and potentially monetize it.</p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={handleCopy}
                            disabled={isRevealLimitReached}
                            className={`flex items-center px-6 py-4 rounded-lg transition-colors action-button text-base ${isRevealLimitReached
                                ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                                }`}
                        >
                            {isCopied ? (
                                <>
                                    <Check className="h-6 w-6 mr-3" />
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <Copy className="h-6 w-6 mr-3" />
                                    Copy Idea
                                </>
                            )}
                        </button>

                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className={`flex items-center px-6 py-4 rounded-lg transition-colors action-button text-base ${isSaved
                                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                                }`}
                        >
                            <Star className={`h-6 w-6 mr-3 ${isSaved ? 'fill-current' : ''}`} />
                            {isSaved ? 'Saved' : 'Save Idea'}
                        </button>

                        <button
                            className="flex items-center px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg transition-all action-button text-base"
                            onClick={(e) => {
                                e.stopPropagation();
                                alert("NFT minting feature would open here - establish ownership and potentially monetize your idea");
                            }}
                        >
                            <Wallet className="h-6 w-6 mr-3" />
                            Mint as NFT
                        </button>

                        <button
                            className="flex items-center px-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors action-button text-base"
                            onClick={(e) => {
                                e.stopPropagation();
                                alert("Development workflow would start here - business planning, prototyping, and fundraising guidance");
                            }}
                        >
                            <TrendingUp className="h-6 w-6 mr-3" />
                            Develop Idea
                        </button>
                    </div>
                </div>
            </div>

            {/* Copy confirmation */}
            {isCopied && (
                <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center rounded-xl">
                    <span className="text-white font-medium text-lg">Copied to clipboard!</span>
                </div>
            )}
        </div>
    );
}


