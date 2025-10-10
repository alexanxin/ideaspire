# Ideaspire: Project Blueprint

**Version:** 1.0  
**Status:** In Progress  
**Last Updated:** 2025-10-08

## 1. Vision & Business Model

Ideaspire is a **decentralized venture launchpad** designed to discover, validate, fund, and launch new business ideas.

Our business model is a hybrid:

- **SaaS for Founders:** We charge a subscription fee (Basic, Pro, Enterprise) for access to the tools of creation, including the Founder's Toolkits, the ability to mint ideas as NFTs, and the right to list projects on our Launchpad.
- **Success Fee for the Platform:** We take a small commission on successfully funded projects, aligning our success with the success of the founders.

Access to browse and back projects on the Launchpad is **free** for all users, maximizing the potential capital pool for our founders.

_(For a detailed breakdown, see `BUSINESS_MODEL.md`)_

## 2. Core User Journeys

Our ecosystem is built for two primary actors: the **Founder** and the **Backer**.

### 2.1. The Founder's Journey

1.  **Discover:** A subscribed Founder finds a high-potential idea, validated by our "Insight Engine."
2.  **Mint:** The Founder takes ownership by minting the idea as a unique NFT, which unlocks their "Founder's Toolkit."
3.  **Launch:** The Founder lists their project on the Launchpad, setting a funding goal and providing a pitch to attract capital.

### 2.2. The Backer's Journey

1.  **Discover:** A Backer browses the Launchpad for free, using powerful filters to find projects that align with their interests.
2.  **Pledge:** The Backer contributes capital to a project they believe in via a "soft-staking" mechanism. **Soft-Staking is available to all users (Auditors) with a contribution cap, ensuring maximum capital flow.**
3.  **Support & Share:** In return, the Backer receives "Idea Shares" and can track the project's progress through on-chain milestones.

_(For a detailed breakdown, see `USER_FLOWS.md`)_

## 3. Key Features & Modules

### 3.1. The "Insight Engine" (Phase 1 Roadmap)

This is the next major development phase, focused on enriching our idea validation process.

- **Pain Point Intelligence:** Analyze data from sources like Reddit to assign a **"Pain Score" (0.00-10.00)** to problems, indicating market urgency.
- **Sentiment Analysis:** Automatically determine the **Source Sentiment** (Positive, Neutral, Negative) and **Source Emotion** (Frustration, Hopeful, etc.) of the raw data.
- **Context-Rich UI:** Display this new data to empower Founders and Backers.

### 3.2. The Launchpad

This is the central marketplace where Founders and Backers connect.

- **Gallery & Discovery:** A modern, filterable gallery of projects. _(See `LAUNCHPAD_GALLERY_DESIGN.md`)_
  - **Idea Card (`IdeaCard.js`):** Displays the **Title, Category, Description,** and prominently features the **Pain Score** as the primary metric for quick discovery.
- **Project Pages:** Detailed pages for each project with the Founder's pitch, roadmap, and "Insight Engine" data.
  - **Detail View (`IdeaCard_update_full.js`):** Displays all core research data (**Market Opportunity, Target Audience, Revenue Model, Key Challenges**) alongside the full Insight Engine data (**Pain Score, Source Sentiment, Source Emotion**).

### 3.3. Minting Models

We offer two paths for idea actualization:

1.  **The Founder Model:** A single leader mints a unique NFT to lead the project.
2.  **The Facilitator Model:** A community builder initiates a "community mint" of fractionalized "Idea Shards" to collectively fund and govern a project.

_(For a detailed breakdown, see `MINTING_MODELS.md`)_

### 3.4. Economic Engine

- **Founder's Toolkits:** Subscription-gated toolkits ("Spark" and "Accelerator") that provide AI-generated reports, branding assets, and community access. _(See `FOUNDER_TOOLKITS.md`)_
- **Idea Shares:** Project-specific fungible tokens that represent a Backer's contribution and grant them utility (e.g., airdrops, beta access). _(See `IDEA_SHARES_TOKENOMICS.md`)_

## 4. Current Implemented State (As of 2025-10-08)

Our codebase (`/src`) confirms the following features are implemented at a foundational level:

- **Core UI:** A responsive idea view (`ResponsiveIdeaView.js`) with detailed idea cards (`IdeaCard_update_full.js`).
- **Gamified Discovery:** A "Slot Machine" (`SlotMachine.js`) for idea discovery.
- **User System:** User profiles (`profile/page.js`), authentication (`lib/auth.js`), and activity logging (`ActivityLog.js`).
- **Subscription Tiers:** The tier structure has been updated to define **Dual Roles** (Founder/Backer) and enable Soft-Staking for all tiers:
    - **Starter (Auditor):** Limited Soft-Staking (e.g., $100 cap).
    - **Basic (Analyst):** Increased Soft-Staking cap.
    - **Pro (Patron) / Enterprise (Venture Partner):** Unlimited Soft-Staking and full rewards.
- **Idea Management:** API routes for generating (`api/generate-ideas/route.js`), adding (`api/add-parsed-ideas/route.js`), and managing ideas, including similarity checking (`lib/similarityUtils.js`).
- **Insight Engine (Data & Display):** Implemented logic for generating and saving **Pain Score, Source Sentiment, and Source Emotion** from Reddit data, and displaying this data in both the gallery (`IdeaCard.js`) and detail (`IdeaCard_update_full.js`) components.

## 5. Next Steps

The immediate priority is the development of the **"Insight Engine"** as outlined in the Phase 1 Roadmap. This will be followed by the full implementation of the Web3 features, including:

- Connecting the "Take Ownership & Mint NFT" button to a real minting process.
- Building the Launchpad UI and backend logic.
- Developing the smart contracts for Idea Shares and the community treasury.
