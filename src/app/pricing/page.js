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
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Failed to fetch user limits');
                    }
                    const data = await response.json();
                    setLimits(data);
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

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to upgrade subscription');
            }

            const data = await response.json();
            if (data.success) {
                await fetchTier();
                alert(`Successfully upgraded to ${subscriptionPlans[tier].name}!`);
                router.push('/profile');
            } else {
                throw new Error('Failed to upgrade subscription');
            }
        } catch (error) {
            console.error('Error upgrading:', error);
            alert(error.message || 'Failed to upgrade subscription');
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
        <main className="relative w-full h-screen flex flex-col">
            <Header
                activeView="pricing"
                onViewChange={() => { }}
                categories={[]}
                limits={limits}
                searchTerm=""
                setSearchTerm={() => { }}
                selectedCategory="All"
                setSelectedCategory={() => { }}
                isFixed={false}
            />
            <div className="flex-grow overflow-y-auto bg-gray-900 -z-10">
                <div className="max-w-7xl mx-auto px-4 py-8 text-white">
                    {/* Hero Section */}
                    <div className="text-center mb-16 mt-8">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
                            Choose Your Plan
                        </h1>
                        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                            Unlock hundreds of ideas, start or accelerate your ventures
                        </p>
                    </div>

                    {/* Tiers Grid */}
                    <div className="pb-16">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {Object.entries(subscriptionPlans).map(([tier, plan]) => {
                                const Icon = tierIcons[tier];
                                const isPopular = tier === 'pro';
                                const isCurrent = currentTier === tier;
                                return (
                                    <div
                                        key={tier}
                                        className={`relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border transition-all duration-300 hover:scale-105 flex flex-col h-full ${isPopular ? 'border-[#17ffc5] shadow-lg shadow-[#17ffc5]/10' : 'border-gray-700'
                                            } ${isCurrent ? 'shadow-lg shadow-[#03438c]/10' : ''}`}
                                    >
                                        {isPopular && !isCurrent && (
                                            <div className="absolute -top-3 -right-9 transform -translate-x-1/2 bg-[#17ffc5] text-white px-3 py-1 rounded-full text-sm font-semibold">
                                                Most Popular
                                            </div>
                                        )}
                                        {isCurrent && (
                                            <div className="absolute -top-3 right-4 bg-[#03438c] text-white px-3 py-1 rounded-full text-sm font-semibold">
                                                Your Plan
                                            </div>
                                        )}

                                        <div className="flex-grow">
                                            <div className="text-center mb-4">
                                                <Icon className="w-12 h-12 mx-auto mb-2 text-white" />
                                                <h2 className="text-2xl font-bold text-white">{plan.name}</h2>
                                            </div>

                                            {/* Price Section */}
                                            <div className="mb-6">
                                                <div className="flex justify-center space-x-1 mb-4">
                                                    {Object.keys(plan.pricing).filter(p => plan.pricing[p] !== null).map(period => (
                                                        <button
                                                            key={period}
                                                            onClick={() => setSelectedPeriods(prev => ({ ...prev, [tier]: period }))}
                                                            disabled={tier === 'free' || tier === 'enterprise'}
                                                            className={`px-3 py-1 text-sm rounded transition-colors ${tier === 'free' || tier === 'enterprise'
                                                                ? 'bg-transparent text-transparent cursor-default'
                                                                : selectedPeriods[tier] === period
                                                                    ? 'bg-gradient-to-r from-[#03438c6a] to-[#17ffc5ba] text-white'
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
                                                    ) : plan.pricing[selectedPeriods[tier]] === null ? (
                                                        <>
                                                            <span className="text-4xl font-bold text-white">${plan.pricing.monthly}</span>
                                                            <span className="text-gray-400 text-lg">/month</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="text-4xl font-bold text-white">${plan.pricing[selectedPeriods[tier]]}</span>
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
                                            onClick={() => {
                                                if (tier === 'free') {
                                                    router.push('/login');
                                                } else if (tier === 'enterprise') {
                                                    window.location.href = 'mailto:support@ideaspire.com';
                                                } else {
                                                    handleUpgrade(tier);
                                                }
                                            }}
                                            disabled={currentTier === tier || upgrading === tier}
                                            className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${tier === 'free' && currentTier !== 'free'
                                                ? 'bg-gradient-to-r from-[#03438c6a] to-[#17ffc5ba] text-white hover:scale-105'
                                                : currentTier === tier
                                                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                                    : 'bg-gradient-to-r from-[#03438c6a] to-[#17ffc5ba] text-white hover:scale-105'
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
                                <details key={index} className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-700">
                                    <summary className="cursor-pointer p-6 focus:outline-none focus:ring-2 focus:ring-[#17ffc5] rounded-lg font-semibold">
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
            </div>
        </main>
    );
}
