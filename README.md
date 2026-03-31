# ☕ Stellar Testnet dApp — By Me a Coffee

> A full-stack Web3 dApp built on **Stellar Testnet** with **multi-wallet support** and a deployed **Soroban smart contract** for on-chain coffee tipping.

<div align="center">

![Stellar](https://img.shields.io/badge/Stellar-Testnet-7C3AED?style=for-the-badge&logo=stellar&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Soroban](https://img.shields.io/badge/Soroban-Smart%20Contract-F59E0B?style=for-the-badge)

</div>

---

## 📸 Features

| Feature | Description |
|---|---|
| 🔐 **Multi-Wallet Support** | Connect/disconnect with Freighter and other compatible wallets via @creit.tech/stellar-wallets-kit |
| 💸 **XLM Payments** | Send XLM to any Stellar address with optional memo |
| ☕ **Buy Me a Coffee** | Tip creators on-chain via a deployed Soroban contract |
| 🏆 **Leaderboard** | On-chain leaderboard of top supporters |
| 📜 **Tip History** | Full history of coffee tips from contract |
| 📊 **My Stats** | Your personal total donated, fetched live from contract state |
| 💧 **Friendbot Funding** | Fund your testnet wallet instantly with 10,000 XLM |
| 🔄 **Live Balances** | Auto-refreshing XLM + token balances via Horizon API |

---

## 🏗️ Project Structure

```
stellar-coffee/
├── app/
│   ├── globals.css              # Global styles and Tailwind CSS
│   ├── layout.tsx               # Root layout with metadata
│   └── page.tsx                 # Main app page with section switcher
├── components/
│   ├── WalletConnection.tsx     # Multi-wallet connect/disconnect + Friendbot
│   ├── BalanceDisplay.tsx       # Live XLM & token balance display
│   ├── PaymentForm.tsx          # Classic XLM payment with memo
│   ├── TransactionHistory.tsx   # Recent payments via Horizon API
│   └── BuyCoffeeContract.tsx    # ☕ Full Soroban contract UI (4 tabs)
├── lib/
│   ├── stellar-helper.ts        # Unified wallet & Horizon API helpers
│   └── coffee-contract.ts       # Soroban contract calls (buy_coffee, leaderboard, etc.)
├── coffee-contact/             # Rust Soroban contract source code
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

---

## ☕ Soroban Contract

The **By Me a Coffee** contract is deployed on Stellar Testnet.

| | |
|---|---|
| **Contract ID** | `CAYRJABAYNE4Q5PYYILXIUZOWKCHJGMURXXWAD7MXGFHGRRSUG5CCIKF` |
| **Network** | Stellar Testnet |
| **Explorer** | [View on Stellar Expert ↗](https://stellar.expert/explorer/testnet/contract/CAYRJABAYNE4Q5PYYILXIUZOWKCHJGMURXXWAD7MXGFHGRRSUG5CCIKF) |
| **Stellar Lab** | [Invoke on Stellar Lab ↗](https://lab.stellar.org/r/testnet/contract/CAYRJABAYNE4Q5PYYILXIUZOWKCHJGMURXXWAD7MXGFHGRRSUG5CCIKF) |

### Contract Functions

```rust
// ✍️  Write (requires wallet signature)
fn buy_coffee(from: Address, amount: i128, message: String)

// 📖  Read (simulate only, no signature needed)
fn tip_history() -> Vec<TipRecord>
fn leaderboard() -> Vec<(Address, i128)>
fn total_donated(user: Address) -> i128
```

### Transaction Flow

```
1. buildBuyCoffeeTransaction()     → simulate tx to get Soroban footprint + fees
2. stellar.signTransaction()       → user approves in wallet popup
3. submitCoffeeTransaction()       → submit to Soroban RPC, poll until SUCCEEDED
```

> **Key difference from classic payments:** Soroban requires `assembleTransaction()` after simulation to inject resource fees and auth entries before signing.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js 18+](https://nodejs.org/)
- [Freighter Wallet](https://freighter.app/) browser extension (recommended)
- Wallet set to **Testnet** network

### Installation

```bash
# 1. Clone repo
git clone https://github.com/Abhishekyadav26/stellar-coffee.git
cd stellar-coffee

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### First Time Setup

```
1. Install Freighter → freighter.app
2. Open Freighter → Settings → Network → Select "Testnet"
3. Create or import a wallet in Freighter
4. Open app → Connect Wallet
5. Click "Fund via Friendbot" → receive 10,000 XLM instantly
6. You're ready to send payments and buy coffees on-chain! ☕
```

---

## 📦 Key Dependencies

```json
{
  "@stellar/stellar-sdk": "^13.x",   // Stellar & Soroban SDK
  "@creit.tech/stellar-wallets-kit": "^1.x", // Multi-wallet support
  "next": "^15.x",                    // Next.js App Router
  "react": "^19.x",
  "typescript": "^5.x",
  "tailwindcss": "^3.x"
}
```

Install them:

```bash
npm install @stellar/stellar-sdk @creit.tech/stellar-wallets-kit next react react-dom typescript tailwindcss
```

---

## 🔑 How Wallet Signing Works
The app **never touches your private key**. Here's the pattern used throughout:

```typescript
// 1. Build unsigned transaction → returns XDR string
const xdr = await buildBuyCoffeeTransaction(address, amount, message);

// 2. Wallet signs it (private key stays in wallet)
const { signedTxXdr } = await stellar.signTransaction(xdr);

// 3. Submit signed XDR to Soroban RPC
const result = await submitCoffeeTransaction(signedTxXdr);
```

---

## 🌐 Network Configuration

| Setting | Value |
|---|---|
| **Network** | Stellar Testnet |
| **Horizon URL** | `https://horizon-testnet.stellar.org` |
| **Soroban RPC** | `https://soroban-testnet.stellar.org` |
| **Network Passphrase** | `Test SDF Network ; September 2015` |
| **Friendbot** | `https://friendbot.stellar.org?addr=<PUBLIC_KEY>` |

---

## 🧠 Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                   Next.js Frontend                  │
│                                                     │
│  page.tsx ──► WalletConnection  ◄── Wallet Kit       │
│            ├─► BalanceDisplay   ──► Horizon API     │
│            ├─► PaymentForm      ──► Horizon API     │
│            ├─► TransactionHistory ► Horizon API     │
│            └─► BuyCoffeeContract                    │
│                  ├─► buy_coffee  ──► Soroban RPC    │
│                  ├─► tip_history ──► Soroban RPC    │
│                  ├─► leaderboard ──► Soroban RPC    │
│                  └─► total_donated ► Soroban RPC    │
│                                                     │
└─────────────────────────────────────────────────────┘
                         │
              ┌──────────▼──────────┐
              │  Stellar Testnet    │
              │  ┌───────────────┐  │
              │  │ Soroban       │  │
              │  │ Contract      │  │
              │  │ CAYRJAB…CCIKF │  │
              │  └───────────────┘  │
              └─────────────────────┘
```

---

## 📁 Key Files Explained

### `lib/coffee-contract.ts`
All Soroban contract interaction logic lives here. Exports:
- `buildBuyCoffeeTransaction()` — builds + simulates tx, returns XDR
- `submitCoffeeTransaction()` — submits signed XDR, polls for confirmation
- `getTipHistory()` — reads all tips via simulation (free, no signature)
- `getLeaderboard()` — reads top donors
- `getTotalDonated()` — reads a specific user's total
- `xlmToStroops()` / `stroopsToXlm()` — unit conversion helpers

### `lib/stellar-helper.ts`
Unified wallet and Horizon API helpers:
- `connectWallet()` / `disconnect()` — wallet connection management
- `signTransaction()` — unified signing for any connected wallet
- `getAccountBalances()` — fetch XLM + token balances
- `buildPaymentTransaction()` — build a classic XLM payment
- `submitSignedTransaction()` — submit to Horizon
- `getTransactionHistory()` — fetch recent payments
- `fundTestnetAccount()` — Friendbot integration

### `components/BuyCoffeeContract.tsx`
The full coffee contract UI with 4 tabs: Buy, History, Leaderboard, My Stats.

---

## 🛠️ Deploying Your Own Contract

```bash
# Navigate to contract directory
cd coffee-contact

# Build Rust contract
cargo build --target wasm32v1-none --release

# Deploy to testnet
stellar contract deploy \
  --wasm target/wasm32v1-none/release/by_me_coffee.wasm \
  --source-account YOUR_ACCOUNT \
  --network testnet \
  --alias coffee
```

Then update `COFFEE_CONTRACT_ID` in `lib/coffee-contract.ts` with your new contract address.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m 'Add my feature'`
4. Push to your fork: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

MIT — feel free to fork and build your own Stellar dApps!

---

## 🆕 Recent Updates

### ✅ Multi-Wallet Support
- **Upgraded** from direct Freighter integration to `@creit.tech/stellar-wallets-kit`
- **Added** support for multiple compatible wallets
- **Fixed** "wallet not found" issues in Buy Me Coffee transactions
- **Streamlined** wallet connection across all components

### ✅ Code Improvements
- **Unified** wallet handling through `stellar-helper.ts`
- **Removed** redundant troubleshooting components
- **Enhanced** error handling and user experience
- **Cleaned** up project structure and documentation

---

<div align="center">

Built with ❤️ on **Stellar Testnet** · Powered by **Soroban** · Multi-Wallet Support

⭐ Star this repo if you found it helpful!

</div>
