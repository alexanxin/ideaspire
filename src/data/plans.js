export const subscriptionPlans = {
    free: {
        name: 'Starter',
        description: 'Discover new ideas and see what others are building.',
        pricing: {
            daily: 0,
            weekly: 0,
            monthly: 0
        },
        features: [
            '5 spins + 1 free reveal/day',
            'View Idea Summaries',
            'Save ideas to your personal list',
            'Minting Disabled (Upgrade to become a Founder)'
        ]
    },
    basic: {
        name: 'Basic',
        description: 'For the serious ideator. Get deeper insights and the ability to mint.',
        pricing: {
            daily: 1.99,
            weekly: 4.99,
            monthly: 9.99
        },
        features: [
            '25 spins + 10 free reveals/day',
            'View Idea Summary & "Pain Score"',
            'Save unlimited ideas',
            'Minting Enabled: $19.99/idea',
            'Unlocks "Spark" Founder\'s Toolkit upon minting'
        ]
    },
    pro: {
        name: 'Pro (Innovation Launchpad)',
        description: 'For the serious founder and savvy backer. Launch your idea and invest in others.',
        pricing: {
            daily: 4.99,
            weekly: 14.99,
            monthly: 29.99
        },
        features: [
            'Unlimited spins & reveals',
            'Full "Idea Validation Suite" (Pain Score, Market Viability, etc.)',
            'Includes 1 FREE "Founder\'s Mint"/month',
            '50% off additional mints ($9.99 each)',
            'Submit your minted ideas for a "Community Funding Round"',
            'Unlocks "Accelerator" Founder\'s Toolkit upon minting'
        ]
    },
    enterprise: {
        name: 'Enterprise (The Venture Studio)',
        description: 'For teams, incubators, and VCs. Curate, fund, and manage a portfolio of ventures.',
        pricing: {
            daily: null,
            weekly: null,
            monthly: 99.99
        },
        features: [
            'All Pro features for your team',
            'Includes 5 FREE "Founder\'s Mints"/month in team pool',
            '90% off all additional mints',
            'Enhanced Fundraising Tools (Private Rounds, Custom Terms)',
            'Portfolio management dashboard',
            'Custom data filters & API Access',
            'Priority Support'
        ]
    }
};
