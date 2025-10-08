# Ideaspire

This project is designed to generate and manage business ideas, particularly focusing on ideas that can be implemented quickly for immediate income. The application pulls ideas from various sources including Reddit and uses AI to generate and refine business concepts.

## Features

- Pulls business ideas from Reddit
- Generates business ideas using AI
- Manages ideas in a database with similarity checking to avoid duplicates
- Provides a UI to view and manage ideas
- Cron job for daily idea generation

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.local.example` to `.env.local` and fill in your environment variables
4. Set up your Supabase database using the schema in `create-database.sql`
5. Run the development server: `npm run dev`

## Similarity Checking

The application includes a sophisticated similarity checking system to prevent duplicate entries. This system:

- Calculates similarity between new and existing ideas using Jaccard similarity coefficient
- Compares both title and description fields with configurable weights
- Allows fine-tuning of the similarity threshold
- Provides a test endpoint to analyze existing data

### Testing Similarity Threshold

You can test the similarity checking functionality in several ways:

1. **API Endpoint**: POST to `/api/test-similarity` with a threshold value and weights
2. **Web Interface**: Visit `/test-similarity` to use the UI for testing
3. **Command Line**: Run `npm run test-similarity -- --threshold=0.7 --weights='{"title": 0.6, "description": 0.4}'`

### Adjusting the Similarity Threshold

The default threshold is 0.7, but you can adjust it based on your needs:

- Lower threshold (e.g., 0.5): More lenient, allows more similar ideas
- Higher threshold (e.g., 0.8): Stricter, prevents more potential duplicates

Run tests with different thresholds to find the optimal setting for your use case.

### Removing Duplicates

The application also provides functionality to remove existing duplicates from the database:

- **API Endpoint**: POST to `/api/remove-duplicates` with threshold and strategy
- **Web Interface**: Use the "Remove Duplicates" button on the `/test-similarity` page
- **Command Line**: The functionality is available through the test script

The removal process supports different strategies:

- `keep-newer`: Keep the newer idea, remove the older one
- `keep-older`: Keep the older idea, remove the newer one
- `keep-both`: Keep both ideas (no removal)
- `keep-neither`: Remove both duplicate ideas

## Environment Variables

You need to set up the following environment variables in your `.env.local` file:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `CRON_AUTH_TOKEN` - Authentication token for cron jobs and API endpoints
- `REDDIT_USERNAME` - Reddit username for API access
- `REDDIT_PASSWORD` - Reddit password for API access
- `REDDIT_CLIENT_ID` - Reddit app client ID
- `REDDIT_CLIENT_SECRET` - Reddit app client secret
- `GOOGLE_GENERATIVE_AI_API_KEY` - Google AI API key for idea generation

## Database Schema

The application uses Supabase as its database. The schema is defined in `create-database.sql` and includes:

- `business_ideas` table for storing ideas with fields for title, description, category, etc.
- `categories` table for organizing ideas by category
- `user_interactions` table for tracking user engagement with ideas

## API Endpoints

- `GET /api/ideas` - Retrieve all ideas
- `POST /api/add-parsed-ideas` - Add new ideas with similarity checking
- `POST /api/generate-ideas` - Generate new ideas using AI
- `POST /api/test-similarity` - Test similarity on existing data
- `POST /api/remove-duplicates` - Remove duplicate ideas (with optional specific pair removal)
- `GET /api/cron-daily-ideas` - Run daily idea generation (requires auth token)

## Development

The application is built with Next.js and follows modern React development practices. Key components include:

- Server-side data fetching
- API routes for backend functionality
- Client-side components for UI
- Environment-based configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request
