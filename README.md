# Ideaspire: The Web3 Innovation Launchpad

Ideaspire is evolving beyond a simple idea generation tool into a self-sustaining **decentralized venture launchpad**. It's an ecosystem where new business ideas are not only discovered but also validated, funded, and launched by a community of founders and backers, leveraging Web3 technology for ownership and fundraising.

## Core Features (Current Implementation)

- **Daily Idea Generation**: Uses the Gemini API to generate 10 creative business ideas each day based on trending topics and identified user needs from sources like Reddit.
- **Gamified Discovery ("Spin-to-Win")**: A slot machine interface allows users to "spin" to discover new idea teasers in an engaging, interactive way.
- **Tiered Subscriptions**: A multi-level subscription model (Free, Basic, Pro, Enterprise) gates access to premium features. Higher tiers provide more daily spins, idea reveals, and access to advanced analytics.
- **Similarity Checking**: A sophisticated Jaccard similarity algorithm prevents duplicate ideas by comparing new concepts against the existing database, with configurable thresholds and weights.
- **User Profiles & Dashboards**: Registered users have a profile to track their activity, including spins, revealed ideas, and subscription status.

## Roadmap

### Phase 1: The "Insight Engine" Upgrade

This is the next immediate development phase, focused on evolving Ideaspire into a sophisticated insight engine.

- **Pain Point Intelligence**: Analyze and enrich raw data from sources like Reddit to identify the most pressing user problems using sentiment analysis and a weighted "Pain Score."
- **Idea Validation & Refinement**: Subject generated ideas to a rigorous, automated validation process, including a "Solution-Fit Algorithm" and a "Market Viability" snapshot based on public data.
- **Context-Rich UI**: Redesign the UI to present this new data, including a "Traceability" link to the original source pain point and a dashboard for validation metrics.

### Future Vision: The Web3 Launchpad

The long-term goal is to fully realize the Web3 launchpad, enabling a two-sided marketplace for innovators and backers.

- **Founder's Mint (NFTs)**: Allow founders to take ownership of ideas by minting them as NFTs, which will unlock a "Founder's Toolkit" with advanced reports and resources.
- **Community Funding (Soft Staking)**: Enable backers to "soft-stake" cryptocurrency to a founder's minted idea in exchange for "Idea Shares," facilitating community-driven fundraising.
- **Evolving NFTs**: The Founder's NFT will be a dynamic, living credential whose metadata evolves as the founder achieves key milestones, creating a transparent, on-chain "Proof of Build."

## Technology Stack

- **Framework**: Next.js (App Router)
- **Language**: JavaScript
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **AI/Research**: Google Gemini API
- **Authentication**: Supabase Auth
- **Deployment**: Vercel

## Project Structure

```
spin-to-win/
├── src/
│   ├── app/
│   │   ├── api/              # API routes (ideas, subscription, profile)
│   │   ├── (pages)/          # App pages (dashboard, pricing, profile)
│   │   ├── layout.js
│   │   └── page.js
│   ├── components/           # React components (SlotMachine, IdeaCard, etc.)
│   ├── lib/                  # Core logic & clients (Supabase, Gemini, etc.)
│   └── ...
└── ...
```

## Getting Started

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Set up environment variables**:
    Copy `.env.local.example` to `.env.local` and fill in your credentials for Supabase, Google Gemini AI, and Reddit.
4.  **Set up database**:
    Use the schema in `prev_docs/create-database.sql` to set up your Supabase tables.
5.  **Run the development server**:
    ```bash
    npm run dev
    ```

## API Endpoints

The application provides a rich set of API endpoints to manage the entire lifecycle of ideas, users, and subscriptions. Key endpoints include:

-   **`/api/ideas`**: Retrieve daily business ideas.
-   **`/api/generate-ideas`**: Trigger the AI to generate new ideas.
-   **`/api/interactions/spin`**: Handle a user's "spin" action.
-   **`/api/interactions/reveal`**: Handle a user revealing an idea.
-   **`/api/subscription`**: Manage user subscription status.
-   **`/api/profile`**: Get user-specific data like activity logs and stats.
-   **`/api/test-similarity`**: Endpoint for testing and fine-tuning the similarity algorithm.
-   **`/api/remove-duplicates`**: Remove duplicate ideas from the database.