# Technical Architecture for Onramp and Authentication

## 1. Overview

This document outlines the technical architecture for integrating Jupiter Exchange's onramp solution (specifically Moonpay) and Privy SDK for authentication and Solana wallet management within the Spin-to-Win application. The goal is to provide a seamless experience for both Web2 and Web3 users to acquire Solana and BrainSpark tokens and interact with the platform.

## 2. Key Integrations

### 2.1. Jupiter Exchange Onramp (Moonpay)

- **Purpose**: Enable non-Web3 users to purchase Solana (SOL) and BrainSpark tokens directly within the application using fiat currency.
- **Integration Point**: Frontend (client-side) for user interaction, potentially with a backend proxy for API key security and transaction monitoring.
- **Flow**:
  1.  User initiates a purchase from the application UI.
  2.  The application redirects the user to the Moonpay widget/interface (via Jupiter Exchange SDK).
  3.  User completes the KYC and purchase process on Moonpay.
  4.  Moonpay processes the transaction and sends SOL and BrainSpark tokens to the user's connected Solana wallet (managed by Privy or existing wallet).
  5.  Moonpay provides transaction status callbacks/webhooks to the application's backend for status updates and reconciliation.
- **Considerations**:
  - **API Keys**: Securely manage Moonpay API keys (backend proxy recommended).
  - **Webhooks**: Implement a robust webhook listener to receive transaction status updates from Moonpay.
  - **Error Handling**: Graceful handling of failed transactions and user guidance.
  - **Minimum Purchase**: Ensure the UI clearly communicates the $20 minimum purchase amount.
  - **Exchange Rates**: Display Moonpay's exchange rates prominently for user transparency.

### 2.2. Privy SDK for Authentication and Embedded Wallets

- **Purpose**: Provide flexible Web2 (email, social logins) and Web3 (existing wallet connections) authentication, and manage embedded Solana wallets for Web2 users.
- **Integration Point**: Frontend for UI components, and potentially backend for secure session management and user data synchronization.
- **Flow (New Web2 User)**:
  1.  User signs up/logs in via email or social provider using Privy's UI components.
  2.  Privy authenticates the user and automatically provisions an embedded Solana wallet.
  3.  The application retrieves the user's embedded wallet address from Privy.
  4.  This embedded wallet is then used for all on-chain interactions (e.g., receiving SOL/BrainSpark from Moonpay, initiating spins, minting NFTs).
- **Flow (Existing Web3 User)**:
  1.  User connects their existing Solana wallet (e.g., Phantom, Solflare) via Privy's wallet connection interface.
  2.  Privy handles the connection and provides the connected wallet address to the application.
  3.  The application uses this connected wallet for on-chain interactions.
- **Considerations**:
  - **User Experience**: Seamless integration of Privy's UI for authentication and wallet management.
  - **Wallet Abstraction**: For Web2 users, abstract away the complexities of wallet management using Privy's embedded wallets.
  - **Security**: Securely manage Privy API keys and ensure proper session management.
  - **Data Synchronization**: If user data is stored in a separate database (e.g., Supabase), ensure synchronization with Privy's user management.

### 2.3. Solana Wallet Connector (for existing users)

- **Purpose**: Allow existing Web3 users to connect their preferred Solana wallets (e.g., Phantom, Solflare) to the application.
- **Integration Point**: Frontend (client-side) using a library like `@solana/wallet-adapter-react`.
- **Flow**:
  1.  User clicks "Connect Wallet" in the application.
  2.  A modal displays a list of supported wallets.
  3.  User selects their wallet, which prompts for connection approval.
  4.  Upon approval, the wallet adapter provides the connected public key to the application.
- **Considerations**:
  - **Compatibility**: Ensure compatibility with a wide range of popular Solana wallets.
  - **User Experience**: Provide a clear and intuitive wallet connection process.
  - **Error Handling**: Graceful handling of connection failures or rejections.

## 3. System Architecture Diagram

