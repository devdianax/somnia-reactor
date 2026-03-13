let SDK: typeof import('@somnia-chain/streams').SDK | null = null

const loadSDK = async () => {
	if (!SDK) {
		try {
			const sdkModule = await import('@somnia-chain/streams')
			SDK = sdkModule.SDK
		} catch (error) {
			console.error('Failed to load @somnia-chain/streams SDK:', error)
			throw error
		}
	}
	return SDK
}

import { createPublicClient, createWalletClient, http, webSocket, formatEther } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { somniaTestnet } from './wagmi-config'
import {
	transformBlockchainEventToTransaction,
	transformToTokenBalance,
	transformToPriceUpdate,
	transformToYieldPosition,
	isBlockchainEvent,
	isBalanceData,
	isPriceData,
} from './data-transformer'

export interface TokenBalance {
	address: string
	symbol: string
	name: string
	balance: string
	value: string
	price: string
	change24h: number
	decimals: number
}

export interface Transaction {
	hash: string
	type: 'Received' | 'Sent' | 'Swap' | 'Stake' | 'Unstake'
	token: string
	amount: string
	timestamp: number
	status: 'pending' | 'confirmed' | 'failed'
	from?: string
	to?: string
}

export interface YieldPosition {
	protocol: string
	token: string
	deposited: string
	apy: string
	earned: string
	dailyRewards: string
	contractAddress: string
}

export interface PriceUpdate {
	token: string
	symbol: string
	price: string
	change24h: number
	timestamp: number
}

type StreamCallback<T> = (data: T) => void
type StreamUnsubscribe = () => void

class SomniaDataStreams {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private sdk: any = null
	private subscriptions: Map<string, { unsubscribe: () => void }> = new Map()
	private sdkSubscriptions: Map<string, { unsubscribe: () => void }> = new Map()
	private isInitialized = false

	constructor(private rpcUrl: string, private wsUrl: string) {}

	async initialize(): Promise<void> {
		if (this.isInitialized && this.sdk) {
			return
		}

		if (typeof window !== 'undefined' && !window.Buffer) {
			console.warn('Buffer polyfill not loaded, SDK initialization may fail')
		}

		try {
			const SDKClass = await loadSDK()
			if (!SDKClass) {
				throw new Error('Failed to load SDK class')
			}

			// SDK requires WebSocket transport for subscriptions
			// Use the provided WebSocket URL (should be wss://dream-rpc.somnia.network/ws)
			const wsTransport = webSocket(this.wsUrl)
			
			console.log('Initializing SDK with WebSocket transport:', this.wsUrl)

			// Public client MUST use WebSocket for SDK subscriptions to work
			const publicClient = createPublicClient({
				chain: somniaTestnet,
				transport: wsTransport,
			})

			const dummyAccount = privateKeyToAccount('0x0000000000000000000000000000000000000000000000000000000000000001' as `0x${string}`)
			const walletClient = createWalletClient({
				chain: somniaTestnet,
				account: dummyAccount,
				transport: http(this.rpcUrl), // Wallet client can use HTTP
			})

			this.sdk = new SDKClass({
				// @ts-expect-error - Type compatibility issue between viem and SDK types
				public: publicClient,
				wallet: walletClient,
			})

			this.isInitialized = true
			console.log('Somnia Data Streams SDK initialized successfully')
		} catch (error) {
			console.error('Failed to initialize Somnia Data Streams SDK:', error)
			throw error
		}
	}

	private async ensureInitialized(): Promise<void> {
		if (!this.isInitialized || !this.sdk) {
			await this.initialize()
		}
	}

