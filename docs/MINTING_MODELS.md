# Ideaspire Minting Models: Founder vs. Facilitator

This document details the dual-track system for idea actualization on the Ideaspire Launchpad. It addresses the challenge of offering powerful, flexible Web3 funding mechanisms without creating a complex or overwhelming user experience.

---

## 1. The "One Question" Framework

To avoid user confusion, we will not present a complicated choice between different tokenomic models. Instead, we will frame the decision around the user's intent and identity.

When a user decides to act on an idea, they are presented with one simple, powerful question:

**"Are you a Founder or a Facilitator?"**

This single choice determines the entire path forward, creating two distinct, intuitive journeys.

---

## 2. Path A: The Founder Model ("I will lead this venture.")

This is the primary, recommended path for the visionary who is ready to take ownership and build a project from the ground up.

*   **The User's Choice:** The user selects the option: **"Become the Founder."**

*   **Core Mechanic: The Founder's Mint**
    *   This action initiates the minting of a **single, unique Non-Fungible Token (NFT)**.
    *   This NFT represents sole, verifiable ownership of the idea on the Ideaspire platform.

*   **Economic Model: Idea Shares**
    *   As the Founder, the user can then list their project on the Launchpad to raise capital.
    *   Community members who contribute funds become **Backers**.
    *   In return for their contribution, Backers receive **Idea Shares**, which represent their support and grant them access to rewards defined by the Founder.
    *   *(See `IDEA_SHARES_TOKENOMICS.md` for the full model).*

*   **The Outcome:** A single leader (the Founder) is empowered with the capital and community support to execute their vision.
    *   *(See `USER_FLOWS.md` - "Flow 1: The Founder's Journey" for the detailed user experience).*

---

## 3. Path B: The Facilitator Model ("I will build a community for this idea.")

This is the secondary path for the community-builder, the connector who believes in an idea and wants to rally a collective to bring it to life, without being the sole leader.

*   **The User's Choice:** The user selects the option: **"Facilitate a Community."**

*   **Core Mechanic: The Community Mint**
    *   This action initiates the minting of a **limited collection of fractionalized NFTs (e.g., 100 "Idea Shards")**.
    *   Each shard represents a piece of collective ownership in the idea's potential.
    *   The minting fee for a shard is significantly lower, democratizing access.

*   **Economic Model: Idea Shards & Crowdsourced Treasury**
    *   The funds from the sale of all Idea Shards are automatically pooled into a **community treasury**.
    *   This treasury provides the seed capital for the project.
    *   The shard-holders themselves form an instant, pre-validated community of passionate believers.

*   **The Outcome: The "Now What?"**
    *   With a community formed and a treasury funded, the collective must decide how to proceed. The platform will guide them through potential governance models:
        1.  **The Mini-DAO Model:** Shard-holders vote on proposals to spend the treasury and guide development.
        2.  **The "Elect a Champion" Model:** The community votes to elect a Lead Founder to execute the vision.
        3.  **The Bounty Board Model:** The treasury is used to fund bounties for specific development tasks, open to the community or external talent.

---

## 4. UI/UX Implementation Strategy

To ensure simplicity, the choice will be presented clearly and hierarchically:

*   The **"Become the Founder"** option will be the large, primary call-to-action button.
*   The **"Facilitate a Community"** option will be a smaller, secondary link, signaling that it is an alternative, more advanced path.

This approach provides the power of both models while guiding the majority of users toward the most straightforward path, thus solving for complexity.
