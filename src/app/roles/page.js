"use client";

import React from 'react';
import { subscriptionPlans } from '@/data/plans';
import Header from '@/components/Header';
import {
    Sparkles, Star, Rocket, Building,
    Search, DollarSign, Zap, Target, Users, Heart, TrendingUp, FileText,
    Wallet, Code, Home, Activity, Book, Wrench, ShoppingCart, Computer,
    Check
} from 'lucide-react';

const tierIcons = {
    free: Sparkles,
    basic: Star,
    pro: Rocket,
    enterprise: Building
};

// Define Backer-specific features based on the Founder tiers
const backerFeatures = {
    free: {
        name: 'Auditor',
        features: [
            'Browse Launchpad Gallery',
            'View Idea Summaries',
            'Soft-Staking: Enabled (Up to $100 total cap)',
            'Save ideas to personal list'
        ]
    },
    basic: {
        name: 'Analyst',
        features: [
            'All Auditor features',
            'Soft-Staking: Enabled (Up to $1,000 total cap)',
            'Full Insight Engine (Sentiment, Emotion, etc.)',
            'Access to Backer-only filters'
        ]
    },
    pro: {
        name: 'Patron',
        features: [
            'All Analyst features',
            'Soft-Staking: Unlimited Access',
            'Earn Idea Share Rewards',
            'Priority access to new launches'
        ]
    },
    enterprise: {
        name: 'Venture Partner',
        features: [
            'All Patron features for your team',
            'Portfolio management dashboard',
            'Custom data filters & API Access',
            'Priority Support'
        ]
    }
};

const RoleCard = ({ title, description, tiers, isFounder }) => (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-8 border border-gray-700 shadow-xl flex flex-col h-full">
        <h2 className={`text-3xl font-extrabold mb-4 border-b border-indigo-500/50 ${isFounder ? 'text-blue-200' : 'text-teal-200'}`}>
            {title}
        </h2>
        <p className="text-gray-300 mb-8 leading-relaxed">{description}</p>

        <div className="space-y-6">
            {Object.entries(tiers).map(([tier, plan]) => {
                const Icon = tierIcons[tier];
                const isCurrentTier = tier === 'pro'; // Mocking current tier for display purposes

                const tierName = isFounder ? plan.name : backerFeatures[tier].name;
                const features = isFounder ? plan.features : backerFeatures[tier].features;

                return (
                    <div key={tier} className={`
                        p-6 rounded-xl border transition-all duration-300
                        ${isCurrentTier ? `${isFounder ? 'border-blue-400 shadow-lg shadow-blue-400/10' : 'border-[#17ffc5] shadow-lg shadow-[#17ffc5]/10'}` : 'border-gray-700'}
                        bg-gradient-to-br from-gray-800 to-gray-900
                    `}
                    >
                        <div className="flex items-center mb-3">
                            <Icon className={`w-7 h-7 mr-3 text-white`} />
                            <h4 className="text-xl font-bold text-white">{tierName}</h4>
                        </div>
                        <ul className="space-y-2 text-sm">
                            {features.map((feature, index) => (
                                <li key={index} className="flex items-center text-gray-300">
                                    <Check className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                                    {feature}
                                </li>
                            ))}
                        </ul>
                        <div className="mt-4 text-right">
                            <a
                                href="/pricing"
                                className={`text-sm font-semibold transition-colors hover:opacity-80 ${isFounder ? 'text-blue-400' : 'text-[#17ffc5]'}`}
                            >
                                View Full Tier Details & Pricing →
                            </a>
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
);

export default function RolesPage() {
    return (
        <main className="relative w-full h-screen flex flex-col">
            <Header
                onViewChange={() => { }}
                activeView="roles"
                searchTerm=""
                setSearchTerm={() => { }}
                selectedCategory=""
                setSelectedCategory={() => { }}
                categories={[]}
                limits={null}
                onUpgradeClick={() => { }}
                isFixed={false}
            />
            <div className="flex-grow overflow-y-auto bg-gray-900 -z-10">
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <header className="text-center mb-16 mt-8">
                        <h1 className="text-5xl font-extrabold text-white mb-4">
                            Choose Your Role: Founder or Backer
                        </h1>
                        <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                            Ideaspire is built for two types of innovators.
                            Select the path that aligns with your goals.
                        </p>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <RoleCard
                            title="The Founder"
                            description="Your path to launching a venture. Founders use the Insight Engine to discover high-potential ideas, mint them as NFTs to establish ownership, and list them on the Launchpad for funding."
                            tiers={subscriptionPlans}
                            isFounder={true}
                        />
                        <RoleCard
                            title="The Backer"
                            description="Your path to supporting innovation. All users start with the ability to Soft-Stake (pledge capital) to projects on the Launchpad, use the Insight Engine to validate, and earn Idea Share rewards."
                            tiers={subscriptionPlans}
                            isFounder={false}
                        />
                    </div>

                    <div className="text-center mt-16">
                        <h2 className="text-3xl font-bold text-white mb-4">Ready to Start?</h2>
                        <p className="text-lg text-gray-400 mb-6">
                            All users start with the free Starter tier, granting Backer privileges.
                            Upgrade to unlock Founder tools.
                        </p>
                        <a
                            href="/pricing"
                            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-[#03438c6a] to-[#17ffc5ba] text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl hover:from-[#023a7a] hover:to-[#16e5b3]"
                        >
                            View Pricing & Upgrade
                        </a>
                    </div>
                </div>
            </div>
        </main>
    );
}