```mermaid
graph TD
    A[User Frontend] --> B{Authentication};
    B -- New Web2 User --> C[Privy SDK];
    B -- Existing Web3 User --> D[Solana Wallet Connector];

    C -- Embedded Wallet --> E[Application Backend];
    D -- Connected Wallet --> E;

    E -- Initiate Onramp --> F[Jupiter Exchange API];
    F -- Fiat Purchase --> G[Moonpay API];
    G -- Crypto Transfer --> H[Solana Blockchain];
    H -- SOL/BrainSpark --> I[User Wallet (Embedded/Connected)];

    I --> E -- On-chain Interactions --> H;
    E -- Data Storage --> J[Supabase Database];

    subgraph Authentication & Wallet Management
        C
        D
    end

    subgraph Onramp Process
        F
        G
        H
        I
    end

    subgraph Application Core
        A
        E
        J
    end
```

### Components:

- **User Frontend**: The Next.js application where users interact with the UI.
- **Authentication**: The entry point for user authentication, leveraging Privy SDK for Web2 and embedded wallets, and Solana Wallet Connector for existing Web3 wallets.
- **Privy SDK**: Handles Web2 authentication (email, social) and provisions embedded Solana wallets for new Web2 users.
- **Solana Wallet Connector**: Facilitates connection to external Solana wallets (e.g., Phantom, Solflare) for existing Web3 users.
- **Application Backend**: Next.js API routes responsible for:
  - Processing onramp initiation requests.
  - Handling Moonpay webhooks for transaction status.
  - Orchestrating on-chain interactions (e.g., initiating spins, minting NFTs) using the user's wallet (embedded or connected).
  - Interacting with the Supabase database.
- **Jupiter Exchange API**: Used to integrate with Moonpay for fiat-to-crypto onramping.
- **Moonpay API**: The actual fiat-to-crypto provider, handling KYC and payment processing.
- **Solana Blockchain**: The underlying blockchain for all crypto transactions, including SOL and BrainSpark token transfers, and NFT minting.
- **User Wallet (Embedded/Connected)**: The user's Solana wallet, either an embedded wallet managed by Privy or an external wallet connected via the Solana Wallet Connector.
- **Supabase Database**: Stores application-specific data, including user profiles, BrainSpark balances, idea metadata, and NFT ownership.

## 4. Data Flow

1.  **User Authentication**:
    - New Web2 users authenticate via Privy, which creates an embedded wallet.
    - Existing Web3 users connect their wallets via the Solana Wallet Connector (potentially integrated with Privy for a unified experience).
2.  **Onramp Process**:
    - User initiates a purchase in the frontend.
    - Backend calls Jupiter Exchange API, which integrates with Moonpay.
    - User completes the purchase on Moonpay.
    - Moonpay sends SOL and BrainSpark to the user's wallet on the Solana blockchain.
    - Moonpay sends transaction status updates to the application backend via webhooks.
3.  **On-chain Interactions**:
    - For actions like purchasing spins or minting NFTs, the frontend sends requests to the backend.
    - The backend uses the user's connected/embedded wallet to sign and send transactions to the Solana blockchain.
    - Transaction status is monitored and updated in the Supabase database.
4.  **Data Storage**:
    - User profiles, BrainSpark balances, and NFT ownership are stored in the Supabase database, linked to the user's wallet address.

## 5. Security Considerations

- **API Key Management**: All sensitive API keys (Jupiter Exchange, Moonpay, Privy) must be stored securely as environment variables and accessed only from the backend.
- **Webhook Verification**: Implement robust signature verification for all incoming webhooks (e.g., from Moonpay) to prevent spoofing and unauthorized data manipulation.
- **Input Validation**: Strictly validate all user inputs on both the frontend and backend to prevent injection attacks and other vulnerabilities.
- **Rate Limiting**: Implement rate limiting on API endpoints to prevent abuse and denial-of-service attacks.
- **Wallet Security**: Educate users on best practices for securing their Solana wallets. For embedded wallets, rely on Privy's security measures.
- **Transaction Monitoring**: Implement logging and monitoring for all on-chain transactions to detect anomalies and potential security breaches.
- **Smart Contract Audits**: Ensure all custom smart contracts (for BrainSpark token, spin logic, NFT minting) undergo thorough security audits.
- **Access Control**: Implement proper access control mechanisms to ensure users can only perform actions authorized for their role and ownership.
