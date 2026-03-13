import { createPublicClient, createWalletClient, http, webSocket } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { somniaTestnet } from './wagmi-config'
import { SDK } from '@somnia-chain/reactivity'

// The Somnia Reactivity Precompile Address for system events
export const SOMNIA_REACTIVITY_PRECOMPILE_ADDRESS = '0x0000000000000000000000000000000000000100'

export interface BlockTickData {
	blockNumber: bigint
	timestamp: number
}

type BlockTickCallback = (data: BlockTickData) => void

class SomniaReactorSDK {
	private sdk: SDK | null = null
	private isInitialized = false
	private subscriptions: Set<() => void> = new Set()

	async initialize(): Promise<void> {
		if (this.isInitialized && this.sdk) {
			return
		}

		try {
			const wsUrl = import.meta.env.VITE_SOMNIA_WS_URL || 'wss://dream-rpc.somnia.network/ws'
			const rpcUrl = import.meta.env.VITE_SOMNIA_RPC_URL || 'https://dream-rpc.somnia.network'

			const publicClient = createPublicClient({
				chain: somniaTestnet,
				transport: webSocket(wsUrl),
			})

			// Dummy account for initialization, similar to somnia-sdk.ts
			const dummyAccount = privateKeyToAccount('0x0000000000000000000000000000000000000000000000000000000000000001' as `0x${string}`)
			const walletClient = createWalletClient({
				chain: somniaTestnet,
				account: dummyAccount,
				transport: http(rpcUrl),
			})

			this.sdk = new SDK({
				// @ts-expect-error - Type compatibility issue between viem and SDK types due to peer deps
				public: publicClient,
				// @ts-expect-error
				wallet: walletClient,
			})

			this.isInitialized = true
			console.log('Somnia Reactor (Reactivity) SDK initialized successfully')
		} catch (error) {
			console.error('Failed to initialize Somnia Reactor SDK:', error)
			throw error
		}
	}

	async subscribeToBlockTick(callback: BlockTickCallback): Promise<() => void> {
		await this.initialize()

		if (!this.sdk) {
			throw new Error('SDK not initialized')
		}

		try {
			const subscription = await this.sdk.subscribe({
				eventContractSources: [SOMNIA_REACTIVITY_PRECOMPILE_ADDRESS as `0x${string}`],
				ethCalls: [],
				onlyPushChanges: false,
				onData: (data: any) => {
					// Transform raw event data to BlockTickData
					// From types: SubscriptionCallback has result: { topics, data, simulationResults }
					const result = data.result || data;
					const topics = result.topics || [];
					const eventData = result.data || '0x';
					
					// BlockTick(uint64 blockNumber)
					// If blockNumber is not in topics, it's in data
					let blockNumber = BigInt(0);
					try {
						if (topics.length > 1) {
							// For indexed params
							blockNumber = BigInt(topics[1]);
						} else if (eventData !== '0x') {
							// For non-indexed params
							blockNumber = BigInt(eventData);
						}
					} catch (e) {
						blockNumber = BigInt(Math.floor(Date.now() / 1000));
					}

					callback({
						blockNumber,
						timestamp: Math.floor(Date.now() / 1000),
					})
				},
				onError: (error: any) => {
					console.error('BlockTick subscription error:', error)
				},
			})

			const unsubscribe = () => {
				if (subscription && typeof subscription.unsubscribe === 'function') {
					subscription.unsubscribe()
				}
				this.subscriptions.delete(unsubscribe)
			}

			this.subscriptions.add(unsubscribe)
			return unsubscribe
		} catch (error) {
			console.error('Failed to subscribe to BlockTick:', error)
			throw error
		}
	}

	disconnect(): void {
		this.subscriptions.forEach((unsub) => unsub())
		this.subscriptions.clear()
		this.sdk = null
		this.isInitialized = false
	}
}

export const somniaReactor = new SomniaReactorSDK()
