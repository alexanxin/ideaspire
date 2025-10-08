import { getBusinessIdeas, saveBusinessIdeas } from './businessIdeas.js';
import { ideaTypes } from '@/data/ideaTypes.js';
import { generateBusinessIdeas, formatBusinessIdeas } from './geminiClient.js';
import { getCurrentDate, formatDateForDatabase } from '@/utils/dateUtils.js';
import { createIdeaResearch, enhancePromptWithResearch } from './researchUtils.js';

// Check if we already have ideas for a specific date
export const hasIdeasForDate = async (date = new Date()) => {
    try {
        const ideas = await getBusinessIdeas(date);
        return ideas && ideas.length > 0;
    } catch (error) {
        console.error('Error checking for existing ideas:', error);
        return false;
    }
};

// Generate and save daily business ideas
export const generateDailyIdeas = async (date = new Date(), force = false) => {
    try {
        // Check if we already have ideas for this date
        if (!force && await hasIdeasForDate(date)) {
            console.log('Ideas already exist for this date. Use force=true to regenerate.');
            return { success: true, message: 'Ideas already exist for this date', regenerated: false };
        }

        // Initialize research module
        const researcher = await createIdeaResearch();

        // Generate ideas for each category
        const allIdeas = [];

        for (const ideaType of ideaTypes) {
            try {
                console.log(`Researching and generating ideas for category: ${ideaType.category}`);

                // Perform research based on category
                const researchTopic = `${ideaType.category} ${ideaType.description}`.toLowerCase();
                const researchData = await researcher.getCombinedResearch(researchTopic);

                // Check if research was successful
                if (!researchData.success) {
                    console.warn(`Research failed for ${ideaType.category}:`, researchData.error);
                    // Continue with fallback data
                }

                // Enhance prompt with research insights
                const enhancedPrompt = await enhancePromptWithResearch(ideaType.prompt, researchData);

                console.log(`Using enhanced prompt for ${ideaType.category}`);

                // Generate ideas with research-enhanced prompt
                const response = await generateBusinessIdeas(enhancedPrompt);
                const ideas = formatBusinessIdeas(response, ideaType.category);

                // Add category to each idea
                const categorizedIdeas = ideas.map(idea => ({
                    ...idea,
                    category: ideaType.category,
                    researchSources: researchData.sources || { twitter: false, reddit: false }, // Add research sources metadata
                    marketOpportunity: idea.marketOpportunity,
                    targetAudience: idea.targetAudience,
                    revenueModel: idea.revenueModel,
                    keyChallenges: idea.keyChallenges
                }));

                allIdeas.push(...categorizedIdeas);
            } catch (error) {
                console.error(`Error generating ideas for ${ideaType.category}:`, error);
            }
        }

        // For daily generation, we'll generate more ideas to support pagination
        // The original limitation of 10 will be removed to allow infinite scroll
        const selectedIdeas = allIdeas.slice(0, Math.min(allIdeas.length, 50)); // Generate up to 50 ideas for better pagination

        // Save ideas to database
        const saveResult = await saveBusinessIdeas(selectedIdeas, date);

        if (!saveResult.success) {
            console.error('Error saving ideas to database:', saveResult.error);
            return { success: false, error: saveResult.error };
        }

        const formattedDate = formatDateForDatabase(date);

        return {
            success: true,
            message: 'Ideas generated and saved successfully',
            ideas: selectedIdeas.map(idea => ({
                ...idea,
                date: formattedDate
            })),
            count: selectedIdeas.length,
            date: formattedDate,
            regenerated: true
        };
    } catch (error) {
        console.error('Error generating daily business ideas:', error);
        return {
            success: false,
            error: error.message || 'Failed to generate daily business ideas'
        };
    }
};

// Get daily ideas - only return existing ideas, don't auto-generate
export const getDailyIdeas = async (date = new Date()) => {
    try {
        // Try to get existing ideas
        const existingIdeas = await getBusinessIdeas(date);

        if (existingIdeas && existingIdeas.length > 0) {
            // Add formatted date to each idea if not already present
            const ideasWithDate = existingIdeas.map(idea => ({
                ...idea,
                date: idea.date || formatDateForDatabase(date)
            }));

            return {
                success: true,
                ideas: ideasWithDate,
                count: ideasWithDate.length,
                generated: false
            };
        }

        // If no ideas exist, return empty array instead of auto-generating
        return {
            success: true,
            ideas: [],
            count: 0,
            generated: false
        };
    } catch (error) {
        console.error('Error getting daily ideas:', error);
        return {
            success: false,
            error: error.message || 'Failed to get daily ideas'
        };
    }
};

