import { NextResponse } from 'next/server';
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const categoryParam = searchParams.get('category');
        const randomParam = searchParams.get('random');

        // If Supabase is not configured, return sample mock ideas
        if (!isSupabaseConfigured()) {
            const sampleMockIdeas = [
                { id: 1, title: 'AI Recipe Generator', description: 'An app that creates personalized recipes based on available ingredients and dietary preferences using AI.', category: 'Tech' },
                { id: 2, title: 'Smart Home Automation', description: 'IoT platform that learns your habits and automates your home for energy efficiency and convenience.', category: 'Tech' },
                { id: 3, title: 'Virtual Co-Working Spaces', description: 'A platform connecting remote workers with virtual co-working communities and productivity tools.', category: 'Startup' },
                { id: 4, title: 'Sustainable Fashion Marketplace', description: 'Online platform connecting eco-conscious consumers with ethical fashion brands.', category: 'Startup' },
                { id: 5, title: 'Eco-Friendly Subscription Box', description: 'Monthly delivery of sustainable household products and zero-waste alternatives.', category: 'E-commerce' },
                { id: 6, title: 'Artisan Marketplace', description: 'Platform for local artisans to sell handmade goods directly to consumers worldwide.', category: 'E-commerce' },
                { id: 7, title: 'Pet Care Concierge', description: 'On-demand pet sitting, walking, and grooming services with real-time GPS tracking.', category: 'Service' },
                { id: 8, title: 'Home Organization Service', description: 'Professional organizers who help declutter and optimize living spaces for better productivity.', category: 'Service' },
                { id: 9, title: 'Code Review Automation', description: 'AI-powered tool that automatically reviews code for bugs, security issues, and best practices.', category: 'Vibe Coding' },
                { id: 10, title: 'Developer Portfolio Builder', description: 'Drag-and-drop platform for creating stunning developer portfolios with integrated project showcases.', category: 'Vibe Coding' },
                { id: 11, title: 'Freelance Gig Finder', description: 'Platform connecting skilled workers with quick freelance opportunities in their local area.', category: 'Quick Money' },
                { id: 12, title: 'Skill Monetization Platform', description: 'Turn your hobbies and skills into income through online classes and consultations.', category: 'Quick Money' },
                { id: 13, title: 'Community Skill Sharing', description: 'App that connects volunteers with community members needing help with basic skills and tasks.', category: 'Social Impact' },
                { id: 14, title: 'Urban Gardening Initiative', description: 'Platform helping cities transform empty lots into community gardens for food security.', category: 'Social Impact' },
                { id: 15, title: 'Remote Team Building Platform', description: 'Virtual team building activities and icebreakers designed specifically for distributed teams.', category: 'Remote Work' },
                { id: 16, title: 'Digital Nomad Hub', description: 'All-in-one platform for remote workers to find co-working spaces, housing, and local communities worldwide.', category: 'Remote Work' },
                { id: 17, title: 'Mental Health Tracker', description: 'Mobile app that monitors daily mood patterns and provides personalized wellness recommendations.', category: 'Health & Wellness' },
                { id: 18, title: 'Meditation Gamification', description: 'Turn meditation practice into an engaging game with rewards, streaks, and social challenges.', category: 'Health & Wellness' },
                { id: 19, title: 'Language Learning VR', description: 'Immersive virtual reality environment for learning new languages through real-life scenarios.', category: 'Education' },
                { id: 20, title: 'Peer Learning Network', description: 'Platform where students teach each other subjects they excel in, creating a collaborative learning ecosystem.', category: 'Education' },
                { id: 21, title: 'Blockchain Voting System', description: 'Secure and transparent voting platform using blockchain technology to ensure election integrity.', category: 'Tech' },
                { id: 22, title: 'AI-Powered Legal Assistant', description: 'Automated legal document review and contract analysis tool for small businesses.', category: 'Startup' },
                { id: 23, title: 'Local Food Delivery Network', description: 'Platform connecting local restaurants with customers through a community-based delivery system.', category: 'E-commerce' },
                { id: 24, title: 'Elderly Care Companion App', description: 'Virtual assistant app providing companionship and health monitoring for seniors.', category: 'Service' },
                { id: 25, title: 'Open Source Code Marketplace', description: 'Platform where developers can buy, sell, and trade open source code components.', category: 'Vibe Coding' },
                { id: 26, title: 'Micro-Investment Platform', description: 'App that allows users to invest spare change into diversified portfolios automatically.', category: 'Quick Money' },
                { id: 27, title: 'Community Solar Projects', description: 'Platform helping neighborhoods set up and manage shared solar energy installations.', category: 'Social Impact' },
                { id: 28, title: 'Virtual Reality Workspaces', description: 'Immersive VR environments for remote team collaboration and virtual meetings.', category: 'Remote Work' },
                { id: 29, title: 'Fitness Challenge Platform', description: 'Social fitness app that creates personalized challenges and tracks progress with friends.', category: 'Health & Wellness' },
                { id: 30, title: 'Skill-Based Learning Games', description: 'Educational games that teach practical skills through interactive gameplay.', category: 'Education' }
            ];

            let filteredIdeas = sampleMockIdeas;
            if (categoryParam) {
                filteredIdeas = sampleMockIdeas.filter(idea => idea.category === categoryParam);
            }

            if (randomParam === 'true') {
                if (filteredIdeas.length === 0) {
                    return NextResponse.json({ ideas: [] });
                }

                // Get count parameter to return multiple random ideas
                const countParam = searchParams.get('count');
                const count = countParam ? parseInt(countParam) : 1;

                // Use a more sophisticated randomization to reduce immediate duplicates
                // Use timestamp as a seed for more predictable randomness per request
                const timestampSeed = Date.now();
                const seededRandom = (seed) => {
                    const x = Math.sin(seed) * 10000;
                    return x - Math.floor(x);
                };

                // Create a shuffled copy using the seed
                const shuffled = [...filteredIdeas];
                for (let i = shuffled.length - 1; i > 0; i--) {
                    const j = Math.floor(seededRandom(timestampSeed + i) * (i + 1));
                    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                }

                // Return the requested number of ideas (up to available)
                const selectedIdeas = shuffled.slice(0, Math.min(count, shuffled.length));
                return NextResponse.json({ ideas: selectedIdeas });
            }

            return NextResponse.json({ ideas: filteredIdeas });
        }

        // Supabase is configured, use database
        let query = supabase
            .from('mock_ideas')
            .select('*');

        // Filter by category if provided
        if (categoryParam) {
            query = query.eq('category', categoryParam);
        }

        // Get random idea if requested
        if (randomParam === 'true') {
            // Get count first
            const { count, error: countError } = await query
                .select('*', { count: 'exact', head: true });

            if (countError) {
                throw countError;
            }

            if (count === 0) {
                return NextResponse.json({
                    ideas: []
                });
            }

            // Get random idea
            const randomOffset = Math.floor(Math.random() * count);
            const { data: ideas, error } = await query
                .order('id')
                .range(randomOffset, randomOffset);

            if (error) {
                throw error;
            }

            return NextResponse.json({
                ideas: ideas || []
            });
        }

        // Return all ideas if no random requested
        const { data: ideas, error } = await query;

        if (error) {
            throw error;
        }

        return NextResponse.json({
            ideas: ideas || []
        });

    } catch (error) {
        console.error('Error fetching mock ideas:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to fetch mock ideas'
            },
            { status: 500 }
        );
    }
}