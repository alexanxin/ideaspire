# Ideaspire Launchpad User Flows

This document outlines the primary user journeys for the two key actors in the Ideaspire ecosystem: The Founder and The Backer.

---

## CRITICAL INITIAL STEP: Role Selection at Onboarding

To ensure a tailored experience and correct data modeling, the user's primary role must be determined at the point of signup or first login.

1.  **Role Choice:** The signup/login page must present a clear choice: **"I am a Founder"** or **"I am a Backer."**
2.  **Default State:** All users are initially granted the **Auditor (Free)** tier, which includes basic Backer privileges.
3.  **Founder Path:** Selecting "Founder" sets the user's primary intent and directs them to the dashboard with a clear CTA to upgrade to a paid tier to unlock minting.
4.  **Backer Path:** Selecting "Backer" sets the user's primary intent and directs them straight to the Launchpad/Gallery.

---

## Flow 1: The Founder's Journey - From "Aha!" to "Fund Me!"

This flow describes the path for a user who discovers an idea and decides to take ownership of it to begin development.

1.  **The Spark (Discovery):**
    *   A user on a **Pro** or **Enterprise** plan is browsing ideas.
    *   They click on an idea to open the detailed view modal (`IdeaCard_update_full.js`).
    *   The idea's high "Pain Score" and "Market Viability" from the "Insight Engine" confirm its potential.

2.  **The Commitment (Minting):**
    *   Inside the modal, the user clicks the **"Take Ownership & Mint NFT"** button.
    *   A confirmation modal appears, clarifying that this will use one of their available mints (e.g., "This will use your 1 free monthly mint. Are you ready to become a Founder?").
    *   The user confirms, and a transaction is initiated to their connected wallet (or their integrated Ideaspire Vault).
    *   Upon success, the idea is minted as an NFT in their wallet.
    *   Simultaneously, the corresponding **"Founder's Toolkit"** ("Spark" or "Accelerator") is unlocked in their user dashboard.

3.  **The Pitch (Listing on the Launchpad):**
    *   In their dashboard, the newly minted idea appears in a "My Ventures" section with a "Ready to Launch?" status.
    *   Clicking this opens a simple, clean form to create their Launchpad listing:
        *   **Funding Goal:** The amount of capital they are seeking (e.g., 10,000 USDC).
        *   **Elevator Pitch:** A short, compelling summary of their vision for the project.
        *   **Roadmap:** A few key milestones to outline their development plan.
    *   Upon submission, the idea is officially listed on the Ideaspire Launchpad, making it visible to potential Backers.

---

## Flow 2: The Backer's Journey - From "I Believe!" to "I'm In!"

This flow describes the path for a user who wants to discover and financially support new ventures.

1.  **The Hunt (Discovery):**
    *   A user on a **Pro** or **Enterprise** plan navigates to the "Launchpad" section of the platform.
    *   They browse a gallery of minted ideas listed by Founders. Each project card prominently displays:
        *   The Idea Title
        *   The Founder's Name/Alias
        *   A Funding Goal & Progress Bar
        *   A key metric from the "Insight Engine" (e.g., "Pain Score") to signal its potential.

2.  **The Deep Dive (Due Diligence):**
    *   The user clicks on a project to view its dedicated page. This page contains:
        *   The Founder's full pitch and detailed roadmap.
        *   All the rich data from the "Insight Engine" for full transparency.
        *   A social/interactive section, such as a Q&A or discussion board, for the community to engage with the Founder.

3.  **The Pledge (Soft-Staking):**
    *   Convinced of the project's potential, the user clicks the "Back This Idea" button.
    *   A simple interface appears asking for their contribution amount (e.g., in USDC).
    *   As they type, the interface dynamically shows how many "Idea Shares" they will receive in return (e.g., 500 USDC = 500 "PROJECT" Idea Shares).
    *   The user confirms the transaction with their wallet. Their contribution is added to the project's funding pool, and the corresponding Idea Shares are transferred to their wallet.

4.  **The Follow-Through (Tracking Progress):**
    *   The project now appears in the user's "My Portfolio" section on their dashboard.
    *   They receive platform notifications when the Founder posts updates to the private Founder's Log.
    *   They can view the project's evolving NFT, tracking milestones as they are achieved on-chain, providing confidence and transparency in their investment.

---

## Next Steps & Future Brainstorming

1.  **Flesh out the "Founder's Toolkit"**: Define the specific, high-value deliverables included in the "Spark" and "Accelerator" toolkits.
2.  **Design the "Launchpad" Gallery**: Conceptualize the UI/UX of the page where Backers discover and browse projects.
3.  **Explore the "Idea Shares" Concept**: Detail the tokenomics, utility, and potential value for Backers.
