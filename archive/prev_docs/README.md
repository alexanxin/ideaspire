# Ideaspire Business Ideas Generator

A Next.js web application that generates 10 creative business ideas each day based on trending Reddit topics where users express needs for tools or services. Ideas are generated using the Gemini API and presented in a responsive grid layout with interactive idea cards, gamified discovery via a slot machine, and monetization through tiered subscriptions.

## Features

- Daily generation of 10 creative business ideas from Reddit trends
- Gamified slot machine for idea discovery (spins reveal teasers)
- Tiered access: Free (teasers), Basic (spins + reveals), Pro (unlimited reveals + ownership), Enterprise (custom development)
- Responsive grid layout with interactive idea cards
- Category filtering and search functionality
- Copy ideas to clipboard with one click
- Expandable idea cards with detailed prompts
- Mock NFT minting for idea ownership (database-based)
- Fundraising campaigns for owned ideas
- Developer matching with interest signals and access fees
- Anti-copying mechanisms (watermarks, exclusivity periods, duplicate checks)
- Responsive design for all devices
- Data persistence with Supabase
- AI-powered research using Gemini API
- Reddit community analysis for real user needs
- Duplicate prevention with similarity checking
- Fine-tune similarity thresholds to match your requirements

## Similarity Checking

The application includes a sophisticated similarity checking system to prevent duplicate entries. This system:

- Calculates similarity between new and existing ideas using Jaccard similarity coefficient
- Compares both title and description fields with configurable weights
- Allows fine-tuning of the similarity threshold
- Provides a test endpoint to analyze existing data
- Includes functionality to remove existing duplicates from the database
- Includes both API and UI interfaces for testing different thresholds

## Technology Stack

- **Frontend**: Next.js (JavaScript)
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **AI/Research**: Google Gemini API
- **Authentication**: Privy SDK
- **Deployment**: Vercel
- **Styling**: CSS3 with animations

## Project Structure

```
Ideaspire/
├── components/          # React components (e.g., SlotMachine, IdeaCard)
├── pages/              # Next.js pages and API routes (e.g., dashboard, marketplace)
├── lib/                # Database and API clients (e.g., supabaseClient)
├── styles/             # CSS stylesheets
├── public/             # Static assets
└── utils/              # Utility functions (e.g., similarityCheck)
```

## Getting Started

### Prerequisites

1. Node.js (v14 or higher)
2. Supabase account
3. Google Gemini API key
4. GitHub account (for deployment)

### Setup Instructions

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd Ideaspire
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   GEMINI_API_KEY=your_gemini_api_key
   PRIVY_APP_ID=your_privy_app_id
   ```

4. **Set up Supabase**

   - Create a new Supabase project
   - Run the database schema from the migration scripts (includes business_ideas, categories, users, subscriptions, etc.)
   - Update environment variables with your Supabase credentials

5. **Run the development server**

   ```bash
   npm run dev
   ```

6. **Open the application**
   Visit `http://localhost:3000` in your browser

## Deployment

This application is optimized for deployment on Vercel:

1. Push your code to a GitHub repository
2. Connect your repository to Vercel
3. Add environment variables in Vercel project settings:
   - Supabase credentials
   - Gemini API key
   - Privy app ID
4. Deploy!

## Database Schema

The application uses several tables in Supabase:

1. `business_ideas` - Stores the generated business ideas
2. `categories` - Optional table for categorizing ideas
3. `users` - User profiles (linked to Privy)
4. `subscriptions` - Mock/real subscription tiers
5. `user_interactions` - Likes, reveals, spins
6. `nfts` - Mock NFTs for owned ideas
7. `campaigns` - Fundraising campaigns
8. `developer_interests` - Dev matching
9. `custom_requests` - Enterprise quotes

Refer to the sprint plan for the complete schema.

## API Integration

### Gemini API

The application uses the Gemini API for research and idea generation. The integration is handled server-side to protect the API key. Gemini analyzes Reddit data to generate business ideas.

### Privy SDK

Privy handles authentication (wallet/email) and user profiles, replacing session-based storage.

### Supabase

Supabase is used for data storage and retrieval. The client is initialized in `lib/supabaseClient.js`.

## UI Components

### Idea Grid

The main display component that presents business ideas in a responsive grid layout. Features include:

- Responsive grid that adapts to screen size (1-4 columns)
- Category filtering and search functionality
- Lazy loading for performance optimization
- Smooth animations and transitions

### Idea Cards

Individual card components representing each business idea with:

- Title and detailed prompt display
- Category badges with color coding
- Expandable content areas
- Copy to clipboard functionality with visual feedback
- Mobile-optimized touch targets
- Reveal and mint buttons (tier-dependent)

### Slot Machine

Gamified component for spinning to discover idea teasers.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Google Gemini API for AI-powered idea generation
- Supabase for backend infrastructure
- Next.js for the React framework
- Vercel for deployment platform
- Privy for authentication