// Get ideas with pagination support
export const getIdeasWithPagination = async (date = new Date(), page = 0, limit = 10) => {
    try {
        // First, get existing ideas (without auto-generation)
        const dailyResult = await getDailyIdeas(date);

        if (!dailyResult.success) {
            return dailyResult;
        }

        // Get the full set of ideas for this date
        const allIdeas = dailyResult.ideas;

        // If no ideas exist, return empty result
        if (!allIdeas || allIdeas.length === 0) {
            return {
                success: true,
                ideas: [],
                count: 0,
                page: page,
                limit: limit,
                total: 0,
                hasMore: false,
                generated: dailyResult.generated
            };
        }

        // Calculate pagination
        const startIndex = page * limit;
        const endIndex = startIndex + limit;
        const paginatedIdeas = allIdeas.slice(startIndex, endIndex);

        return {
            success: true,
            ideas: paginatedIdeas,
            count: paginatedIdeas.length,
            page: page,
            limit: limit,
            total: allIdeas.length,
            hasMore: endIndex < allIdeas.length,
            generated: dailyResult.generated
        };
    } catch (error) {
        console.error('Error getting paginated ideas:', error);
        return {
            success: false,
            error: error.message || 'Failed to get paginated ideas'
        };
    }
};

// Get all ideas regardless of date with pagination support
export const getAllIdeas = async (page = 0, limit = 10, category = null) => {
    try {
        // First, check if Supabase is configured
        const { isSupabaseConfigured, supabase } = await import('./supabaseClient.js');
        const { formatDateForDatabase } = await import('@/utils/dateUtils.js');

        if (!isSupabaseConfigured()) {
            // Return sample data if Supabase is not configured
            const sampleIdeas = (await import('./businessIdeas.js')).getSampleBusinessIdeas();

            // Filter by category if provided
            let filteredIdeas = sampleIdeas;
            if (category && category !== 'All') {
                filteredIdeas = sampleIdeas.filter(idea => idea.category === category);
            }

            // Calculate pagination
            const startIndex = page * limit;
            const endIndex = startIndex + limit;
            const paginatedIdeas = filteredIdeas.slice(startIndex, endIndex);

            return {
                success: true,
                ideas: paginatedIdeas,
                count: paginatedIdeas.length,
                page: page,
                limit: limit,
                total: filteredIdeas.length,
                hasMore: endIndex < filteredIdeas.length
            };
        }

        // Calculate offset for pagination
        const offset = page * limit;

        // Build query for total count
        let countQuery = supabase.from('business_ideas').select('*', { count: 'exact', head: true });
        if (category && category !== 'All') {
            countQuery = countQuery.eq('category', category);
        }

        // Get total count first
        const { count: totalCount, error: countError } = await countQuery;

        if (countError) {
            console.error('Error getting total count of ideas:', countError);
            return { success: false, error: countError.message };
        }

        // Build query for fetching ideas
        let ideasQuery = supabase
            .from('business_ideas')
            .select('*')
            .order('date', { ascending: false })
            .order('id', { ascending: false });

        if (category && category !== 'All') {
            ideasQuery = ideasQuery.eq('category', category);
        }

        // Fetch paginated ideas
        const { data: ideas, error } = await ideasQuery.range(offset, offset + limit - 1);

        if (error) {
            console.error('Error fetching all ideas:', error);
            return { success: false, error };
        }

        // Transform snake_case to camelCase for frontend
        const camelCaseIdeas = ideas.map(idea => ({
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

        return {
            success: true,
            ideas: camelCaseIdeas,
            count: camelCaseIdeas.length,
            page: page,
            limit: limit,
            total: totalCount,
            hasMore: offset + limit < totalCount
        };
    } catch (error) {
        console.error('Error getting all ideas:', error);
        return {
            success: false,
            error: error.message || 'Failed to get all ideas'
        };
    }
};

// Get a random idea from a specific date
export const getRandomIdeaFromDate = async (date = new Date()) => {
    try {
        const { isSupabaseConfigured, supabase } = await import('./supabaseClient.js');

        if (!isSupabaseConfigured()) {
            const sampleIdeas = (await import('./businessIdeas.js')).getSampleBusinessIdeas();
            const randomIdea = sampleIdeas[Math.floor(Math.random() * sampleIdeas.length)];
            return {
                success: true,
                ideas: [randomIdea],
                count: 1
            };
        }

        const formattedDate = formatDateForDatabase(date);

        // Get count of ideas for this date
        const { count, error: countError } = await supabase
            .from('business_ideas')
            .select('*', { count: 'exact', head: true })
            .eq('date', formattedDate);

        if (countError) {
            console.error('Error getting count of ideas for date:', countError);
            return { success: false, error: countError.message };
        }

        if (count === 0) {
            return {
                success: true,
                ideas: [],
                count: 0
            };
        }

        // Get random idea
        const randomOffset = Math.floor(Math.random() * count);
        const { data: ideas, error } = await supabase
            .from('business_ideas')
            .select('*')
            .eq('date', formattedDate)
            .range(randomOffset, randomOffset);

        if (error) {
            console.error('Error fetching random idea from date:', error);
            return { success: false, error };
        }

        // Transform snake_case to camelCase
        const camelCaseIdeas = ideas.map(idea => ({
            ...idea,
            marketOpportunity: idea.market_opportunity,
            targetAudience: idea.target_audience,
            revenueModel: idea.revenue_model,
            keyChallenges: idea.key_challenges,
            market_opportunity: undefined,
            target_audience: undefined,
            revenue_model: undefined,
            key_challenges: undefined
        }));

        return {
            success: true,
            ideas: camelCaseIdeas,
            count: camelCaseIdeas.length
        };
    } catch (error) {
        console.error('Error getting random idea from date:', error);
        return {
            success: false,
            error: error.message || 'Failed to get random idea from date'
        };
    }
};

// Get a random recent idea (from last 30 days)
export const getRandomRecentIdea = async () => {
    try {
        const { isSupabaseConfigured, supabase } = await import('./supabaseClient.js');

        if (!isSupabaseConfigured()) {
            const sampleIdeas = (await import('./businessIdeas.js')).getSampleBusinessIdeas();
            const randomIdea = sampleIdeas[Math.floor(Math.random() * sampleIdeas.length)];
            return {
                success: true,
                ideas: [randomIdea],
                count: 1
            };
        }

        // Calculate date 30 days ago
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const formattedDate = formatDateForDatabase(thirtyDaysAgo);

        // Get count of recent ideas
        const { count, error: countError } = await supabase
            .from('business_ideas')
            .select('*', { count: 'exact', head: true })
            .gte('date', formattedDate);

        if (countError) {
            console.error('Error getting count of recent ideas:', countError);
            return { success: false, error: countError.message };
        }

        if (count === 0) {
            return {
                success: true,
                ideas: [],
                count: 0
            };
        }

        // Get random recent idea
        const randomOffset = Math.floor(Math.random() * count);
        const { data: ideas, error } = await supabase
            .from('business_ideas')
            .select('*')
            .gte('date', formattedDate)
            .order('date', { ascending: false })
            .range(randomOffset, randomOffset);

        if (error) {
            console.error('Error fetching random recent idea:', error);
            return { success: false, error };
        }

        // Transform snake_case to camelCase
        const camelCaseIdeas = ideas.map(idea => ({
            ...idea,
            marketOpportunity: idea.market_opportunity,
            targetAudience: idea.target_audience,
            revenueModel: idea.revenue_model,
            keyChallenges: idea.key_challenges,
            market_opportunity: undefined,
            target_audience: undefined,
            revenue_model: undefined,
            key_challenges: undefined
        }));

        return {
            success: true,
            ideas: camelCaseIdeas,
            count: camelCaseIdeas.length
        };
    } catch (error) {
        console.error('Error getting random recent idea:', error);
        return {
            success: false,
            error: error.message || 'Failed to get random recent idea'
        };
    }
};

// Get a random idea by category
export const getRandomIdeaByCategory = async (category, userId = null) => {
    try {
        const { isSupabaseConfigured, supabase } = await import('./supabaseClient.js');

        if (!isSupabaseConfigured()) {
            const sampleIdeas = (await import('./businessIdeas.js')).getSampleBusinessIdeas();
            const filteredIdeas = sampleIdeas.filter(idea => idea.category === category);
            if (filteredIdeas.length === 0) {
                return {
                    success: true,
                    ideas: [],
                    count: 0
                };
            }
            const randomIdea = filteredIdeas[Math.floor(Math.random() * filteredIdeas.length)];
            return {
                success: true,
                ideas: [randomIdea],
                count: 1
            };
        }

        let query = supabase
            .from('business_ideas')
            .select('*')
            .eq('category', category);

        // If user is authenticated, exclude ideas they've already revealed
        if (userId) {
            // Get IDs of ideas the user has already revealed
            const { data: revealedInteractions, error: revealError } = await supabase
                .from('user_interactions')
                .select('idea_id')
                .eq('user_id', userId)
                .eq('interaction_type', 'reveal');

            if (revealError) {
                console.error('Error fetching revealed interactions:', revealError);
                // Continue without filtering if there's an error
            } else if (revealedInteractions && revealedInteractions.length > 0) {
                const revealedIdeaIds = revealedInteractions.map(interaction => interaction.idea_id);
                query = query.not('id', 'in', `(${revealedIdeaIds.join(',')})`);
            }
        }

        // Get count of available ideas for this category (excluding revealed ones if user is authenticated)
        const { count, error: countError } = await query
            .select('*', { count: 'exact', head: true });

        if (countError) {
            console.error('Error getting count of ideas for category:', countError);
            return { success: false, error: countError.message };
        }

        if (count === 0) {
            return {
                success: true,
                ideas: [],
                count: 0
            };
        }

        // Get random idea from available ideas
        const randomOffset = Math.floor(Math.random() * count);
        const { data: ideas, error } = await query
            .order('id')
            .range(randomOffset, randomOffset);

        if (error) {
            console.error('Error fetching random idea by category:', error);
            return { success: false, error };
        }

        // Transform snake_case to camelCase
        const camelCaseIdeas = ideas.map(idea => ({
            ...idea,
            marketOpportunity: idea.market_opportunity,
            targetAudience: idea.target_audience,
            revenueModel: idea.revenue_model,
            keyChallenges: idea.key_challenges,
            market_opportunity: undefined,
            target_audience: undefined,
            revenue_model: undefined,
            key_challenges: undefined
        }));

        return {
            success: true,
            ideas: camelCaseIdeas,
            count: camelCaseIdeas.length
        };
    } catch (error) {
        console.error('Error getting random idea by category:', error);
        return {
            success: false,
            error: error.message || 'Failed to get random idea by category'
        };
    }
};

// Get a completely random idea from all ideas
export const getRandomIdea = async () => {
    try {
        const { isSupabaseConfigured, supabase } = await import('./supabaseClient.js');

        if (!isSupabaseConfigured()) {
            const sampleIdeas = (await import('./businessIdeas.js')).getSampleBusinessIdeas();
            const randomIdea = sampleIdeas[Math.floor(Math.random() * sampleIdeas.length)];
            return {
                success: true,
                ideas: [randomIdea],
                count: 1
            };
        }

        // Get total count
        const { count, error: countError } = await supabase
            .from('business_ideas')
            .select('*', { count: 'exact', head: true });

        if (countError) {
            console.error('Error getting total count of ideas:', countError);
            return { success: false, error: countError.message };
        }

        if (count === 0) {
            return {
                success: true,
                ideas: [],
                count: 0
            };
        }

        // Get random idea
        const randomOffset = Math.floor(Math.random() * count);
        const { data: ideas, error } = await supabase
            .from('business_ideas')
            .select('*')
            .order('id')
            .range(randomOffset, randomOffset);

        if (error) {
            console.error('Error fetching random idea:', error);
            return { success: false, error };
        }

        // Transform snake_case to camelCase
        const camelCaseIdeas = ideas.map(idea => ({
            ...idea,
            marketOpportunity: idea.market_opportunity,
            targetAudience: idea.target_audience,
            revenueModel: idea.revenue_model,
            keyChallenges: idea.key_challenges,
            market_opportunity: undefined,
            target_audience: undefined,
            revenue_model: undefined,
            key_challenges: undefined
        }));

        return {
            success: true,
            ideas: camelCaseIdeas,
            count: camelCaseIdeas.length
        };
    } catch (error) {
        console.error('Error getting random idea:', error);
        return {
            success: false,
            error: error.message || 'Failed to get random idea'
        };
    }
};
