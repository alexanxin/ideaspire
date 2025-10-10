# Spin-to-Win Feature Documentation

## 1. Introduction

This document outlines the design and functionality of the "Spin-to-Win" feature, an interactive interface resembling a slot machine where users can spin to discover new ideas. Users will interact with this feature using their Solana wallets, with a focus on NFT minting for chosen ideas and a proprietary token for ecosystem interactions.

## 2. Core Components

### 2.1. Spin-to-Win Interface (Slot Machine UI)

- **Description**: A visually engaging interface that simulates a slot machine. It will display three "reels" that spin and land on different ideas.
- **Functionality**:
  - Users connect their Solana wallet to access the feature.
  - Each connected wallet receives one free spin.
  - Additional spins can be purchased using BrainSpark tokens.
  - The spin mechanism will randomly select three ideas from a curated list.
  - Visual and auditory feedback for spinning and landing on ideas.

### 2.2. Idea Display

- **Description**: After a spin, three ideas will be presented in a hidden state. Users must choose which idea to reveal, with each reveal incurring a cost in BrainSpark tokens.
- **Functionality**:
  - Display of three hidden idea slots after a spin.
  - Users select one slot to reveal an idea.
  - Each reveal costs a specified amount of BrainSpark tokens.
  - Once revealed, the idea's title and a brief description are shown.
  - Option to "mint" a liked idea as an NFT (after revealing).
  - Option to "respin" (if tokens are available).

## 3. Solana Wallet Integration

- **Wallets**: Support for popular Solana wallets such as Phantom and Solflare.
- **Functionality**:
  - Connect/disconnect wallet.
  - Display connected wallet address.
  - Facilitate transactions for spins and NFT minting.

### 2.3. Idea Fundraising Platform

- **Description**: A dedicated section of the platform where users can list their minted NFT ideas to seek funding from the community.
- **Functionality**:
  - Users can "deposit" their owned NFT ideas onto the platform for fundraising.
  - Display of listed ideas with details, current funding, and funding goals.
  - Community members can contribute BrainSpark tokens to fund ideas they support.
  - Progress tracking towards funding goals.

## 4. NFT Minting

- **Purpose**: Users can mint an idea they like as a non-fungible token (NFT), signifying ownership of that idea.
- **Format**:
  - **Compressed NFTs**: To minimize minting costs and maximize scalability on the Solana blockchain.
  - Exploration of other modern, cost-effective NFT formats will be conducted during the technical design phase.
- **Ownership**: Minting an NFT grants the user verifiable ownership of the specific idea.

## 5. BrainSpark Token (Proprietary Token)

### 5.1. Token Name

- **Name**: BrainSpark

### 5.2. Core Utility and Use Cases

- **Purchasing Spins**: BrainSpark tokens will be the primary currency for users to acquire additional spins beyond their initial free spin.
- **Idea Funding**: BrainSpark tokens will be integrated into a mechanism for users to contribute to the funding of ideas. This could involve:
  - **Direct Contributions**: Users can directly allocate BrainSpark tokens to ideas they wish to see developed.
  - **Staking/Voting**: Users could stake BrainSpark tokens to vote on promising ideas, with successful ideas receiving a portion of a funding pool. (Further details to be defined in tokenomics).
  - **Idea Realization Support**: Users who own a minted idea (NFT) can request assistance from the platform to realize their idea. A fee, determined by the complexity of the idea, will be charged for this service.

### 5.3. Initial Tokenomics

- **Total Supply**: A fixed total supply will be established to ensure scarcity and predictable value. The exact number will be determined during the smart contract design phase.
- **Distribution**:
  - **Initial Users Allocation**: A portion of the total supply will be allocated to initial users, potentially through airdrops or early participation rewards, to bootstrap the ecosystem.
  - **Idea Funding Pool**: A significant portion of the supply will be reserved for the idea funding mechanism, ensuring a sustainable source of capital for promising ideas.
- **Burning Mechanisms**: No burning mechanisms are planned for the initial phase. This may be revisited based on ecosystem growth and token velocity.

## 6. Smart Contract Architecture (High-Level)

