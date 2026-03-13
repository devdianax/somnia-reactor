# DeFi Stream Insight

A monitoring dashboard for DeFi portfolios that showcases real-time token balances, yield performance, and transaction flows powered by **Somnia Data Streams**.

## 🚀 Features

- **Real-Time Portfolio Tracking**: Live updates of token balances and portfolio values
- **Transaction Monitoring**: Real-time transaction stream from connected wallets
- **Yield Farming Dashboard**: Track staking positions and rewards in real-time
- **Price Alerts**: Set up alerts that trigger based on real-time price updates
- **Somnia Testnet Integration**: Fully deployed and tested on Somnia testnet

## 🏗️ Somnia Data Streams Integration

This project integrates with [Somnia Data Streams](https://datastreams.somnia.network) to provide real-time, reactive on-chain data. The integration includes:

- **WebSocket Connection**: Maintains persistent connection to Somnia Data Streams
- **Reactive Hooks**: Custom React hooks for subscribing to different data streams
- **Real-Time Updates**: All data updates automatically as changes occur on-chain
- **Stream Management**: Automatic reconnection and subscription management

### Data Streams Used

1. **Wallet Balances Stream**: Real-time token balances for connected wallets
2. **Transaction Stream**: Live transaction updates as they occur
3. **Token Price Stream**: Real-time price updates for tracked tokens
4. **Yield Position Stream**: Live updates on staking positions and rewards

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Web3 wallet (MetaMask recommended)
- Access to Somnia testnet

### Installation

```sh
npm install
```

### Environment Configuration

Create a `.env` file in the `frontend/` directory:

```env
# Somnia Data Streams WebSocket endpoint
VITE_SOMNIA_STREAMS_ENDPOINT=wss://datastreams.somnia.network/ws

# Somnia Testnet RPC URL
# Source: https://docs.somnia.network/developer/network-info
VITE_SOMNIA_RPC_URL=https://dream-rpc.somnia.network

# Somnia Testnet Chain ID
VITE_SOMNIA_CHAIN_ID=50312

# Somnia Testnet Explorer URL
VITE_SOMNIA_EXPLORER_URL=https://shannon-explorer.somnia.network

# WalletConnect Project ID (get from https://cloud.walletconnect.com)
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

**Note**: All testnet values are from the [official Somnia documentation](https://docs.somnia.network/developer/network-info). You'll need to create a free WalletConnect account to get a Project ID for WalletConnect support.

### Running the Development Server

```sh
npm run dev
```

The development server defaults to `http://localhost:8080`.

### Connecting Your Wallet

1. Navigate to `/connect-wallet`
2. Select your preferred wallet (MetaMask, WalletConnect, etc.)
3. Approve the connection request
4. The app will automatically switch to Somnia testnet if needed
5. Start monitoring your portfolio in real-time!

## Available Scripts

- `npm run dev` – launch the Vite dev server with hot reload
- `npm run build` – create a production build
- `npm run preview` – serve the production build locally for verification
- `npm run lint` – run ESLint

## Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS
- **State Management**: React Context + Custom Hooks
- **Data Fetching**: TanStack Query
- **Web3**: ethers.js v6
- **Real-Time Data**: Somnia Data Streams SDK

## Project Structure

```
frontend/
├── src/
│   ├── components/        # React components
│   │   ├── ui/           # shadcn/ui components
│   │   └── ...
│   ├── contexts/         # React contexts (WalletContext)
│   ├── hooks/            # Custom React hooks
│   │   └── use-somnia-streams.ts  # Somnia Data Streams hooks
│   ├── lib/              # Utility libraries
│   │   └── somnia-sdk.ts # Somnia Data Streams SDK service
│   ├── pages/            # Page components
│   │   ├── Dashboard.tsx # Portfolio dashboard
│   │   ├── YieldFarming.tsx
│   │   ├── Alerts.tsx
│   │   └── ...
│   └── ...
├── public/               # Static assets
└── vite.config.ts        # Vite configuration
```

## Key Components

### Somnia Data Streams SDK (`src/lib/somnia-sdk.ts`)

The core SDK service that manages WebSocket connections and stream subscriptions:

- `SomniaDataStreams`: Main class for managing connections
- `subscribeToWalletBalances()`: Subscribe to wallet token balances
- `subscribeToTokenPrices()`: Subscribe to token price updates
- `subscribeToTransactions()`: Subscribe to wallet transactions
- `subscribeToYieldPositions()`: Subscribe to yield farming positions

### Custom Hooks (`src/hooks/use-somnia-streams.ts`)

React hooks that provide easy access to data streams:

- `useSomniaConnection()`: Manage SDK connection state
- `useWalletBalances()`: Get real-time wallet balances
- `useTokenPrices()`: Get real-time token prices
- `useWalletTransactions()`: Get real-time transactions
- `useYieldPositions()`: Get real-time yield positions
- `usePortfolioValue()`: Calculate portfolio value from balances

## Deployment

### Building for Production

```sh
npm run build
```

The production build will be in the `dist/` directory.

### Deploying to Somnia Testnet

1. Build the project: `npm run build`
2. Deploy the `dist/` directory to your preferred hosting provider:
   - Vercel
   - Netlify
   - Cloudflare Pages
   - Any static hosting solution

3. Ensure environment variables are set in your hosting provider

## Hackathon Submission

This project was built for the **Somnia Data Streams Mini Hackathon** (November 4-15, 2025).

### Judging Criteria Alignment

✅ **Technical Excellence**: Fully functional implementation using Somnia Data Streams SDK  
✅ **Real-Time UX**: Leverages real-time features effectively with live updates  
✅ **Somnia Integration**: Configured for deployment on Somnia testnet  
✅ **Potential Impact**: Demonstrates real-world use case for DeFi portfolio monitoring

## Resources

- [Somnia Documentation](https://docs.somnia.network)
- [Somnia Data Streams](https://datastreams.somnia.network)
- [Somnia Network](https://somnia.network)

## License

MIT
