import { isSupabaseConfigured } from './supabaseClient.js';
import { formatDateForDatabase } from '@/utils/dateUtils.js';

// Get business ideas for a specific date
export const getBusinessIdeas = async (supabase, date = new Date()) => {
    if (!isSupabaseConfigured()) {
        // Return sample data if Supabase is not configured
        return getSampleBusinessIdeas();
    }

    try {
        const formattedDate = formatDateForDatabase(date);

        const { data, error } = await supabase
            .from('business_ideas')
            .select('*')
            .eq('date', formattedDate)
            .order('id');

        if (error) {
            console.error('Error fetching business ideas:', error);
            return getSampleBusinessIdeas();
        }

        // Transform snake_case to camelCase for frontend
        const camelCaseIdeas = data.map(idea => ({
            ...idea,
            marketOpportunity: idea.market_opportunity,
            targetAudience: idea.target_audience,
            revenueModel: idea.revenue_model,
            keyChallenges: idea.key_challenges,
            // Remove the snake_case properties to avoid confusion
            market_opportunity: undefined,
            target_audience: undefined,
            revenue_model: undefined,
            key_challenges: undefined
        }));

        return camelCaseIdeas || [];
    } catch (error) {
        console.error('Error fetching business ideas:', error);
        return getSampleBusinessIdeas();
    }
};

