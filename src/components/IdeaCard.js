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
    ChevronRight
} from 'lucide-react';
import { trackUserInteraction, isIdeaSaved, removeSavedIdea } from '@/lib/businessIdeas';
import { useSupabase } from '@/components/SupabaseProvider';

export default function IdeaCard({ idea, onIdeaClick, onCategoryClick, limits }) {
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

    // State for collapsible sections
    const [expandedSections, setExpandedSections] = useState({
        marketOpportunity: false,
        targetAudience: false,
        revenueModel: false,
        keyChallenges: false
    });

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

    // Toggle section expansion
    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
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
        // Extract the color part from the border class (e.g., "border-indigo-600/40" -> "border-indigo-600")
        const borderColorClass = categoryConfig.border.split(' ');
        return borderColorClass;
    };

    return (
        <div
            className={`
        relative rounded-xl shadow-lg cursor-pointer transition-all duration-300 transform
        hover:scale-105 hover:shadow-xl
        border-t-4 ${getCategoryConfig().border} ${getCategoryConfig().bg}
        flex flex-col overflow-hidden h-full
      `}
            onClick={() => onIdeaClick && onIdeaClick(idea)}
        >
            {/* Top bar with category button, date, and action buttons */}
            <div className="absolute top-3 left-4 right-4 flex justify-between items-center z-10">
                {/* Left side: Category button and date */}
                <div className="flex items-center space-x-2">
                    {/* Category button */}
                    <span
                        className="inline-flex items-center bg-gray-900 text-gray-300 text-sm p-3 rounded-full cursor-pointer hover:bg-gray-700 transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onCategoryClick) {
                                onCategoryClick(idea.category);
                            }
                        }}
                    >
                        {getCategoryConfig().icon && React.createElement(getCategoryConfig().icon, { size: 16, className: `mr-2 ${getCategoryConfig().textColor}` })}
                        {idea.category}
                    </span>

                    {/* Date display */}
                    {idea.date && (
                        <div className="text-xs text-gray-400">
                            {new Date(idea.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                            })}
                        </div>
                    )}
                </div>

                {/* Right side: Icons for copy and save */}
                <div className="flex items-center space-x-1 p-2 bg-gray-900 rounded-full shadow">
                    <button
                        onClick={handleCopy}
                        disabled={isRevealLimitReached && !isSaved}
                        className={`flex items-center justify-center p-2 rounded-full transition-colors flex-shrink-0 ${isRevealLimitReached && !isSaved ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700'}`}
                        aria-label={isRevealLimitReached && !isSaved ? "Reveal limit reached" : "Copy idea"}
                    >
                        {isCopied ? (
                            <Check size={16} className="text-emerald-500" />
                        ) : (
                            <Copy size={16} className={isRevealLimitReached && !isSaved ? "text-gray-600" : "text-gray-400"} />
                        )}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`flex items-center justify-center p-2 rounded-full hover:bg-gray-700 transition-colors flex-shrink-0 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                        aria-label="Save idea"
                    >
                        <Star size={16} className={isSaved ? "text-yellow-400 fill-current" : "text-gray-400"} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 pt-16 flex flex-col h-full"> {/* Increased pt from 12 to 16 for more spacing */}
                <h3 className="font-extrabold text-white text-2xl leading-tight mb-6 tracking-tight"> {/* Increased mb from 3 to 6 for more spacing */}
                    {idea.title}
                </h3>

                <p className="text-gray-300 text-base mb-4 font-light leading-relaxed tracking-wide opacity-90 flex-grow">
                    {idea.description}
                </p>

                {/* Spacer to push research section to bottom */}
                <div className="flex-grow"></div>

                {/* Collapsible detailed research data - only for Pro/Enterprise users */}
                {(limits?.tier === 'pro' || limits?.tier === 'enterprise') && (
                    <div className="space-y-2 text-sm text-gray-300 mb-4">
                        {idea.marketOpportunity && (
                            <div className={`border ${getExpandableBorderColor()} rounded-lg overflow-hidden`}>
                                <button
                                    className="flex items-center w-full p-3 hover:bg-gray-750 transition-colors text-left"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleSection('marketOpportunity');
                                    }}
                                >
                                    <div className="flex items-center flex-grow">
                                        <Target size={18} className="text-blue-400 mr-2 flex-shrink-0" />
                                        <h4 className="font-bold text-white text-base">Market Opportunity</h4>
                                    </div>
                                    {expandedSections.marketOpportunity ?
                                        <ChevronDown size={18} className="text-gray-400 flex-shrink-0 transition-transform duration-300" /> :
                                        <ChevronRight size={18} className="text-gray-400 flex-shrink-0 transition-transform duration-300" />
                                    }
                                </button>
                                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedSections.marketOpportunity ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                    }`}>
                                    <div className="p-3 bg-gray-850">
                                        <p className="opacity-90 text-sm">{idea.marketOpportunity}</p>
                                    </div>
                                </div>
                            </div>
                        )}


                        {idea.targetAudience && (
                            <div className={`border ${getExpandableBorderColor()} rounded-lg overflow-hidden`}>
                                <button
                                    className="flex items-center w-full p-3 hover:bg-gray-750 transition-colors text-left"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleSection('targetAudience');
                                    }}
                                >
                                    <div className="flex items-center flex-grow">
                                        <Users size={18} className="text-blue-400 mr-2 flex-shrink-0" />
                                        <h4 className="font-bold text-white text-base">Target Audience</h4>
                                    </div>
                                    {expandedSections.targetAudience ?
                                        <ChevronDown size={18} className="text-gray-400 flex-shrink-0 transition-transform duration-300" /> :
                                        <ChevronRight size={18} className="text-gray-400 flex-shrink-0 transition-transform duration-300" />
                                    }
                                </button>
                                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedSections.targetAudience ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                    }`}>
                                    <div className="p-3 bg-gray-850">
                                        <p className="opacity-90 text-sm">{idea.targetAudience}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {idea.revenueModel && (
                            <div className={`border ${getExpandableBorderColor()} rounded-lg overflow-hidden`}>
                                <button
                                    className="flex items-center w-full p-3 hover:bg-gray-750 transition-colors text-left"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleSection('revenueModel');
                                    }}
                                >
                                    <div className="flex items-center flex-grow">
                                        <FileText size={18} className="text-yellow-400 mr-2 flex-shrink-0" />
                                        <h4 className="font-bold text-white text-base">Revenue Model</h4>
                                    </div>
                                    {expandedSections.revenueModel ?
                                        <ChevronDown size={18} className="text-gray-400 flex-shrink-0 transition-transform duration-300" /> :
                                        <ChevronRight size={18} className="text-gray-400 flex-shrink-0 transition-transform duration-300" />
                                    }
                                </button>
                                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedSections.revenueModel ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                    }`}>
                                    <div className="p-3 bg-gray-850">
                                        <p className="opacity-90 text-sm">{idea.revenueModel}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        {idea.keyChallenges && (
                            <div className={`border ${getExpandableBorderColor()} rounded-lg overflow-hidden`}>
                                <button
                                    className="flex items-center w-full p-3 hover:bg-gray-750 transition-colors text-left"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleSection('keyChallenges');
                                    }}
                                >
                                    <div className="flex items-center flex-grow">
                                        <AlertTriangle size={18} className="text-red-400 mr-2 flex-shrink-0" />
                                        <h4 className="font-bold text-white text-base">Key Challenges</h4>
                                    </div>
                                    {expandedSections.keyChallenges ?
                                        <ChevronDown size={18} className="text-gray-400 flex-shrink-0 transition-transform duration-300" /> :
                                        <ChevronRight size={18} className="text-gray-400 flex-shrink-0 transition-transform duration-300" />
                                    }
                                </button>
                                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedSections.keyChallenges ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                    }`}>
                                    <div className="p-3 bg-gray-850">
                                        <p className="opacity-90 text-sm">{idea.keyChallenges}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex justify-between items-center">
                </div>
            </div>

            {/* Copy confirmation */}
            {isCopied && (
                <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center rounded-xl">
                    <span className="text-white font-medium">Copied to clipboard!</span>
                </div>
            )}
        </div>
    );
}
