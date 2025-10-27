# Ideaspire: The Decentralized Venture Launchpad

Ideaspire is a **decentralized venture launchpad** designed to discover, validate, fund, and launch new business ideas. It's an ecosystem where new business ideas are not only discovered but also validated, funded, and launched by a community of founders and backers, leveraging Web3 technology for ownership and fundraising.

## Vision & Business Model

Our business model is a hybrid:

- **SaaS for Founders**: We charge a subscription fee (Basic, Pro, Enterprise) for access to the tools of creation, including the Founder's Toolkits, the ability to mint ideas as NFTs, and the right to list projects on our Launchpad.
- **Success Fee for the Platform**: We take a small commission on successfully funded projects, aligning our success with the success of the founders.

Access to browse and back projects on the Launchpad is **free** for all users, maximizing the potential capital pool for our founders.

## Core User Journeys

Our ecosystem is built for two primary actors: the **Founder** and the **Backer**.

### The Founder's Journey

1. **Discover**: A subscribed Founder finds a high-potential idea, validated by our "Insight Engine."
2. **Mint**: The Founder takes ownership by minting the idea as a unique NFT, which unlocks their "Founder's Toolkit."
3. **Launch**: The Founder lists their project on the Launchpad, setting a funding goal and providing a pitch to attract capital.

### The Backer's Journey

1. **Discover**: A Backer browses the Launchpad for free, using powerful filters to find projects that align with their interests.
2. **Pledge**: The Backer contributes capital to a project they believe in via a "soft-staking" mechanism. Soft-Staking is available to all users (Auditors) with a contribution cap, ensuring maximum capital flow.
3. **Support & Share**: In return, the Backer receives "Idea Shares" and can track the project's progress through on-chain milestones.

## Key Features

### The "Insight Engine"

This is the next major development phase, focused on enriching our idea validation process.

- **Pain Point Intelligence**: Analyze data from sources like Reddit to assign a **"Pain Score" (0.00-10.00)** to problems, indicating market urgency.
- **Sentiment Analysis**: Automatically determine the **Source Sentiment** (Positive, Neutral, Negative) and **Source Emotion** (Frustration, Hopeful, etc.) of the raw data.
- **Context-Rich UI**: Display this new data to empower Founders and Backers.

### The Launchpad

This is the central marketplace where Founders and Backers connect.

- **Gallery & Discovery**: A modern, filterable gallery of projects with Idea Cards that display the **Title, Category, Description,** and prominently feature the **Pain Score** as the primary metric for quick discovery.
- **Project Pages**: Detailed pages for each project with the Founder's pitch, roadmap, and "Insight Engine" data.

### Minting Models

We offer two paths for idea actualization:

1. **The Founder Model**: A single leader mints a unique NFT to lead the project.
2. **The Facilitator Model**: A community builder initiates a "community mint" of fractionalized "Idea Shards" to collectively fund and govern a project.

### Economic Engine

- **Founder's Toolkits**: Subscription-gated toolkits ("Spark" and "Accelerator") that provide AI-generated reports, branding assets, and community access.
- **Idea Shares**: Project-specific fungible tokens that represent a Backer's contribution and grant them utility (e.g., airdrops, beta access).

## Current Implemented State

Our codebase confirms the following features are implemented at a foundational level:

- **Core UI**: A responsive idea view with detailed idea cards.
- **Gamified Discovery**: A "Slot Machine" for idea discovery.
- **User System**: User profiles, authentication, and activity logging.
- **Subscription Tiers**: The tier structure defines **Dual Roles** (Founder/Backer) and enables Soft-Staking for all tiers:
  - **Starter (Auditor)**: Limited Soft-Staking (e.g., $100 cap).
  - **Basic (Analyst)**: Increased Soft-Staking cap.
  - **Pro (Patron) / Enterprise (Venture Partner)**: Unlimited Soft-Staking and full rewards.
- **Idea Management**: API routes for generating, adding, and managing ideas, including similarity checking.
- **Insight Engine (Data & Display)**: Implemented logic for generating and saving **Pain Score, Source Sentiment, and Source Emotion** from Reddit data, and displaying this data in both gallery and detail components.

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

- **`/api/ideas`**: Retrieve daily business ideas.
- **`/api/generate-ideas`**: Trigger the AI to generate new ideas.
- **`/api/interactions/spin`**: Handle a user's "spin" action.
- **`/api/interactions/reveal`**: Handle a user revealing an idea.
- **`/api/subscription`**: Manage user subscription status.
- **`/api/profile`**: Get user-specific data like activity logs and stats.
- **`/api/test-similarity`**: Endpoint for testing and fine-tuning the similarity algorithm.
- **`/api/remove-duplicates`**: Remove duplicate ideas from the database.