- **Spin Management**: A smart contract will manage the spin logic, ensuring fairness and tracking free spins and BrainSpark-purchased spins. It will also manage the association of generated ideas with a spin session.
- **Idea Revelation**: A smart contract will manage the revelation of ideas, deducting BrainSpark tokens for each reveal and ensuring only chosen ideas are unveiled.
- **NFT Minting**: A smart contract will handle the minting of compressed NFTs for ideas, linking the NFT to the idea's metadata.
- **Token Distribution**: A smart contract will manage the distribution of BrainSpark tokens, including initial allocations and mechanisms for idea funding.

## 7. Backend API Endpoints (High-Level)

- **Spin Logic**:
  - `/api/spin`: Initiates a spin, deducts a free spin or BrainSpark token, and returns three _hidden_ idea identifiers.
- **Idea Retrieval**:
  - `/api/ideas/{id}`: Retrieves details for a specific idea (only accessible after revelation).
  - `/api/ideas/mintable`: Returns a list of ideas available for minting.
- **Idea Revelation**:
  - `/api/reveal-idea`: Processes the revelation of a chosen idea, deducts BrainSpark tokens, and returns the idea's details.
- **NFT/Token Interactions**:
  - `/api/mint-nft`: Handles the request to mint an idea as an NFT.
  - `/api/brainspark/balance`: Retrieves a user's BrainSpark token balance.
  - `/api/brainspark/purchase-spin`: Processes the purchase of a spin using BrainSpark tokens.
  - `/api/brainspark/fund-idea`: Handles contributions to idea funding using BrainSpark tokens.
  - `/api/idea-realization/request-support`: Allows users to request support for realizing their owned idea, with a fee determined by complexity.
  - **Idea Fundraising**:
    - `/api/fundraising/deposit-idea`: Allows users to list their owned NFT idea for fundraising, specifying a funding goal.
    - `/api/fundraising/contribute`: Processes contributions of BrainSpark tokens to a listed idea.

## 8. Database Schema (High-Level)

- **Users**:
  - `wallet_address` (Primary Key)
  - `free_spins_remaining`
  - `brainspark_balance`
- **Ideas**:
  - `idea_id` (Primary Key)
  - `title`
  - `description`
  - `minted_nft_address` (Foreign Key to NFTs)
  - `funding_raised` (in BrainSpark tokens)
  - `fundraising_status` (e.g., "active", "funded", "closed")
  - `fundraising_goal` (in BrainSpark tokens)
  - **NFTs**:
    - `nft_address` (Primary Key)
    - `idea_id` (Foreign Key to Ideas)
    - `owner_wallet_address` (Foreign Key to Users)
    - `mint_date`
- **Spins**:
  - `spin_id` (Primary Key)
  - `wallet_address` (Foreign Key to Users)
  - `spin_date`
  - `ideas_generated` (Array of idea_ids)
  - `revealed_ideas` (Array of idea_ids, tracking which ideas from a spin have been revealed)
- **Idea Reveals**:
  - `reveal_id` (Primary Key)
  - `spin_id` (Foreign Key to Spins)
  - `idea_id` (Foreign Key to Ideas)
  - `wallet_address` (Foreign Key to Users)
  - `reveal_date`
  - `tokens_spent`

## 9. User Interface Wireframe (Conceptual)

- **Home Page**:
  - Connect Wallet button.
  - Display of connected wallet address and BrainSpark balance.
  - "Spin" button.
  - Area for displaying the three idea reels (initially showing hidden slots).
  - Section to show the results of the spin (three hidden idea cards/slots).
  - **Hidden Idea Slot**:
    - Placeholder image/text.
    - "Reveal Idea" button (with BrainSpark token cost displayed).
  - **Revealed Idea Card**:
    - Idea Title.
    - Idea Description.
    - "Mint as NFT" button.
    - "Fund Idea" button (if applicable).
- **Fundraising Page**:
  - List of ideas available for funding.
  - Each idea card shows: Title, Description, Current Funding, Funding Goal, "Contribute" button.
  - Option for users to "Deposit NFT Idea for Funding".
- **Wallet Connection Modal**: Standard wallet connection UI.

## 10. Technical Specifications

Detailed technical specifications for smart contracts, backend services, and the frontend application will be developed in subsequent phases, building upon this documentation.
