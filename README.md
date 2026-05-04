# 1CMC RLRJ — Movement Lens UI 👑

> **Classification:** PROPRIETARY — 1CMC RLRJ  
> **Author:** Robert Lee Russell Jr., Founder  
> **Version:** 1.0.0  
> **License:** All Rights Reserved

## Overview

Movement Lens UI is the biometric payment frontend for the 1CMC RLRJ Sovereign Ecosystem. It provides a sovereign-grade interface for initiating, authenticating, and tracking USDT settlements through Movement Pay Core smart contracts.

### Payment Flow

```
Wallet Connect → Chain Selection → Payment Details
    → Biometric Authentication (WebAuthn)
    → USDT Escrow → On-Chain Confirmation
    → Settlement Complete
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS + Custom Sovereign Design System |
| Web3 | ethers.js v6 |
| Biometrics | WebAuthn API |
| Animations | Framer Motion |

## Features

- **Biometric Payment Authentication** — WebAuthn-based fingerprint/face verification with keccak256 hash generation
- **Multi-Chain Support** — Ethereum, BSC, Avalanche, Sepolia testnet
- **Real-Time Dashboard** — Protocol volume, fees collected, settlement count, escrow balance
- **Settlement History** — Filterable transaction list with status badges and block explorer links
- **Sovereign Design System** — Gold & dark theme with glass-morphism cards, animated gradients, and scan-line effects

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment config
cp .env.example .env.local

# Start development server
npm run dev

# Build for production
npm run build
npm start
```

## Project Structure

```
src/
├── app/
│   ├── globals.css          # Sovereign design system styles
│   ├── layout.js            # Root layout with fonts & background
│   └── page.js              # Main page — component composition
├── components/
│   ├── Header.jsx           # Fixed header with wallet info
│   ├── WalletConnect.jsx    # Full-screen wallet connection
│   ├── BiometricAuth.jsx    # WebAuthn biometric scan UI
│   ├── ChainSelector.jsx    # Multi-chain selection grid
│   ├── PaymentFlow.jsx      # Multi-step payment wizard
│   ├── Dashboard.jsx        # Protocol stats with animated counters
│   └── TransactionList.jsx  # Settlement history with filters
├── hooks/
│   ├── useWallet.js         # Wallet connection & balance tracking
│   └── useContract.js       # Settlement contract interactions
└── lib/
    ├── contracts.js          # Chain configs, ABIs, helpers
    └── biometric.js          # WebAuthn authentication utilities
```

## Integration

This frontend connects to the [Movement Pay Core](https://github.com/sovereignflamekeeper808-sketch/MovementPayCore) smart contracts. After deploying contracts, update the settlement addresses in `.env.local`.

## Design System

| Token | Value | Usage |
|-------|-------|-------|
| Sovereign Gold | `#D4AF37` | Primary accent, CTAs, highlights |
| Sovereign Dark | `#0A0A0F` | Background |
| Sovereign Card | `#12121A` | Card surfaces |
| Sovereign Border | `#1E1E2E` | Borders, dividers |# 1CMC RLRJ - Movement Lens UI

Biometric Payment Interface for the 1CMC RLRJ Sovereign Ecosystem.

Author: Robert Lee Russell Jr., Founder

## Quick Start

npm install
npm run dev

## Tech Stack

- Next.js 14 (App Router)
- Tailwind CSS + Sovereign Design System
- ethers.js v6
- WebAuthn Biometric Auth

## Features

- Biometric Payment Authentication
- Multi-Chain Support (Ethereum, BSC, Avalanche)
- Real-Time Protocol Dashboard
- Settlement History with Status Tracking
- Sovereign Gold + Dark Theme

Copyright 2026 Robert Lee Russell Jr. All rights reserved.
| Sovereign Accent | `#7C3AED` | Secondary accent |
| Sovereign Success | `#10B981` | Success states |

## Security

- WebAuthn biometric hashes never leave the device
- All USDT operations use SafeERC20 (handles Tether's non-standard ERC-20)
- Biometric replay protection with 5-second cooldown
- Demo mode available for testnet without hardware biometrics

---

**© 2026 1CMC RLRJ. All rights reserved. Unauthorized use, reproduction, or distribution is strictly prohibited.**
