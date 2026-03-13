# Somnia Reactor

**Somnia Reactor** is a high-performance, autonomous DeFi intelligence engine powered by the **Somnia Reactivity SDK**. It transforms passive blockchain monitoring into active, event-driven intelligence.

## 🚀 The Reactor Pivot

Unlike traditional DeFi dashboards that rely on polling, Somnia Reactor utilizes **native on-chain triggers** to monitor market fluctuations, yield opportunities, and portfolio health with sub-second latency.

- **Autonomous Intent Detection**: The engine evaluates every block for high-yield rebalancing and arbitrage opportunities.
- **Reactive Architecture**: Subscribes to the Somnia Reactivity Precompile (`0x0100`) for atomic state awareness.
- **Sub-Second Latency**: Operates at the speed of the Somnia network, ensuring you never miss a market movement.
- **Command & Control UI**: A premium cyberpunk interface designed for real-time intelligence visualization.

## 🏗️ Somnia Reactivity Integration

This project is built on the [Somnia Reactivity SDK](https://docs.somnia.network), moving beyond simple data streaming into reactive logic:

- **BlockTick Subscription**: Direct integration with the `BlockTick` system event for sub-second heartbeat synchronization.
- **Reactor Engine**: A custom processing layer that analyzes live streams and generates executable intents.
- **Atomic Guard**: Real-time liquidation protection and volatility monitoring.

### Core Tech Stack

- **Data Infrastructure**: Somnia Data Streams (SDS-1)
- **Reactive Logic**: BlockTick Event (Precompile 0x0100)
- **Network**: Somnia Testnet (Dream-RPC)
- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Web3 wallet (MetaMask recommended)
- Somnia Testnet access

### Installation

```sh
npm install
```

### Environment Configuration

Create a `.env` file in the root directory:

```env
# Somnia Data Streams WebSocket
VITE_SOMNIA_WS_URL=wss://dream-rpc.somnia.network/ws

# Somnia Testnet RPC URL
VITE_SOMNIA_RPC_URL=https://dream-rpc.somnia.network

# Chain Configuration
VITE_SOMNIA_CHAIN_ID=50311
VITE_SOMNIA_EXPLORER_URL=https://shannon-explorer.somnia.network
```

### Running the Reactor

```sh
npm run dev
```

The Reactor Command Center will be available at `http://localhost:8080`.

## 📂 Project Structure

- `src/lib/reactivity-sdk.ts`: Core initialization for the Somnia Reactivity SDK.
- `src/lib/reactor-engine.ts`: The "brain" that processes BlockTicks into intelligence intents.
- `src/hooks/use-somnia-streams.ts`: Reactive hooks for UI synchronization.
- `src/pages/Dashboard.tsx`: Main Command & Control Center interface.

## 🏆 Hackathon Submission

This project is submitted to the **Somnia Reactivity Hackathon**. It demonstrates technically impressive use of the Reactivity SDK to build a functional prototype of autonomous DeFi intelligence.

---

## License

MIT