	subscribeToWalletBalances(
		walletAddress: string,
		callback: StreamCallback<TokenBalance[]>
	): StreamUnsubscribe {
		const streamId = `wallet:${walletAddress}:balances`
		
		let sdkUnsubscribe: (() => void) | null = null

		const unsubscribe = () => {
			if (sdkUnsubscribe) {
				try {
					sdkUnsubscribe()
				} catch (error) {
					console.error('Error unsubscribing from SDK:', error)
				}
				sdkUnsubscribe = null
			}
			this.sdkSubscriptions.delete(streamId)
			this.subscriptions.delete(streamId)
		}

		this.ensureInitialized()
			.then(async () => {
				if (!this.sdk || !this.sdk.streams) {
					console.warn('SDK not initialized, using mock data')
					return
				}

				try {
					// Subscribe to balance updates for the wallet address
					// Note: Initial balance is fetched in the hook via getTokenBalances()
					// This subscription only handles real-time updates from the stream
					const subscription = await this.sdk.streams.subscribe({
						somniaStreamsEventId: undefined,
						ethCalls: [],
						context: `wallet-balances-${walletAddress}`,
						onlyPushChanges: false,
						onData: (data: any) => {
							try {
								// Use transformation layer
								if (isBalanceData(data)) {
									const balances = transformToTokenBalance(data, walletAddress)
									if (balances.length > 0) {
										callback(balances)
									}
								}
							} catch (error) {
								console.error('Error processing balance data:', error)
							}
						},
						onError: (error: any) => {
							console.error('Error in wallet balances stream:', error)
						},
					})

					if (subscription && subscription.unsubscribe) {
						sdkUnsubscribe = subscription.unsubscribe
						this.sdkSubscriptions.set(streamId, { unsubscribe: sdkUnsubscribe })
						console.log(`Subscribed to wallet balances for ${walletAddress}`)
					}
				} catch (error) {
					console.error('Failed to subscribe to wallet balances via SDK:', error)
				}
			})
			.catch((error) => {
				console.error('Failed to initialize SDK for wallet balances:', error)
			})

		this.subscriptions.set(streamId, { unsubscribe })
		return unsubscribe
	}

	subscribeToTokenPrices(
		tokenAddresses: string[],
		callback: StreamCallback<PriceUpdate>
	): StreamUnsubscribe {
		const streamId = `prices:${tokenAddresses.join(',')}`
		
		const sdkUnsubscribes: (() => void)[] = []

		const unsubscribe = () => {
			sdkUnsubscribes.forEach((unsub) => {
				try {
					unsub()
				} catch (error) {
					console.error('Error unsubscribing from SDK:', error)
				}
			})
			sdkUnsubscribes.length = 0
			this.sdkSubscriptions.delete(streamId)
			this.subscriptions.delete(streamId)
		}

		this.ensureInitialized()
			.then(async () => {
				if (!this.sdk || !this.sdk.streams) {
					console.warn('SDK not initialized, using mock data')
					return
				}

				try {
					// Subscribe to price updates for each token
					for (const tokenAddress of tokenAddresses) {
						const subscription = await this.sdk.streams.subscribe({
							somniaStreamsEventId: undefined,
							ethCalls: [],
							context: `token-price-${tokenAddress}`,
							onlyPushChanges: false,
							onData: (data: any) => {
								try {
									// Use transformation layer
									if (isPriceData(data)) {
										const priceUpdate = transformToPriceUpdate(data, tokenAddress)
										if (priceUpdate) {
											callback(priceUpdate)
										}
									}
								} catch (error) {
									console.error('Error processing price data:', error)
								}
							},
							onError: (error: any) => {
								console.error(`Error in price stream for ${tokenAddress}:`, error)
							},
						})
						
						if (subscription && subscription.unsubscribe) {
							sdkUnsubscribes.push(subscription.unsubscribe)
						}
					}

					if (sdkUnsubscribes.length > 0) {
						this.sdkSubscriptions.set(streamId, { unsubscribe: () => unsubscribe() })
						console.log(`Subscribed to prices for ${tokenAddresses.length} tokens`)
					}
				} catch (error) {
					console.error('Failed to subscribe to token prices via SDK:', error)
				}
			})
			.catch((error) => {
				console.error('Failed to initialize SDK for token prices:', error)
			})

		this.subscriptions.set(streamId, { unsubscribe })
		return unsubscribe
	}

