"use client";

import React, { useState, useEffect } from 'react';
import { Copy, Check, Star, Target, Users, FileText, AlertTriangle, Wallet, TrendingUp, Lightbulb } from 'lucide-react';
import { trackUserInteraction, isIdeaSaved, removeSavedIdea } from '@/lib/businessIdeas';
import { useSupabase } from '@/components/SupabaseProvider';

export default function DetailedIdeaView({ idea, onClose, limits }) {
    const { supabase, user } = useSupabase();
    const [isCopied, setIsCopied] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

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

    const handleCopy = async () => {
        try {
            // Try modern clipboard API first (works in HTTPS)
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(idea.prompt || idea.description);
            } else {
                // Fallback for HTTP environments
                fallbackCopyTextToClipboard(idea.prompt || idea.description);
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

    const handleSave = async () => {
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
                border: 'border-indigo-60/40',
                bg: 'bg-indigo-900/15',
                icon: 'indigo',
                textColor: 'text-indigo-300'
            },
            'Startup': {
                border: 'border-purple-600/40',
                bg: 'bg-purple-900/15',
                icon: 'purple',
                textColor: 'text-purple-300'
            },
            'E-commerce': {
                border: 'border-green-600/40',
                bg: 'bg-green-900/15',
                icon: 'green',
                textColor: 'text-green-300'
            },
            'Service': {
                border: 'border-yellow-600/40',
                bg: 'bg-yellow-900/15',
                icon: 'yellow',
                textColor: 'text-yellow-300'
            },
            'Vibe Coding': {
                border: 'border-indigo-60/40',
                bg: 'bg-indigo-900/15',
                icon: 'indigo',
                textColor: 'text-indigo-300'
            },
            'Quick Money': {
                border: 'border-red-600/40',
                bg: 'bg-red-900/15',
                icon: 'red',
                textColor: 'text-red-300'
            },
            'Social Impact': {
                border: 'border-teal-60/40',
                bg: 'bg-teal-900/15',
                icon: 'teal',
                textColor: 'text-teal-300'
            },
            'Remote Work': {
                border: 'border-cyan-600/40',
                bg: 'bg-cyan-900/15',
                icon: 'cyan',
                textColor: 'text-cyan-300'
            },
            'Health & Wellness': {
                border: 'border-pink-60/40',
                bg: 'bg-pink-90/15',
                icon: 'pink',
                textColor: 'text-pink-300'
            },
            'Education': {
                border: 'border-orange-600/40',
                bg: 'bg-orange-900/15',
                icon: 'orange',
                textColor: 'text-orange-300'
            },
            'default': {
                border: 'border-gray-600/40',
                bg: 'bg-gray-900/15',
                icon: 'gray',
                textColor: 'text-gray-500'
            }
        };
        return categoryConfig[idea.category] || categoryConfig.default;
    };

    const categoryConfig = getCategoryConfig();

    const getIconColor = (colorName) => {
        const colors = {
            indigo: 'text-indigo-400',
            purple: 'text-purple-400',
            green: 'text-green-400',
            yellow: 'text-yellow-400',
            red: 'text-red-400',
            teal: 'text-teal-400',
            cyan: 'text-cyan-400',
            pink: 'text-pink-40',
            orange: 'text-orange-400',
            gray: 'text-gray-400'
        };
        return colors[colorName] || colors.gray;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex-1">
                            <h3 className="text-2xl font-bold text-white mb-2">{idea.title}</h3>
                            <div className="flex items-center space-x-3 mb-4">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-900 ${categoryConfig.textColor} ${categoryConfig.border} border`}>
                                    {idea.category}
                                </span>
                                {idea.date && (
                                    <span className="text-xs text-gray-400">
                                        {new Date(idea.date).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white text-2xl"
                        >
                            ✕
                        </button>
                    </div>

                    <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                        {idea.description}
                    </p>

                    {/* Detailed sections */}
                    <div className="space-y-6 mb-8">
                        {idea.marketOpportunity && (
                            <div className={`border-l-4 ${categoryConfig.border} pl-4 py-1`}>
                                <div className="flex items-center mb-2">
                                    <Target className={`h-5 w-5 mr-2 ${getIconColor(categoryConfig.icon)}`} />
                                    <h4 className="font-bold text-white text-lg">Market Opportunity</h4>
                                </div>
                                <p className="text-gray-300">{idea.marketOpportunity}</p>
                            </div>
                        )}

                        {idea.targetAudience && (
                            <div className={`border-l-4 ${categoryConfig.border} pl-4 py-1`}>
                                <div className="flex items-center mb-2">
                                    <Users className={`h-5 w-5 mr-2 ${getIconColor(categoryConfig.icon)}`} />
                                    <h4 className="font-bold text-white text-lg">Target Audience</h4>
                                </div>
                                <p className="text-gray-300">{idea.targetAudience}</p>
                            </div>
                        )}

                        {idea.revenueModel && (
                            <div className={`border-l-4 ${categoryConfig.border} pl-4 py-1`}>
                                <div className="flex items-center mb-2">
                                    <FileText className={`h-5 w-5 mr-2 ${getIconColor(categoryConfig.icon)}`} />
                                    <h4 className="font-bold text-white text-lg">Revenue Model</h4>
                                </div>
                                <p className="text-gray-300">{idea.revenueModel}</p>
                            </div>
                        )}

                        {idea.keyChallenges && (
                            <div className={`border-l-4 ${categoryConfig.border} pl-4 py-1`}>
                                <div className="flex items-center mb-2">
                                    <AlertTriangle className={`h-5 w-5 mr-2 ${getIconColor(categoryConfig.icon)}`} />
                                    <h4 className="font-bold text-white text-lg">Key Challenges</h4>
                                </div>
                                <p className="text-gray-300">{idea.keyChallenges}</p>
                            </div>
                        )}
                    </div>

                    {/* Minting Guidance Section */}
                    <div className="bg-gradient-to-r from-gray-700/50 to-gray-800/50 rounded-xl border border-gray-600 p-6 mb-6">
                        <div className="flex items-center mb-4">
                            <Lightbulb className="h-6 w-6 text-yellow-400 mr-2" />
                            <h4 className="font-bold text-white text-lg">Idea Development & Minting Guide</h4>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start">
                                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold mr-3 mt-0.5">1</div>
                                <div>
                                    <h5 className="font-semibold text-white">Validate Your Idea</h5>
                                    <p className="text-gray-300 text-sm">Research the market, validate demand, and refine your concept before development.</p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold mr-3 mt-0.5">2</div>
                                <div>
                                    <h5 className="font-semibold text-white">Create a Business Plan</h5>
                                    <p className="text-gray-300 text-sm">Develop a detailed business plan outlining your strategy, market analysis, and financial projections.</p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold mr-3 mt-0.5">3</div>
                                <div>
                                    <h5 className="font-semibold text-white">Prototype & Test</h5>
                                    <p className="text-gray-300 text-sm">Build a minimum viable product (MVP) and gather feedback from potential users.</p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold mr-3 mt-0.5">4</div>
                                <div>
                                    <h5 className="font-semibold text-white">Mint as NFT (Optional)</h5>
                                    <p className="text-gray-300 text-sm">Transform your idea into a digital asset to establish ownership and potentially monetize it.</p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-3 mt-6">
                            <button
                                onClick={handleCopy}
                                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors action-button"
                            >
                                {isCopied ? (
                                    <>
                                        <Check className="h-4 w-4 mr-2" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-4 w-4 mr-2" />
                                        Copy Idea
                                    </>
                                )}
                            </button>

                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className={`flex items-center px-4 py-2 rounded-lg transition-colors action-button ${isSaved
                                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
                            >
                                <Star className={`h-4 w-4 mr-2 ${isSaved ? 'fill-current' : ''}`} />
                                {isSaved ? 'Saved' : 'Save Idea'}
                            </button>

                            <button
                                className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg transition-all action-button"
                            >
                                <Wallet className="h-4 w-4 mr-2" />
                                Mint as NFT
                            </button>

                            <button
                                className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors action-button"
                            >
                                <TrendingUp className="h-4 w-4 mr-2" />
                                Develop Idea
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}