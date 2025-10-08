"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/components/SupabaseProvider';
import Header from '@/components/Header';
import { subscriptionPlans } from '@/data/plans';
import { CheckCircle, Sparkles, Star, Rocket, Building } from 'lucide-react';

const tierIcons = {
    free: Sparkles,
    basic: Star,
    pro: Rocket,
    enterprise: Building
};

export default function PricingPage() {
    const { user, loading: authLoading, tier: currentTier, fetchTier } = useSupabase();
    const router = useRouter();
    const [limits, setLimits] = useState(null);
    const [selectedPeriods, setSelectedPeriods] = useState({
        free: 'monthly',
        basic: 'monthly',
        pro: 'monthly',
        enterprise: 'monthly'
    });
    const [upgrading, setUpgrading] = useState(null);
    const [faqOpen, setFaqOpen] = useState({});

    // Fetch user limits when user is authenticated
    useEffect(() => {
        const fetchUserLimits = async () => {
            if (user) {
                try {
                    const response = await fetch('/api/user/limits');
                    const data = await response.json();
                    if (response.ok) {
                        setLimits(data);
                    }
                } catch (error) {
                    console.error('Error fetching user limits:', error);
                }
            }
        };

        fetchUserLimits();
    }, [user]);

    const handleUpgrade = async (tier) => {
        if (tier === currentTier) return;

        setUpgrading(tier);
        const period = selectedPeriods[tier];
        try {
            const response = await fetch('/api/subscription/mock-upgrade', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ tier, period }),
            });

            const data = await response.json();
            if (response.ok) {
                await fetchTier();
                alert(`Successfully upgraded to ${subscriptionPlans[tier].name}!`);
                router.push('/profile');
            } else {
                alert('Failed to upgrade subscription');
            }
        } catch (error) {
            console.error('Error upgrading:', error);
            alert('Failed to upgrade subscription');
        } finally {
            setUpgrading(null);
        }
    };

    const toggleFaq = (index) => {
        setFaqOpen(prev => ({ ...prev, [index]: !prev[index] }));
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <Header
                activeView="pricing"
                onViewChange={() => { }}
                categories={[]}
                limits={limits}
                searchTerm=""
                setSearchTerm={() => { }}
                selectedCategory="All"
                setSelectedCategory={() => { }}
            />
            {/* Hero Section */}
            <div className="text-center py-16 px-4">
                <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-pink-400 bg-clip-text text-transparent">
                    Choose Your Plan
                </h1>
                <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
                    Unlock hundreds of ideas, start or accelerate your ventures
                </p>
            </div>

            {/* Tiers Grid */}
            <div className="max-w-7xl mx-auto px-4 pb-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Object.entries(subscriptionPlans).map(([tier, plan]) => {
                        const Icon = tierIcons[tier];
                        const isPopular = tier === 'pro';
                        const isCurrent = currentTier === tier;
                        return (
                            <div
                                key={tier}
                                className={`relative bg-gray-800 rounded-xl p-6 border-2 transition-all duration-300 hover:scale-105 flex flex-col h-full ${isPopular ? 'border-pink-500 shadow-lg shadow-pink-500/20' : 'border-gray-700'
                                    } ${isCurrent ? 'ring-2 ring-blue-500' : ''}`}
                            >
                                {isPopular && (
                                    <div className="absolute -top-3 -right-9 transform -translate-x-1/2 bg-pink-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                        Most Popular
                                    </div>
                                )}
                                {isCurrent && (
                                    <div className="absolute -top-3 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                        Your Plan
                                    </div>
                                )}

                                <div className="flex-grow">
                                    <div className="text-center mb-4">
                                        <Icon className="w-12 h-12 mx-auto mb-2 text-blue-400" />
                                        <h2 className="text-2xl font-bold">{plan.name}</h2>
                                    </div>

                                    {/* Price Section */}
                                    <div className="mb-6">
                                        <div className="flex justify-center space-x-1 mb-4">
                                            {Object.keys(plan.pricing).filter(p => plan.pricing[p] !== null).map(period => (
                                                <button
                                                    key={period}
                                                    onClick={() => setSelectedPeriods(prev => ({ ...prev, [tier]: period }))}
                                                    disabled={tier === 'free'}
                                                    className={`px-3 py-1 text-sm rounded transition-colors ${tier === 'free'
                                                        ? 'bg-transparent text-transparent cursor-default'
                                                        : selectedPeriods[tier] === period
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                                        }`}
                                                >
                                                    {period.charAt(0).toUpperCase() + period.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="text-center">
                                            {plan.pricing[selectedPeriods[tier]] === 0 ? (
                                                <span className="text-4xl font-bold text-green-400">Free</span>
                                            ) : (
                                                <>
                                                    <span className="text-4xl font-bold text-blue-400">${plan.pricing[selectedPeriods[tier]]}</span>
                                                    <span className="text-gray-400 text-lg">/{selectedPeriods[tier]}</span>
                                                    {tier === 'basic' && selectedPeriods[tier] === 'weekly' && <span className="block text-sm text-green-400">(15% off)</span>}
                                                    {tier === 'basic' && selectedPeriods[tier] === 'monthly' && <span className="block text-sm text-green-400">(50% off)</span>}
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Features */}
                                    <ul className="space-y-3 mb-6">
                                        {plan.features.map((feature, index) => (
                                            <li key={index} className="flex items-start">
                                                <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                                                <span className="text-gray-300 leading-relaxed">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* CTA Button */}
                                <button
                                    onClick={() => tier === 'free' ? router.push('/login') : tier === 'enterprise' ? window.location.href = 'mailto:support@ideaspire.com' : handleUpgrade(tier)}
                                    disabled={currentTier === tier || upgrading === tier}
                                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${tier === 'free' && currentTier !== 'free'
                                        ? 'bg-green-600 text-white hover:bg-green-700 hover:scale-105'
                                        : currentTier === tier
                                            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                            : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105'
                                        }`}
                                >
                                    {upgrading === tier
                                        ? 'Upgrading...'
                                        : tier === 'free'
                                            ? (currentTier === 'free' ? 'Current Plan' : 'Free Plan')
                                            : tier === 'enterprise'
                                                ? 'Contact Us'
                                                : currentTier === tier
                                                    ? 'Current Plan'
                                                    : 'Upgrade'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* FAQ Section */}
            <div className="max-w-4xl mx-auto px-4 pb-16">
                <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
                <div className="space-y-4">
                    {[
                        {
                            question: "What's the intro boost?",
                            answer: "First 7 days: extra spins/reveals to get started! Basic tier gets 10 spins + 5 free reveals/day initially, then 10 spins + 3 free reveals/day ongoing."
                        },
                        {
                            question: "How does pay-per-reveal work?",
                            answer: "In Basic tier, extras cost $0.99/reveal or bundles (5 for $3.99). Pro and Enterprise have unlimited reveals."
                        },
                        {
                            question: "Can I change my subscription anytime?",
                            answer: "Yes, you can upgrade or downgrade your subscription at any time. Changes take effect immediately."
                        },
                        {
                            question: "What are NFT minting fees for?",
                            answer: "The $2.99 fee covers blockchain costs and provides a small platform fee. NFTs prove idea ownership and enable fundraising."
                        },
                        {
                            question: "Is Enterprise suitable for teams?",
                            answer: "Yes, Enterprise includes custom Reddit filters, dev quotes, priority support for larger organizations."
                        }
                    ].map((faq, index) => (
                        <details key={index} className="bg-gray-800 rounded-lg">
                            <summary className="cursor-pointer p-6 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg font-semibold">
                                {faq.question}
                            </summary>
                            <div className="px-6 pb-6">
                                <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                            </div>
                        </details>
                    ))}
                </div>
            </div>


        </div>
    );
}