	subscribeToTransactions(
		walletAddress: string,
		callback: StreamCallback<Transaction>
	): StreamUnsubscribe {
		const streamId = `wallet:${walletAddress}:transactions`
		
		let sdkUnsubscribe: (() => void) | null = null

		const unsubscribe = () => {
			if (sdkUnsubscribe) {
				try {
					sdkUnsubscribe()
				} catch (error) {
					console.error('Error unsubscribing from SDK:', error)
				}
				sdkUnsubscribe = null
			}
			this.sdkSubscriptions.delete(streamId)
			this.subscriptions.delete(streamId)
		}

		this.ensureInitialized()
			.then(async () => {
				if (!this.sdk || !this.sdk.streams) {
					console.warn('SDK not initialized, using mock data')
					return
				}

				try {
					const subscription = await this.sdk.streams.subscribe({
						somniaStreamsEventId: undefined,
						ethCalls: [],
						context: `wallet-transactions-${walletAddress}`,
						onlyPushChanges: false,
						onData: (data: any) => {
							try {
								// Use transformation layer
								if (isBlockchainEvent(data)) {
									const transaction = transformBlockchainEventToTransaction(data)
									if (transaction) {
										callback(transaction)
									}
								} else if (data && typeof data === 'object' && (data.hash || data.txHash)) {
									// Already formatted transaction
									const transaction: Transaction = {
										hash: data.hash || data.txHash || '',
										type: data.type || 'Received',
										token: data.token || 'STT',
										amount: data.amount || '0',
										timestamp: data.timestamp || Math.floor(Date.now() / 1000),
										status: data.status || 'confirmed',
										from: data.from,
										to: data.to,
									}
									callback(transaction)
								}
							} catch (error) {
								console.error('Error processing transaction data:', error)
							}
						},
						onError: (error: any) => {
							console.error('Error in transaction stream:', error)
						},
					})

					if (subscription && subscription.unsubscribe) {
						sdkUnsubscribe = subscription.unsubscribe
						this.sdkSubscriptions.set(streamId, { unsubscribe: sdkUnsubscribe })
						console.log(`Subscribed to transactions for ${walletAddress}`)
					}
				} catch (error) {
					console.error('Failed to subscribe to transactions via SDK:', error)
				}
			})
			.catch((error) => {
				console.error('Failed to initialize SDK for transactions:', error)
			})

		this.subscriptions.set(streamId, { unsubscribe })
		return unsubscribe
	}

	subscribeToYieldPositions(
		walletAddress: string,
		callback: StreamCallback<YieldPosition[]>
	): StreamUnsubscribe {
		const streamId = `wallet:${walletAddress}:yield`
		
		let sdkUnsubscribe: (() => void) | null = null

		const unsubscribe = () => {
			if (sdkUnsubscribe) {
				try {
					sdkUnsubscribe()
				} catch (error) {
					console.error('Error unsubscribing from SDK:', error)
				}
				sdkUnsubscribe = null
			}
			this.sdkSubscriptions.delete(streamId)
			this.subscriptions.delete(streamId)
		}

		this.ensureInitialized()
			.then(async () => {
				if (!this.sdk || !this.sdk.streams) {
					console.warn('SDK not initialized, using mock data')
					return
				}

				try {
					const subscription = await this.sdk.streams.subscribe({
						somniaStreamsEventId: undefined,
						ethCalls: [],
						context: `wallet-yield-${walletAddress}`,
						onlyPushChanges: false,
						onData: (data: any) => {
							try {
								// Use transformation layer
								const positions = transformToYieldPosition(data)
								if (positions.length > 0) {
									callback(positions)
								}
							} catch (error) {
								console.error('Error processing yield position data:', error)
							}
						},
						onError: (error: any) => {
							console.error('Error in yield position stream:', error)
						},
					})

					if (subscription && subscription.unsubscribe) {
						sdkUnsubscribe = subscription.unsubscribe
						this.sdkSubscriptions.set(streamId, { unsubscribe: sdkUnsubscribe })
						console.log(`Subscribed to yield positions for ${walletAddress}`)
					}
				} catch (error) {
					console.error('Failed to subscribe to yield positions via SDK:', error)
				}
			})
			.catch((error) => {
				console.error('Failed to initialize SDK for yield positions:', error)
			})

		this.subscriptions.set(streamId, { unsubscribe })
		return unsubscribe
	}

	disconnect(): void {
		for (const [streamId, subscription] of this.sdkSubscriptions.entries()) {
			try {
				subscription.unsubscribe()
			} catch (error) {
				console.error(`Error unsubscribing from SDK subscription ${streamId}:`, error)
			}
		}
		this.sdkSubscriptions.clear()
		this.subscriptions.clear()
		this.sdk = null
		this.isInitialized = false
	}

	isConnected(): boolean {
		return this.isInitialized && this.sdk !== null
	}

	async connect(): Promise<void> {
		await this.initialize()
	}
}

const getRpcUrl = (): string => {
	const envRpcUrl = import.meta.env.VITE_SOMNIA_RPC_URL
	if (envRpcUrl) {
		return envRpcUrl
	}
	return 'https://dream-rpc.somnia.network'
}

const getWsUrl = (): string => {
	const envWsUrl = import.meta.env.VITE_SOMNIA_WS_URL
	if (envWsUrl) {
		return envWsUrl
	}
	return 'wss://dream-rpc.somnia.network/ws'
}

export const somniaStreams = new SomniaDataStreams(getRpcUrl(), getWsUrl())
