"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, CheckCircle, Sparkles, Star, Rocket, Building } from 'lucide-react';
import { subscriptionPlans } from '@/data/plans';
import { useSupabase } from '@/components/SupabaseProvider';

const tierIcons = {
    free: Sparkles,
    basic: Star,
    pro: Rocket,
    enterprise: Building
};

export default function UpgradeModal({ isOpen, onClose, onUpgradeSuccess }) {
    const { user, tier: currentTier, fetchTier } = useSupabase();
    const router = useRouter();
    const [upgrading, setUpgrading] = useState(null);

    const handleUpgrade = async (tier) => {
        if (tier === currentTier) return;

        setUpgrading(tier);
        try {
            const response = await fetch('/api/subscription/mock-upgrade', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ tier, period: 'monthly' }),
            });

            const data = await response.json();
            if (response.ok) {
                await fetchTier();
                alert(`Successfully upgraded to ${subscriptionPlans[tier].name}!`);
                onClose();
                if (onUpgradeSuccess) {
                    onUpgradeSuccess();
                }
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

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => {
                // Only close if clicking directly on the backdrop, not on child elements
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-700">
                {/* Header */}
                {/* <div className="flex justify-between items-center p-6 border-b border-gray-700">
                    <h2 className="text-2xl font-bold text-white">Upgrade Your Plan</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div> */}

                {/* Hero Section */}
                <div className="text-center py-8 px-6">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        Upgrade Your Plan
                    </h1>
                    <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
                        Unlock hundreds of ideas, start or accelerate your ventures
                    </p>
                </div>

                {/* Pricing Plans */}
                <div className="px-6 pb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {Object.entries(subscriptionPlans).map(([tier, plan]) => {
                            const Icon = tierIcons[tier];
                            const isPopular = tier === 'pro';
                            return (
                                <div
                                    key={tier}
                                    className={`relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border transition-all duration-300 hover:scale-105 flex flex-col h-full ${isPopular ? 'border-indigo-500 shadow-lg shadow-indigo-50/20' : 'border-gray-700'
                                        }`}
                                >
                                    {isPopular && (
                                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                            Most Popular
                                        </div>
                                    )}

                                    <div className="flex-grow flex flex-col">
                                        <div className="text-center mb-4">
                                            <Icon className="w-10 h-10 mx-auto mb-3 text-indigo-400" />
                                            <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                                            <p className="text-gray-400 text-sm mt-2">{plan.description}</p>
                                        </div>

                                        {/* Price Section */}
                                        <div className="mb-6">
                                            <div className="text-center">
                                                {plan.pricing.monthly === 0 ? (
                                                    <span className="text-3xl font-bold text-green-400">Free</span>
                                                ) : plan.pricing.monthly === null ? (
                                                    <span className="text-3xl font-bold text-indigo-400">Custom</span>
                                                ) : (
                                                    <>
                                                        <span className="text-3xl font-bold text-indigo-400">${plan.pricing.monthly}</span>
                                                        <span className="text-gray-400 text-sm">/month</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Features */}
                                        <ul className="space-y-3 mb-6 flex-grow">
                                            {plan.features.map((feature, index) => (
                                                <li key={index} className="flex items-start">
                                                    <CheckCircle className="w-5 h-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                                                    <span className="text-gray-30 leading-relaxed text-sm">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* CTA Button */}
                                    <button
                                        onClick={() => {
                                            if (tier === 'free') return;
                                            if (tier === 'enterprise') {
                                                window.location.href = 'mailto:support@ideaspire.com';
                                                return;
                                            }
                                            handleUpgrade(tier);
                                        }}
                                        disabled={currentTier === tier || upgrading === tier}
                                        className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${tier === 'free' && currentTier !== 'free'
                                            ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700'
                                            : currentTier === tier
                                                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                                : tier === 'enterprise'
                                                    ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:from-gray-700 hover:to-gray-800'
                                                    : 'bg-gradient-to-r from-[#03438c6a] to-[#17ffc5ba] text-white hover:from-[#023a7a] hover:to-[#16e5b3] shadow-lg hover:shadow-xl'
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
                                                        : `Upgrade to ${plan.name}`}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* FAQ Section - Simplified */}
                <div className="px-6 pb-8 mb-10">
                    <h3 className="text-xl font-bold text-center mb-6 text-white">Frequently Asked Questions</h3>
                    <div className="space-y-4">
                        <details className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700">
                            <summary className="cursor-pointer p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg font-semibold text-white">
                                How does pay-per-reveal work?
                            </summary>
                            <div className="px-4 pb-4">
                                <p className="text-gray-30 leading-relaxed">
                                    In Basic tier, extras cost $0.99/reveal or bundles (5 for $3.99). Pro and Enterprise have unlimited reveals.
                                </p>
                            </div>
                        </details>
                        <details className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700">
                            <summary className="cursor-pointer p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg font-semibold text-white">
                                Can I change my subscription anytime?
                            </summary>
                            <div className="px-4 pb-4">
                                <p className="text-gray-300 leading-relaxed">
                                    Yes, you can upgrade or downgrade your subscription at any time. Changes take effect immediately.
                                </p>
                            </div>
                        </details>
                    </div>
                </div>
            </div>
        </div>
    );
}