// Save business ideas to the database
export const saveBusinessIdeas = async (supabase, ideas, date = new Date()) => {
    if (!isSupabaseConfigured()) {
        // Log to console if Supabase is not configured
        console.log('Supabase not configured. Would save ideas:', ideas);
        return { success: true, data: ideas };
    }

    try {
        const formattedDate = formatDateForDatabase(date);

        // Add date to each idea
        const ideasWithDate = ideas.map(idea => ({
            ...idea,
            date: formattedDate,
            marketOpportunity: idea.marketOpportunity,
            targetAudience: idea.targetAudience,
            revenueModel: idea.revenueModel,
            keyChallenges: idea.keyChallenges
        }));

        // Transform camelCase to snake_case for database
        const dbFormattedIdeas = ideasWithDate.map(idea => ({
            title: idea.title,
            description: idea.description,
            prompt: idea.prompt || 'Generated business idea',
            category: idea.category,
            date: idea.date,
            market_opportunity: idea.marketOpportunity,
            target_audience: idea.targetAudience,
            revenue_model: idea.revenueModel,
            key_challenges: idea.keyChallenges,
            generated: idea.generated || true
        }));

        const { data, error } = await supabase
            .from('business_ideas')
            .insert(dbFormattedIdeas)
            .select();

        if (error) {
            console.error('Error saving business ideas:', error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Error saving business ideas:', error);
        return { success: false, error };
    }
};

// Get sample business ideas for development
const getSampleBusinessIdeas = () => {
    return [
        {
            id: 1,
            title: "AI-Powered Recipe Generator",
            description: "An app that creates personalized recipes based on available ingredients and dietary preferences using AI.",
            marketOpportunity: "Growing demand for personalized nutrition and meal planning solutions.",
            targetAudience: "Individuals, families, and health-conscious consumers.",
            revenueModel: "Freemium model with premium features for meal planning and advanced dietary filters.",
            keyChallenges: "Accuracy of AI suggestions, diverse ingredient recognition, and user adoption.",
            category: "Tech"
        },
        {
            id: 2,
            title: "Vibe Coding Music Generator",
            description: "An AI-powered app that creates personalized coding playlists based on current task, time of day, and productivity levels.",
            marketOpportunity: "Increasing need for focus and productivity tools among developers and remote workers.",
            targetAudience: "Software developers, programmers, and anyone engaged in focused work.",
            revenueModel: "Subscription-based model with different tiers for features like offline mode and advanced customization.",
            keyChallenges: "Accurate mood detection, diverse music library integration, and user privacy concerns.",
            category: "Tech"
        },
        {
            id: 3,
            title: "Micro-SaaS Idea Validator",
            description: "A platform that helps entrepreneurs quickly validate their SaaS ideas through market research and competitor analysis.",
            marketOpportunity: "High failure rate of startups due to lack of market validation; demand for tools to de-risk new ventures.",
            targetAudience: "Aspiring entrepreneurs, startup founders, and product managers.",
            revenueModel: "Tiered subscription model based on the number of validations and access to advanced analytics.",
            keyChallenges: "Providing accurate and comprehensive market data, user trust, and staying updated with market trends.",
            category: "Startup"
        },
        {
            id: 4,
            title: "Eco-Friendly Package Tracker",
            description: "A service that tracks packages and provides carbon footprint information for each delivery.",
            marketOpportunity: "Growing consumer awareness of environmental impact and demand for sustainable practices in e-commerce.",
            targetAudience: "Environmentally conscious consumers, e-commerce businesses, and logistics companies.",
            revenueModel: "Subscription for businesses, freemium for individual users with premium features like carbon offsetting.",
            keyChallenges: "Accurate carbon footprint calculation, integration with various shipping carriers, and data transparency.",
            category: "E-commerce"
        },
        {
            id: 5,
            title: "Skill Barter Marketplace",
            description: "A platform where users can trade skills and services without money, based on time and expertise value.",
            marketOpportunity: "Demand for alternative economies, skill development, and community building.",
            targetAudience: "Individuals with diverse skill sets, small businesses, and community organizations.",
            revenueModel: "Optional premium features like enhanced profiles, dispute resolution, and skill verification.",
            keyChallenges: "Ensuring fair value exchange, building trust among users, and managing quality control.",
            category: "Service"
        },
        {
            id: 6,
            title: "Remote Team Culture Bot",
            description: "An AI assistant that helps distributed teams maintain company culture through personalized activities and communication.",
            marketOpportunity: "Increasing adoption of remote work models creates a need for tools to foster team cohesion and culture.",
            targetAudience: "Remote teams, HR departments, and team leads in distributed organizations.",
            revenueModel: "Subscription-based model with tiers for team size and advanced features.",
            keyChallenges: "Personalization for diverse team cultures, integration with existing communication tools, and data privacy.",
            category: "Tech"
        },
        {
            id: 7,
            title: "Personal Finance Gamifier",
            description: "A finance app that turns budgeting and saving into games with rewards and achievements.",
            marketOpportunity: "Low financial literacy and engagement among young adults; demand for engaging financial management tools.",
            targetAudience: "Young adults, students, and individuals seeking to improve financial habits.",
            revenueModel: "Freemium model with premium features for advanced analytics and personalized coaching.",
            keyChallenges: "User engagement, data security, and integration with various financial institutions.",
            category: "Tech"
        },
        {
            id: 8,
            title: "Local Artisan Finder",
            description: "A marketplace connecting consumers with local artisans for custom-made products and experiences.",
            marketOpportunity: "Growing support for local businesses and unique, handcrafted products; demand for personalized shopping experiences.",
            targetAudience: "Consumers interested in unique products, local artisans, and small businesses.",
            revenueModel: "Commission-based on sales, with optional premium features for artisans (e.g., enhanced profiles, marketing tools).",
            keyChallenges: "Onboarding and retaining artisans, quality control, and local market penetration.",
            category: "E-commerce"
        },
        {
            id: 9,
            title: "Mental Health Mood Tracker",
            description: "An app that tracks mood patterns and provides personalized mental health resources and coping strategies.",
            marketOpportunity: "Increasing awareness of mental health and demand for accessible, personalized support tools.",
            targetAudience: "Individuals seeking to monitor their mental well-being, therapists, and mental health professionals.",
            revenueModel: "Freemium model with premium features for advanced insights, guided meditations, and professional connections.",
            keyChallenges: "Data privacy and security, clinical effectiveness, and user adherence.",
            category: "Service"
        },
        {
            id: 10,
            title: "Sustainable Fashion Advisor",
            description: "An AI assistant that helps users build sustainable wardrobes and make eco-conscious fashion choices.",
            marketOpportunity: "Growing consumer concern for environmental impact of fashion; demand for sustainable and ethical clothing options.",
            targetAudience: "Environmentally conscious consumers, fashion enthusiasts, and ethical shoppers.",
            revenueModel: "Subscription-based for personalized recommendations and access to exclusive sustainable brands.",
            keyChallenges: "Accurate sustainability data, integration with diverse fashion brands, and changing fashion trends.",
            category: "E-commerce"
        }
    ];
};

/**
 * Track a user interaction with an idea
 * @param {Object} supabase - The Supabase client instance
 * @param {Object} user - The authenticated user object
 * @param {number} ideaId - The ID of the idea
 * @param {string} interactionType - The type of interaction (e.g., 'like', 'view', 'copy')
 * @param {Object} metadata - Additional metadata about the interaction
 * @returns {Object} Result of the operation
 */
export const trackUserInteraction = async (supabase, user, ideaId, interactionType, metadata = {}) => {
    if (!isSupabaseConfigured()) {
        console.log('Supabase not configured. Would track interaction:', { ideaId, interactionType, metadata });
        return { success: true };
    }

    try {
        if (!user) {
            console.warn('User not authenticated for interaction tracking.');
            return { success: true };
        }

        const userId = user.id;

        // For 'reveal' interactions, check if the user has already revealed this idea today to prevent multiple reveals
        if (interactionType === 'reveal') {
            const today = new Date().toISOString().split('T')[0];
            const { data: existingReveal, error: revealCheckError } = await supabase
                .from('user_interactions')
                .select('id')
                .eq('user_id', userId)
                .eq('idea_id', ideaId)
                .eq('interaction_type', 'reveal')
                .gte('created_at', `${today}T00:00:00.000Z`)
                .lt('created_at', `${today}T23:59:59.999Z`)
                .limit(1);

            if (revealCheckError) {
                console.error('Error checking for existing reveal:', revealCheckError);
                return { success: false, error: revealCheckError };
            }

            // Only proceed with insert if no reveal exists for this idea today
            if (existingReveal && existingReveal.length > 0) {
                return { success: true, message: 'Reveal already recorded for this idea today', data: existingReveal[0] };
            }
        }

        const interactionData = {
            idea_id: ideaId,
            interaction_type: interactionType,
            user_id: userId,
            metadata: metadata
        };

        const { data, error } = await supabase
            .from('user_interactions')
            .insert([interactionData])
            .select();

        if (error) {
            console.error('Error tracking user interaction:', error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Error tracking user interaction:', error);
        return { success: false, error };
    }
};

/**
 * Check if an idea is liked by the current user
 * @param {Object} supabase - The Supabase client instance
 * @param {Object} user - The authenticated user object
 * @param {number} ideaId - The ID of the idea
 * @returns {Object} Result with isSaved flag
 */
export const isIdeaSaved = async (supabase, user, ideaId) => {
    if (!isSupabaseConfigured()) {
        return { success: true, isSaved: false };
    }

    try {
        if (!user) {
            console.warn('User not authenticated for checking saved status.');
            return { success: true, isSaved: false };
        }

        const userId = user.id;

        const { data, error } = await supabase
            .from('user_interactions')
            .select('id')
            .eq('idea_id', ideaId)
            .eq('interaction_type', 'like')
            .eq('user_id', userId)
            .limit(1);

        if (error) {
            console.error('Error checking if idea is liked:', error);
            return { success: false, error };
        }

        return { success: true, isSaved: data.length > 0 };
    } catch (error) {
        console.error('Error checking if idea is liked:', error);
        return { success: false, error };
    }
};

/**
 * Get all liked ideas for the current user
 * @param {Object} supabase - The Supabase client instance
 * @param {Object} user - The authenticated user object
 * @returns {Object} Result with array of liked idea IDs
 */
export const getSavedIdeas = async (supabase, user) => {
    if (!isSupabaseConfigured()) {
        return { success: true, ideas: [] };
    }

    try {
        if (!user) {
            console.warn('User not authenticated for fetching saved ideas.');
            return { success: true, ideas: [] };
        }

        const userId = user.id;

        const { data, error } = await supabase
            .from('user_interactions')
            .select('idea_id')
            .eq('interaction_type', 'like')
            .eq('user_id', userId);

        if (error) {
            console.error('Error fetching liked ideas:', error);
            return { success: false, error };
        }

        const ideaIds = data.map(item => item.idea_id);

        return { success: true, ideas: ideaIds };
    } catch (error) {
        console.error('Error fetching liked ideas:', error);
        return { success: false, error };
    }
};

/**
 * Remove a liked idea for the current user
 * @param {Object} supabase - The Supabase client instance
 * @param {Object} user - The authenticated user object
 * @param {number} ideaId - The ID of the idea to unlike
 * @returns {Object} Result of the operation
 */
export const removeSavedIdea = async (supabase, user, ideaId) => {
    if (!isSupabaseConfigured()) {
        console.log('Supabase not configured. Would remove liked idea:', ideaId);
        return { success: true };
    }

    try {
        if (!user) {
            console.warn('User not authenticated for removing saved idea.');
            return { success: true };
        }

        const userId = user.id;

        const { error } = await supabase
            .from('user_interactions')
            .delete()
            .eq('idea_id', ideaId)
            .eq('interaction_type', 'like')
            .eq('user_id', userId);

        if (error) {
            console.error('Error removing liked idea:', error);
            return { success: false, error };
        }

        return { success: true };
    } catch (error) {
        console.error('Error removing liked idea:', error);
        return { success: false, error };
    }
};
