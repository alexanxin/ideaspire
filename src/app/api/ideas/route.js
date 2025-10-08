import { NextResponse } from 'next/server';
import { getDailyIdeas, getIdeasWithPagination, getAllIdeas, getRandomIdeaFromDate, getRandomRecentIdea, getRandomIdea, getRandomIdeaByCategory } from '@/lib/dailyIdeas';
import { getCurrentDate, formatDateForDatabase } from '@/utils/dateUtils';
import { getUserIdFromSupabase } from '@/lib/auth';

export async function GET(request) {
    try {
        // Get user ID from session (for filtering revealed ideas)
        const userId = await getUserIdFromSupabase();

        // Get the date from query parameters or use today's date
        const { searchParams } = new URL(request.url);
        const dateParam = searchParams.get('date');
        const pageParam = searchParams.get('page');
        const limitParam = searchParams.get('limit');
        const randomParam = searchParams.get('random');
        const recentParam = searchParams.get('recent');
        const categoryParam = searchParams.get('category');

        // Check if date parameter was provided
        const isDateProvided = searchParams.get('date') !== null;
        const isRandom = randomParam === 'true';
        const isRecent = recentParam === 'true';
        const isCategoryProvided = searchParams.get('category') !== null;

        let date;
        if (dateParam) {
            date = new Date(dateParam);
        } else {
            date = getCurrentDate();
        }

        // Parse pagination parameters
        const page = pageParam ? parseInt(pageParam, 10) : 0;
        const limit = limitParam ? parseInt(limitParam, 10) : 10; // Default to 10 if no limit specified

        let result;

        if (isRandom) {
            // Handle random selection
            if (isCategoryProvided) {
                // Random from specific category, excluding revealed ideas for authenticated users
                result = await getRandomIdeaByCategory(categoryParam, userId);
            } else if (isDateProvided) {
                // Random from specific date
                result = await getRandomIdeaFromDate(date);
            } else if (isRecent) {
                // Random from recent ideas
                result = await getRandomRecentIdea();
            } else {
                // Random from all ideas
                result = await getRandomIdea();
            }
        } else if (!isDateProvided) {
            // If no date provided, fetch all ideas regardless of date
            result = await getAllIdeas(page, limit, categoryParam);

            if (!result.success) {
                return NextResponse.json(
                    {
                        success: false,
                        error: result.error
                    },
                    { status: 500 }
                );
            }
        } else if (page === 0 && (limit === 10 || !limitParam)) {
            // Use the regular getDailyIdeas for backwards compatibility when date is provided
            result = await getDailyIdeas(date);

            if (!result.success) {
                return NextResponse.json(
                    {
                        success: false,
                        error: result.error
                    },
                    { status: 500 }
                );
            }
        } else {
            // Use pagination for other cases when date is provided
            result = await getIdeasWithPagination(date, page, limit);

            if (!result.success) {
                return NextResponse.json(
                    {
                        success: false,
                        error: result.error
                    },
                    { status: 500 }
                );
            }
        }

        if (isRandom) {
            // For random requests, return the single idea
            return NextResponse.json({
                ideas: result.ideas,
                count: result.count
            });
        } else if (!isDateProvided) {
            // When fetching all ideas, don't include date field since ideas are from different dates
            return NextResponse.json({
                ideas: result.ideas,
                count: result.count,
                page: result.page || page,
                limit: result.limit || limit,
                total: result.total || undefined,
                hasMore: result.hasMore
            });
        } else {
            // When fetching ideas for a specific date, include the date field
            const formattedDate = formatDateForDatabase(date);

            return NextResponse.json({
                date: formattedDate,
                ideas: result.ideas,
                count: result.count,
                generated: result.generated,
                page: result.page || page,
                limit: result.limit || limit,
                total: result.total || undefined
            });
        }
    } catch (error) {
        console.error('Error fetching business ideas:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to fetch business ideas'
            },
            { status: 500 }
        );
    }
}
