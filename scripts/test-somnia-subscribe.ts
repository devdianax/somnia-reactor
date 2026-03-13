/**
 * Test script to verify Somnia SDK subscription functionality
 * Run with: npx tsx scripts/test-somnia-subscribe.ts
 */

import { createPublicClient, createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { defineChain } from 'viem'

const somniaTestnet = defineChain({
	id: 50312,
	name: 'Somnia Testnet',
	nativeCurrency: {
		decimals: 18,
		name: 'STT',
		symbol: 'STT',
	},
	rpcUrls: {
		default: {
			http: ['https://dream-rpc.somnia.network'],
		},
	},
	testnet: true,
})

const RPC_URL = 'https://dream-rpc.somnia.network'

async function testSubscription() {
	console.log('🚀 Testing Somnia SDK Subscription\n')
	console.log('=' .repeat(50))
	console.log()

	try {
		// Initialize clients
		const publicClient = createPublicClient({
			chain: somniaTestnet,
			transport: http(RPC_URL),
		})

		const dummyAccount = privateKeyToAccount(
			'0x0000000000000000000000000000000000000000000000000000000000000001' as `0x${string}`
		)

		const walletClient = createWalletClient({
			chain: somniaTestnet,
			account: dummyAccount,
			transport: http(RPC_URL),
		})

		// Import and initialize SDK
		console.log('📦 Loading SDK...')
		const { SDK } = await import('@somnia-chain/streams')
		
		const sdk = new SDK({
			public: publicClient,
			wallet: walletClient,
		})

		console.log('✅ SDK initialized\n')

		// Inspect streams API
		console.log('📡 Inspecting streams API...')
		console.log(`Available methods: ${Object.keys(sdk.streams).filter(k => typeof sdk.streams[k] === 'function').join(', ')}\n`)

		// Test subscription method signature
		if (typeof sdk.streams.subscribe === 'function') {
			console.log('✅ subscribe method found')
			console.log(`subscribe function length (params): ${sdk.streams.subscribe.length}\n`)

			// Try to get available schemas first
			try {
				if (typeof sdk.streams.getAllSchemas === 'function') {
					console.log('📋 Fetching available schemas...')
					const schemas = await sdk.streams.getAllSchemas()
					console.log(`✅ Found ${Array.isArray(schemas) ? schemas.length : 'unknown'} schemas`)
					if (Array.isArray(schemas) && schemas.length > 0) {
						console.log(`Sample schemas: ${schemas.slice(0, 3).map((s: any) => s?.name || s?.id || JSON.stringify(s).slice(0, 50)).join(', ')}\n`)
					}
				}
			} catch (error) {
				console.log(`⚠️  Could not fetch schemas: ${error instanceof Error ? error.message : 'Unknown error'}\n`)
			}

			// Test subscription with a test address
			const testAddress = '0x0000000000000000000000000000000000000001' as `0x${string}`
			console.log(`🔔 Testing subscription for address: ${testAddress}`)
			
			try {
				// Try different subscription patterns
				console.log('\nAttempting subscription patterns...\n')

				// Pattern 1: Direct subscribe call
				console.log('Pattern 1: Direct subscribe...')
				try {
					const unsubscribe1 = sdk.streams.subscribe(
						'balance', // or schema name
						testAddress,
						(data: any) => {
							console.log('✅ Received data:', data)
						}
					)
					if (unsubscribe1) {
						console.log('✅ Subscription created (Pattern 1)')
						if (typeof unsubscribe1 === 'function') {
							unsubscribe1()
							console.log('✅ Unsubscribed (Pattern 1)')
						}
					}
				} catch (error) {
					console.log(`❌ Pattern 1 failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
				}

				// Pattern 2: Subscribe with options
				console.log('\nPattern 2: Subscribe with options...')
				try {
					const unsubscribe2 = sdk.streams.subscribe(
						{ schema: 'balance', address: testAddress },
						(data: any) => {
							console.log('✅ Received data:', data)
						}
					)
					if (unsubscribe2) {
						console.log('✅ Subscription created (Pattern 2)')
						if (typeof unsubscribe2 === 'function') {
							unsubscribe2()
							console.log('✅ Unsubscribed (Pattern 2)')
						}
					}
				} catch (error) {
					console.log(`❌ Pattern 2 failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
				}

				// Pattern 3: Subscribe with schema ID
				console.log('\nPattern 3: Subscribe with schema lookup...')
				try {
					// Try to get a schema first
					if (typeof sdk.streams.getAllSchemas === 'function') {
						const schemas = await sdk.streams.getAllSchemas()
						if (Array.isArray(schemas) && schemas.length > 0) {
							const firstSchema = schemas[0]
							const schemaId = firstSchema?.id || firstSchema?.schemaId || firstSchema
							
							const unsubscribe3 = sdk.streams.subscribe(
								schemaId,
								(data: any) => {
									console.log('✅ Received data:', data)
								}
							)
							if (unsubscribe3) {
								console.log('✅ Subscription created (Pattern 3)')
								if (typeof unsubscribe3 === 'function') {
									unsubscribe3()
									console.log('✅ Unsubscribed (Pattern 3)')
								}
							}
						}
					}
				} catch (error) {
					console.log(`❌ Pattern 3 failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
				}

			} catch (error) {
				console.error(`❌ Subscription test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
				if (error instanceof Error && error.stack) {
					console.error(`Stack: ${error.stack}`)
				}
			}
		} else {
			console.log('❌ subscribe method not found')
		}

		console.log('\n' + '='.repeat(50))
		console.log('✨ Subscription test completed!\n')

	} catch (error) {
		console.error('❌ Fatal error:', error)
		if (error instanceof Error && error.stack) {
			console.error(`Stack: ${error.stack}`)
		}
		process.exit(1)
	}
}

testSubscription()

