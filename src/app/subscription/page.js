"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/components/SupabaseProvider';
import { subscriptionPlans } from '@/data/plans';

export default function SubscriptionPage() {
    const { user, loading: authLoading, tier: currentTier, fetchTier } = useSupabase();
    const router = useRouter();
    const [upgrading, setUpgrading] = useState(null);
    const [selectedPeriods, setSelectedPeriods] = useState({
        free: 'monthly',
        basic: 'monthly',
        pro: 'monthly',
        enterprise: 'monthly'
    });

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/login');
            return;
        }
    }, [user, authLoading, router]);

    const handleUpgrade = async (tier) => {
        if (tier === currentTier) return;

        setUpgrading(tier);
        try {
            const response = await fetch('/api/subscription/mock-upgrade', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ tier }),
            });

            const data = await response.json();
            if (response.ok) {
                await fetchTier(); // Refresh tier from context
                alert(`Successfully upgraded to ${subscriptionPlans[tier].name}!`);
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

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-4xl font-bold text-center mb-8">Choose Your Plan</h1>
                <p className="text-center text-gray-300 mb-12">
                    Turn Reddit pain points into your next startup for under $10. Daily fresh ideas from trending discussions.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Object.entries(subscriptionPlans).map(([tier, plan]) => (
                        <div
                            key={tier}
                            className={`bg-gray-800 rounded-lg p-6 border-2 ${currentTier === tier ? 'border-blue-500' : 'border-gray-700'
                                }`}
                        >
                            <div className="text-center mb-4">
                                <h2 className="text-2xl font-bold">{plan.name}</h2>
                                {Object.keys(plan.pricing).length > 1 ? (
                                    <div className="mt-2">
                                        <div className="flex justify-center space-x-1 mb-2">
                                            {Object.keys(plan.pricing).map(period => (
                                                <button
                                                    key={period}
                                                    onClick={() => setSelectedPeriods(prev => ({ ...prev, [tier]: period }))}
                                                    className={`px-3 py-1 text-sm rounded ${selectedPeriods[tier] === period
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                                        }`}
                                                >
                                                    {period.charAt(0).toUpperCase() + period.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="text-3xl font-bold text-blue-400">
                                            ${plan.pricing[selectedPeriods[tier]]}
                                            <span className="text-lg text-gray-400">/{selectedPeriods[tier]}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-3xl font-bold text-blue-400 mt-2">
                                        ${plan.pricing.monthly}
                                        <span className="text-lg text-gray-400">/month</span>
                                    </div>
                                )}
                            </div>

                            <p className="text-gray-300 text-center mb-6">{plan.description}</p>

                            <ul className="space-y-2 mb-6">
                                {plan.features.map((feature, index) => (
                                    <li key={index} className="flex items-center">
                                        <span className="text-green-400 mr-2">✓</span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleUpgrade(tier)}
                                disabled={currentTier === tier || upgrading === tier}
                                className={`w-full py-2 px-4 rounded font-semibold ${currentTier === tier
                                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                    }`}
                            >
                                {upgrading === tier ? 'Upgrading...' : currentTier === tier ? 'Current Plan' : 'Upgrade'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}