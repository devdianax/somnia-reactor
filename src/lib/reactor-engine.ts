import { somniaReactor, BlockTickData } from './reactivity-sdk'
import { somniaStreams, PriceUpdate, YieldPosition } from './somnia-sdk'

export interface ReactorIntent {
	id: string
	type: 'REBALANCE' | 'LIQUIDATION_GUARD' | 'ARBITRAGE' | 'ALERT'
	status: 'DETECTED' | 'EXECUTING' | 'COMPLETED' | 'FAILED'
	description: string
	timestamp: number
	details?: any
}

type IntentCallback = (intent: ReactorIntent) => void

class ReactorEngine {
	private intents: ReactorIntent[] = []
	private callbacks: Set<IntentCallback> = new Set()
	private isRunning = false
	private unsubscribe: (() => void) | null = null

	// Thresholds for the demo
	private VOLATILITY_THRESHOLD = 0.05 // 5% price change
	private YIELD_OPPORTUNITY_THRESHOLD = 15 // 15% APY

	constructor() {}

	async start(walletAddress: string) {
		if (this.isRunning) return
		this.isRunning = true

		console.log('Starting Somnia Reactor Engine for:', walletAddress)

		// Subscribe to BlockTick via the new Reactivity SDK
		this.unsubscribe = await somniaReactor.subscribeToBlockTick((data) => {
			this.processBlock(data, walletAddress)
		})
	}

	stop() {
		if (this.unsubscribe) {
			this.unsubscribe()
			this.unsubscribe = null
		}
		this.isRunning = false
		console.log('Somnia Reactor Engine stopped')
	}

	onIntent(callback: IntentCallback) {
		this.callbacks.add(callback)
		return () => this.callbacks.delete(callback)
	}

	private async processBlock(data: BlockTickData, walletAddress: string) {
		// This runs every block (~sub-second on Somnia)
		// 1. Check for Yield Opportunities
		this.checkYieldOpportunities()

		// 2. Check for Price Anomalies (Arb)
		this.checkArbitrageOpportunities()

		// 3. Portfolio Health Guard
		this.checkPortfolioHealth(walletAddress)
	}

	private checkYieldOpportunities() {
		// Mock logic for the demo: detect an intent if APY is high
		// In a real app, this would query the latest stream data
		const mockHighYield = 22.5 // Example high APY detected
		
		if (mockHighYield > this.YIELD_OPPORTUNITY_THRESHOLD) {
			this.addIntent({
				id: `yield-${Date.now()}`,
				type: 'REBALANCE',
				status: 'DETECTED',
				description: `High yield opportunity detected: 22.5% APY in STT/USDC Pool`,
				timestamp: Date.now(),
				details: { pool: 'STT/USDC', apy: mockHighYield }
			})
		}
	}

	private checkArbitrageOpportunities() {
		// Mock arb detection logic
		const priceDiff = 0.012 // 1.2% difference
		if (priceDiff > 0.01) {
			this.addIntent({
				id: `arb-${Date.now()}`,
				type: 'ARBITRAGE',
				status: 'DETECTED',
				description: `Arbitrage path detected: Source Pool A -> Sync Pool B (Profit: 1.2%)`,
				timestamp: Date.now(),
				details: { profit: '1.2%', path: 'A -> B' }
			})
		}
	}

	private checkPortfolioHealth(walletAddress: string) {
		// Mock portfolio guard logic
		// In real usage, this would compare state across blocks reactively
	}

	private addIntent(intent: ReactorIntent) {
		// Avoid duplicate intents in same block/timeframe
		const exists = this.intents.some(i => i.type === intent.type && (Date.now() - i.timestamp) < 5000)
		if (exists) return

		this.intents.unshift(intent)
		if (this.intents.length > 50) this.intents.pop()
		
		this.callbacks.forEach(cb => cb(intent))
	}

	getIntents() {
		return this.intents
	}
}

export const reactorEngine = new ReactorEngine()
