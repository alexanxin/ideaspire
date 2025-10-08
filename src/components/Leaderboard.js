"use client";

import { useState, useEffect } from 'react';
import { Trophy, Star, Copy, Check, Users, DollarSign, AlertTriangle, Target, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { PropagateLoader } from 'react-spinners';
import { getAllIdeas } from '@/lib/dailyIdeas';
import { trackUserInteraction, isIdeaSaved, removeSavedIdea } from '@/lib/businessIdeas';
import { useSupabase } from '@/components/SupabaseProvider';
import { isSupabaseConfigured } from '@/lib/supabaseClient';

export default function Leaderboard() {
    const { supabase, user, tier } = useSupabase();
    const [ideas, setIdeas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copiedStates, setCopiedStates] = useState({});
    const [savedStates, setSavedStates] = useState({});

    // State for collapsible sections per idea
    const [expandedSections, setExpandedSections] = useState({});

    useEffect(() => {
        const fetchIdeas = async () => {
            setLoading(true);
            // Fetch all ideas from all dates to rank by save count
            const result = await getAllIdeas(0, 100); // Get first 100 ideas to rank

            if (result.success) {
                // Get save counts for each idea
                const ideasWithSaveCounts = await Promise.all(
                    result.ideas.map(async (idea) => {
                        const saveCount = await getIdeaSaveCount(idea.id);
                        return { ...idea, saveCount };
                    })
                );

                // Sort ideas by save count (descending)
                const sortedIdeas = ideasWithSaveCounts.sort((a, b) => {
                    return (b.saveCount || 0) - (a.saveCount || 0);
                });

                setIdeas(sortedIdeas.slice(0, 10));

                // Initialize saved states
                const initialSavedStates = {};
                for (const idea of sortedIdeas.slice(0, 10)) {
                    if (idea.id) {
                        try {
                            const savedResult = await isIdeaSaved(supabase, user, idea.id);
                            if (savedResult.success) {
                                initialSavedStates[idea.id] = savedResult.isSaved;
                            }
                        } catch (error) {
                            console.error('Error checking if idea is saved:', error);
                        }
                    }
                }
                setSavedStates(initialSavedStates);
            }
            setLoading(false);
        };

        fetchIdeas();
    }, []);

    // Update saved states when user changes (login/logout)
    useEffect(() => {
        if (ideas.length > 0) {
            const updateSavedStates = async () => {
                const updatedSavedStates = {};
                for (const idea of ideas) {
                    if (idea.id) {
                        try {
                            const savedResult = await isIdeaSaved(supabase, user, idea.id);
                            if (savedResult.success) {
                                updatedSavedStates[idea.id] = savedResult.isSaved;
                            }
                        } catch (error) {
                            console.error('Error checking if idea is saved:', error);
                        }
                    }
                }
                setSavedStates(updatedSavedStates);
            };
            updateSavedStates();
        }
    }, [user, ideas, supabase]);

    const getIdeaSaveCount = async (ideaId) => {
        if (!isSupabaseConfigured()) {
            // In development, return a random number for testing
            return Math.floor(Math.random() * 10);
        }

        try {
            const { count, error } = await supabase
                .from('user_interactions')
                .select('*', { count: 'exact', head: true })
                .eq('idea_id', ideaId)
                .eq('interaction_type', 'like');

            if (error) {
                console.error('Error fetching save count:', error);
                return 0;
            }

            return count || 0;
        } catch (error) {
            console.error('Error fetching save count:', error);
            return 0;
        }
    };

    const getCategoryClasses = (category) => {
        const categoryStyles = {
            'Tech': { border: 'border-indigo-600/40', bg: 'bg-indigo-900/15' },
            'Startup': { border: 'border-purple-600/40', bg: 'bg-purple-900/15' },
            'E-commerce': { border: 'border-green-600/40', bg: 'bg-green-900/15' },
            'Service': { border: 'border-yellow-600/40', bg: 'bg-yellow-900/15' },
            'Vibe Coding': { border: 'border-indigo-600/40', bg: 'bg-indigo-900/15' },
            'Quick Money': { border: 'border-red-600/40', bg: 'bg-red-900/15' },
            'Social Impact': { border: 'border-teal-60/40', bg: 'bg-teal-900/15' },
            'Remote Work': { border: 'border-cyan-600/40', bg: 'bg-cyan-900/15' },
            'Health & Wellness': { border: 'border-pink-600/40', bg: 'bg-pink-900/15' },
            'Education': { border: 'border-orange-600/40', bg: 'bg-orange-900/15' },
            'default': { border: 'border-gray-600/40', bg: 'bg-gray-900/15' }
        };
        return categoryStyles[category] || categoryStyles.default;
    };

    const handleCopy = async (ideaId, prompt, e) => {
        e.stopPropagation();
        try {
            // Try modern clipboard API first (works in HTTPS)
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(prompt);
            } else {
                // Fallback for HTTP environments
                fallbackCopyTextToClipboard(prompt);
            }

            // Set copied state for this idea
            setCopiedStates(prev => ({ ...prev, [ideaId]: true }));

            // Reset copied state after 2 seconds
            setTimeout(() => {
                setCopiedStates(prev => ({ ...prev, [ideaId]: false }));
            }, 2000);
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

    const handleSave = async (ideaId, idea, e) => {
        e.stopPropagation();

        try {
            // Toggle the saved state
            const newSavedState = !savedStates[ideaId];
            setSavedStates(prev => ({ ...prev, [ideaId]: newSavedState }));

            // Track the interaction in the database
            if (ideaId) {
                let result;
                if (newSavedState) {
                    // Saving the idea
                    result = await trackUserInteraction(
                        supabase,
                        user,
                        ideaId,
                        'like',
                        {
                            title: idea.title,
                            action: 'liked',
                            timestamp: new Date().toISOString()
                        }
                    );
                } else {
                    // Removing the saved idea
                    result = await removeSavedIdea(supabase, user, ideaId);
                }

                if (!result.success) {
                    // If the operation failed, revert the state
                    setSavedStates(prev => ({ ...prev, [ideaId]: !newSavedState }));
                    console.error('Error saving/unsaving idea:', result.error);
                }

                // Refresh the leaderboard to update save counts
                if (result.success) {
                    refreshLeaderboard();
                }
            }
        } catch (error) {
            // If there was an error, revert the state
            setSavedStates(prev => ({ ...prev, [ideaId]: !savedStates[ideaId] }));
            console.error('Error saving/unsaving idea:', error);
        }
    };

    const refreshLeaderboard = async () => {
        // Fetch all ideas from all dates to rank by save count
        const result = await getAllIdeas(0, 100); // Get first 100 ideas to rank

        if (result.success) {
            // Get save counts for each idea
            const ideasWithSaveCounts = await Promise.all(
                result.ideas.map(async (idea) => {
                    const saveCount = await getIdeaSaveCount(idea.id);
                    return { ...idea, saveCount };
                })
            );

            // Sort ideas by save count (descending)
            const sortedIdeas = ideasWithSaveCounts.sort((a, b) => {
                return (b.saveCount || 0) - (a.saveCount || 0);
            });

            setIdeas(sortedIdeas.slice(0, 10));

            // Update saved states for the refreshed ideas
            const updatedSavedStates = {};
            for (const idea of sortedIdeas.slice(0, 10)) {
                if (idea.id) {
                    try {
                        const savedResult = await isIdeaSaved(supabase, user, idea.id);
                        if (savedResult.success) {
                            updatedSavedStates[idea.id] = savedResult.isSaved;
                        }
                    } catch (error) {
                        console.error('Error checking if idea is saved:', error);
                    }
                }
            }
            setSavedStates(updatedSavedStates);
        }
    };

    const getRankIcon = (index) => {
        if (index === 0) return <Trophy className="w-4 h-4 text-yellow-500" />;
        return <Star className="w-3 h-3 text-gray-400" />;
    };

    // Toggle section expansion for a specific idea
    const toggleSection = (ideaId, section) => {
        const key = `${ideaId}-${section}`;
        setExpandedSections(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <PropagateLoader color="#4f46e5" />
            </div>
        );
    }

    // Check if user has access to leaderboard (pro and enterprise tiers only)
    const hasLeaderboardAccess = tier === 'pro' || tier === 'enterprise';
    if (!hasLeaderboardAccess) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-6">
                    <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Leaderboard Access Required</h3>
                    <p className="text-gray-400 mb-4">
                        The leaderboard is available for Pro and Enterprise tier users only.
                        Upgrade your plan to access trending ideas and community favorites.
                    </p>
                    <button
                        onClick={() => window.location.href = '/pricing'}
                        className="px-6 py-2 bg-gradient-to-r from-[#03438c6a] to-[#17ffc5ba] text-white font-semibold rounded-lg hover:from-[#023a7a] hover:to-[#16e5b3] transition-all duration-200"
                    >
                        Upgrade Now
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full max-h-full flex flex-col">


            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {ideas.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {ideas.map((idea, index) => (
                            <div
                                key={idea.id}
                                className={`
                                    relative rounded-xl shadow-lg cursor-pointer transition-all duration-300 transform
                                    hover:scale-105 hover:shadow-xl
                                    border-t-4 ${getCategoryClasses(idea.category).border} ${getCategoryClasses(idea.category).bg}
                                    flex flex-col overflow-hidden
                                `}
                            >
                                {/* Top bar with leaderboard info and action buttons */}
                                <div className="absolute top-3 left-4 right-4 flex justify-between items-center z-10">
                                    {/* Left side: Leaderboard place, icon, and save count */}
                                    <div className="flex items-center space-x-2">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-900">
                                            <span className="text-sm font-bold text-white">#{index + 1}</span>
                                        </div>
                                        <div className="flex-shrink-0">
                                            {getRankIcon(index)}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            ({idea.saveCount || 0} saves)
                                        </div>
                                    </div>

                                    {/* Right side: Save and copy buttons */}
                                    <div className="flex items-center space-x-1 p-2 bg-gray-900 rounded-full shadow">
                                        <button
                                            onClick={(e) => handleCopy(idea.id, idea.prompt, e)}
                                            className="flex items-center justify-center p-2 rounded-full hover:bg-gray-700 transition-colors flex-shrink-0"
                                            aria-label="Copy idea"
                                        >
                                            {copiedStates[idea.id] ? (
                                                <Check size={16} className="text-emerald-50" />
                                            ) : (
                                                <Copy size={16} className="text-gray-400" />
                                            )}
                                        </button>
                                        <button
                                            onClick={(e) => handleSave(idea.id, idea, e)}
                                            className="flex items-center justify-center p-2 rounded-full hover:bg-gray-700 transition-colors flex-shrink-0"
                                            aria-label="Save idea"
                                        >
                                            <Star size={16} className={savedStates[idea.id] ? "text-yellow-400 fill-current" : "text-gray-400"} />
                                        </button>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-4 pt-16 flex-col flex-grow">
                                    <h3 className="font-extrabold text-white text-xl leading-tight mb-3 tracking-tight">
                                        {idea.title}
                                    </h3>

                                    <p className="text-gray-300 text-base flex-grow mb-4 font-light leading-relaxed tracking-wide opacity-90 line-clamp-3">
                                        {idea.description}
                                    </p>

                                    {/* Spacer to push research section to bottom */}
                                    <div className="flex-grow"></div>

                                    {/* Collapsible detailed research data */}
                                    <div className="space-y-2 text-sm text-gray-300 mb-4">
                                        {idea.marketOpportunity && (
                                            <div className={`border ${getCategoryClasses(idea.category).border} rounded-lg overflow-hidden`}>
                                                <button
                                                    className="flex items-center w-full p-3 hover:bg-gray-750 transition-colors text-left"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleSection(idea.id, 'marketOpportunity');
                                                    }}
                                                >
                                                    <div className="flex items-center flex-grow">
                                                        <Target size={18} className="text-blue-400 mr-2 flex-shrink-0" />
                                                        <h4 className="font-bold text-white text-base">Market Opportunity</h4>
                                                    </div>
                                                    {expandedSections[`${idea.id}-marketOpportunity`] ?
                                                        <ChevronDown size={18} className="text-gray-400 flex-shrink-0 transition-transform duration-300" /> :
                                                        <ChevronRight size={18} className="text-gray-400 flex-shrink-0 transition-transform duration-300" />
                                                    }
                                                </button>
                                                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedSections[`${idea.id}-marketOpportunity`] ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                                    }`}>
                                                    <div className="p-3 bg-gray-850">
                                                        <p className="opacity-90 text-sm">{idea.marketOpportunity}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {idea.targetAudience && (
                                            <div className={`border ${getCategoryClasses(idea.category).border} rounded-lg overflow-hidden`}>
                                                <button
                                                    className="flex items-center w-full p-3 hover:bg-gray-750 transition-colors text-left"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleSection(idea.id, 'targetAudience');
                                                    }}
                                                >
                                                    <div className="flex items-center flex-grow">
                                                        <Users size={18} className="text-green-400 mr-2 flex-shrink-0" />
                                                        <h4 className="font-bold text-white text-base">Target Audience</h4>
                                                    </div>
                                                    {expandedSections[`${idea.id}-targetAudience`] ?
                                                        <ChevronDown size={18} className="text-gray-400 flex-shrink-0 transition-transform duration-300" /> :
                                                        <ChevronRight size={18} className="text-gray-400 flex-shrink-0 transition-transform duration-300" />
                                                    }
                                                </button>
                                                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedSections[`${idea.id}-targetAudience`] ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                                    }`}>
                                                    <div className="p-3 bg-gray-850">
                                                        <p className="opacity-90 text-sm">{idea.targetAudience}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {idea.revenueModel && (
                                            <div className={`border ${getCategoryClasses(idea.category).border} rounded-lg overflow-hidden`}>
                                                <button
                                                    className="flex items-center w-full p-3 hover:bg-gray-750 transition-colors text-left"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleSection(idea.id, 'revenueModel');
                                                    }}
                                                >
                                                    <div className="flex items-center flex-grow">
                                                        <FileText size={18} className="text-yellow-400 mr-2 flex-shrink-0" />
                                                        <h4 className="font-bold text-white text-base">Revenue Model</h4>
                                                    </div>
                                                    {expandedSections[`${idea.id}-revenueModel`] ?
                                                        <ChevronDown size={18} className="text-gray-400 flex-shrink-0 transition-transform duration-300" /> :
                                                        <ChevronRight size={18} className="text-gray-400 flex-shrink-0 transition-transform duration-300" />
                                                    }
                                                </button>
                                                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedSections[`${idea.id}-revenueModel`] ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                                    }`}>
                                                    <div className="p-3 bg-gray-850">
                                                        <p className="opacity-90 text-sm">{idea.revenueModel}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {idea.keyChallenges && (
                                            <div className={`border ${getCategoryClasses(idea.category).border} rounded-lg overflow-hidden`}>
                                                <button
                                                    className="flex items-center w-full p-3 hover:bg-gray-750 transition-colors text-left"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleSection(idea.id, 'keyChallenges');
                                                    }}
                                                >
                                                    <div className="flex items-center flex-grow">
                                                        <AlertTriangle size={18} className="text-red-400 mr-2 flex-shrink-0" />
                                                        <h4 className="font-bold text-white text-base">Key Challenges</h4>
                                                    </div>
                                                    {expandedSections[`${idea.id}-keyChallenges`] ?
                                                        <ChevronDown size={18} className="text-gray-400 flex-shrink-0 transition-transform duration-300" /> :
                                                        <ChevronRight size={18} className="text-gray-400 flex-shrink-0 transition-transform duration-300" />
                                                    }
                                                </button>
                                                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedSections[`${idea.id}-keyChallenges`] ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                                    }`}>
                                                    <div className="p-3 bg-gray-850">
                                                        <p className="opacity-90 text-sm">{idea.keyChallenges}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-center mt-auto">
                                        <span
                                            className="inline-flex items-center bg-gray-900 text-gray-300 text-sm px-3 py-1 rounded-full"
                                        >
                                            {idea.category}
                                        </span>
                                        {idea.date && (
                                            <span className="text-xs text-gray-400">
                                                {new Date(idea.date).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Copy confirmation */}
                                {copiedStates[idea.id] && (
                                    <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center rounded-xl">
                                        <span className="text-white font-medium">Copied to clipboard!</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <h3 className="text-lg font-medium text-white mb-2">No ideas found</h3>
                            <p className="text-gray-400 text-sm">
                                Leaderboard will populate as ideas get saved and rated
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
