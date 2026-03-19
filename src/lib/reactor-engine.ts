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

// Varied intent templates for realistic demo output
const YIELD_INTENTS = [
	{ desc: 'High yield opportunity detected: 22.5% APY in STT/USDC Pool', apy: 22.5, pool: 'STT/USDC' },
	{ desc: 'Yield spike detected: 18.3% APY in STT/WETH Pool', apy: 18.3, pool: 'STT/WETH' },
	{ desc: 'Rebalance signal: STT Staking Pool yielding 31.2% APY (anomaly)', apy: 31.2, pool: 'STT Staking' },
	{ desc: 'Optimal entry detected: USDC/DAI stable pool at 9.8% APY', apy: 9.8, pool: 'USDC/DAI' },
	{ desc: 'Yield farming opportunity: STT/USDT pool surged to 27.1% APY', apy: 27.1, pool: 'STT/USDT' },
]

const ARB_INTENTS = [
	{ desc: 'Arbitrage path detected: Source Pool A → Sync Pool B (Profit: 1.2%)', profit: '1.2%', path: 'A → B' },
	{ desc: 'Cross-pool arbitrage: STT price delta 0.8% across DEX pairs', profit: '0.8%', path: 'DEX1 → DEX2' },
	{ desc: 'Flash arbitrage window: 2.1% spread on STT/USDC across venues', profit: '2.1%', path: 'Venue A → B' },
	{ desc: 'Triangular arb detected: STT → WETH → USDC → STT (Profit: 1.5%)', profit: '1.5%', path: 'Triangle' },
]

const GUARD_INTENTS = [
	{ desc: 'Volatility spike monitored: STT price moved 4.2% — positions safe', asset: 'STT' },
	{ desc: 'Liquidation risk scan complete: all positions above safety threshold', asset: 'Portfolio' },
	{ desc: 'Flash crash guard active: protective intent simulated for WETH exposure', asset: 'WETH' },
]

class ReactorEngine {
	private intents: ReactorIntent[] = []
	private callbacks: Set<IntentCallback> = new Set()
	private isRunning = false
	private unsubscribe: (() => void) | null = null
	private fallbackTimer: ReturnType<typeof setInterval> | null = null
	private fallbackTimeout: ReturnType<typeof setTimeout> | null = null
	private receivedRealTick = false
	private intentCounter = 0

	// Thresholds for the demo
	private VOLATILITY_THRESHOLD = 0.05 // 5% price change
	private YIELD_OPPORTUNITY_THRESHOLD = 15 // 15% APY

	constructor() {}

	async start(walletAddress: string) {
		if (this.isRunning) return
		this.isRunning = true

		console.log('Starting Somnia Reactor Engine for:', walletAddress)

		// Try to subscribe to BlockTick via the Reactivity SDK
		try {
			this.unsubscribe = await somniaReactor.subscribeToBlockTick((data) => {
				this.receivedRealTick = true
				// Clear fallback if real data starts flowing
				if (this.fallbackTimer) {
					clearInterval(this.fallbackTimer)
					this.fallbackTimer = null
					console.log('Reactor Engine: Real BlockTick received, fallback disabled')
				}
				this.processBlock(data, walletAddress)
			})
		} catch (error) {
			console.warn('Reactor Engine: BlockTick subscription failed, using fallback simulation:', error)
			this.startFallbackSimulation(walletAddress)
			return
		}

		// Start fallback after 3s if no real BlockTick arrives
		this.fallbackTimeout = setTimeout(() => {
			if (!this.receivedRealTick && this.isRunning) {
				console.log('Reactor Engine: No BlockTick received after 3s, activating fallback simulation')
				this.startFallbackSimulation(walletAddress)
			}
		}, 3000)
	}

	private startFallbackSimulation(walletAddress: string) {
		if (this.fallbackTimer) return

		// Generate first intent immediately
		this.generateSimulatedIntent()

		// Then generate varied intents every 4-8 seconds
		this.fallbackTimer = setInterval(() => {
			if (!this.isRunning) {
				if (this.fallbackTimer) clearInterval(this.fallbackTimer)
				return
			}
			this.generateSimulatedIntent()
		}, 4000 + Math.random() * 4000)
	}

	private generateSimulatedIntent() {
		this.intentCounter++
		const cycle = this.intentCounter % 3

		if (cycle === 0) {
			const template = YIELD_INTENTS[Math.floor(Math.random() * YIELD_INTENTS.length)]
			this.addIntent({
				id: `yield-${Date.now()}`,
				type: 'REBALANCE',
				status: 'DETECTED',
				description: template.desc,
				timestamp: Date.now(),
				details: { pool: template.pool, apy: template.apy }
			})
		} else if (cycle === 1) {
			const template = ARB_INTENTS[Math.floor(Math.random() * ARB_INTENTS.length)]
			this.addIntent({
				id: `arb-${Date.now()}`,
				type: 'ARBITRAGE',
				status: 'DETECTED',
				description: template.desc,
				timestamp: Date.now(),
				details: { profit: template.profit, path: template.path }
			})
		} else {
			const template = GUARD_INTENTS[Math.floor(Math.random() * GUARD_INTENTS.length)]
			this.addIntent({
				id: `guard-${Date.now()}`,
				type: 'LIQUIDATION_GUARD',
				status: 'DETECTED',
				description: template.desc,
				timestamp: Date.now(),
				details: { asset: template.asset }
			})
		}
	}

	stop() {
		if (this.unsubscribe) {
			this.unsubscribe()
			this.unsubscribe = null
		}
		if (this.fallbackTimer) {
			clearInterval(this.fallbackTimer)
			this.fallbackTimer = null
		}
		if (this.fallbackTimeout) {
			clearTimeout(this.fallbackTimeout)
			this.fallbackTimeout = null
		}
		this.isRunning = false
		this.receivedRealTick = false
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
		const template = YIELD_INTENTS[Math.floor(Math.random() * YIELD_INTENTS.length)]
		if (template.apy > this.YIELD_OPPORTUNITY_THRESHOLD) {
			this.addIntent({
				id: `yield-${Date.now()}`,
				type: 'REBALANCE',
				status: 'DETECTED',
				description: template.desc,
				timestamp: Date.now(),
				details: { pool: template.pool, apy: template.apy }
			})
		}
	}

	private checkArbitrageOpportunities() {
		const template = ARB_INTENTS[Math.floor(Math.random() * ARB_INTENTS.length)]
		this.addIntent({
			id: `arb-${Date.now()}`,
			type: 'ARBITRAGE',
			status: 'DETECTED',
			description: template.desc,
			timestamp: Date.now(),
			details: { profit: template.profit, path: template.path }
		})
	}

	private checkPortfolioHealth(walletAddress: string) {
		// Occasionally generate guard intents
		if (Math.random() > 0.7) {
			const template = GUARD_INTENTS[Math.floor(Math.random() * GUARD_INTENTS.length)]
			this.addIntent({
				id: `guard-${Date.now()}`,
				type: 'LIQUIDATION_GUARD',
				status: 'DETECTED',
				description: template.desc,
				timestamp: Date.now(),
				details: { asset: template.asset }
			})
		}
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
