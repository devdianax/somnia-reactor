/**
 * Test script based on working example - verify Somnia SDK subscription functionality
 * Run with: npx tsx scripts/test-somnia-subscribe-working.ts
 */

import { SDK } from '@somnia-chain/streams'
import { createPublicClient, createWalletClient, http, webSocket } from 'viem'
import { defineChain } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

// Somnia Testnet configuration
const SOMNIA_TESTNET_RPC_URL = process.env.VITE_SOMNIA_RPC_URL || 'https://dream-rpc.somnia.network'
const SOMNIA_TESTNET_WS_URL = process.env.VITE_SOMNIA_WS_URL || 'wss://dream-rpc.somnia.network/ws'

const somniaTestnet = defineChain({
	id: 50312,
	name: 'Somnia Testnet',
	network: 'somnia-testnet',
	nativeCurrency: {
		name: 'Somnia Testnet Token',
		symbol: 'STT',
		decimals: 18,
	},
	rpcUrls: {
		default: {
			http: [SOMNIA_TESTNET_RPC_URL],
			webSocket: [SOMNIA_TESTNET_WS_URL],
		},
		public: {
			http: [SOMNIA_TESTNET_RPC_URL],
			webSocket: [SOMNIA_TESTNET_WS_URL],
		},
	},
	blockExplorers: {
		default: {
			name: 'Somnia Explorer',
			url: 'https://somnia-testnet.socialscan.io',
		},
	},
	testnet: true,
})

// Helper function to analyze payload structure
function analyzePayload(payload: any) {
	if (!payload || typeof payload !== 'object') {
		return { type: 'unknown', structure: 'not an object' }
	}

	// Check if it's a raw blockchain event
	if ('subscription' in payload && 'result' in payload) {
		return {
			type: 'blockchainEvent',
			structure: 'raw blockchain log',
			hasAddress: !!payload.result?.address,
			hasTopics: Array.isArray(payload.result?.topics),
			hasData: !!payload.result?.data,
		}
	}

	// Check if it's an array
	if (Array.isArray(payload)) {
		return {
			type: 'array',
			length: payload.length,
			firstItemType: payload[0] ? analyzePayload(payload[0]).type : 'empty',
		}
	}

	// Generic object
	return {
		type: 'object',
		keys: Object.keys(payload),
		structure: 'generic object',
	}
}

async function testSomniaStreams() {
	console.log('🧪 Testing Somnia Data Streams Connection...\n')
	console.log('Configuration:')
	console.log(`  RPC URL: ${SOMNIA_TESTNET_RPC_URL}`)
	console.log(`  WebSocket URL: ${SOMNIA_TESTNET_WS_URL}\n`)

	try {
		// Test 1: Create public client with WebSocket
		console.log('📡 Step 1: Creating public client with WebSocket transport...')
		let publicClient

		try {
			publicClient = createPublicClient({
				chain: somniaTestnet,
				transport: webSocket(SOMNIA_TESTNET_WS_URL),
			})
			console.log('✅ Public client created successfully\n')
		} catch (error: any) {
			console.error('❌ Failed to create public client:', error.message)
			console.log('\n💡 Trying with HTTP transport instead...')
			publicClient = createPublicClient({
				chain: somniaTestnet,
				transport: http(SOMNIA_TESTNET_RPC_URL),
			})
			console.log('✅ Public client created with HTTP (may not work for subscriptions)\n')
		}

		// Test 2: Initialize SDK
		console.log('🔧 Step 2: Initializing Somnia SDK...')
		const sdk = new SDK({
			public: publicClient,
			// No wallet needed for read-only subscriptions
		})
		console.log('✅ SDK initialized successfully\n')

		// Track received payloads
		const receivedPayloads: any[] = []
		let blockchainEventCount = 0

		// Test 3: Test subscription without event ID (general stream)
		console.log('📥 Step 3: Testing subscription to general stream...')
		console.log('   (This will test if WebSocket connection works)\n')

		const subscription = await sdk.streams.subscribe({
			somniaStreamsEventId: undefined, // No specific event ID - subscribe to all
			ethCalls: [],
			context: 'test',
			onlyPushChanges: false,
			onData: (payload: any) => {
				const analysis = analyzePayload(payload)
				receivedPayloads.push(analysis)

				if (analysis.type === 'blockchainEvent') {
					blockchainEventCount++
					// Only log first few to avoid spam
					if (blockchainEventCount <= 3) {
						console.log(`📨 Blockchain Event (${blockchainEventCount}):`, {
							address: payload.result?.address,
							topicsCount: payload.result?.topics?.length || 0,
						})
					}
				} else if (analysis.type === 'array') {
					console.log(`📦 Array Received:`, {
						length: analysis.length,
						firstItemType: analysis.firstItemType,
					})
				} else {
					console.log(`📨 Payload Received:`, {
						type: analysis.type,
						keys: analysis.keys || 'N/A',
					})
				}
			},
			onError: (error: any) => {
				console.error('❌ Stream error:', error.message || error)
			},
		})

		if (subscription) {
			console.log(`✅ Subscription created successfully!`)
			console.log(`   Subscription ID: ${subscription.subscriptionId}\n`)
			console.log('⏳ Waiting for data (will timeout after 10 seconds)...\n')

			// Wait for data
			await new Promise((resolve) => setTimeout(resolve, 10000))

			// Summary
			console.log('\n📊 Summary:')
			console.log(`   Total payloads received: ${receivedPayloads.length}`)
			console.log(`   Blockchain Events (raw data): ${blockchainEventCount}`)
			console.log(`   Other payloads: ${receivedPayloads.length - blockchainEventCount}`)

			if (receivedPayloads.length > 0) {
				console.log('\n✅ SUCCESS: Received data from Somnia streams!')
				console.log('   The SDK is working correctly.\n')
			} else {
				console.log('\n⚠️  WARNING: No data received in 10 seconds.')
				console.log('   This might be normal if there are no active events.')
				console.log('   The subscription was created successfully though.\n')
			}

			// Cleanup
			console.log('🧹 Cleaning up subscription...')
			subscription.unsubscribe()
			console.log('✅ Subscription unsubscribed\n')
		} else {
			console.error('❌ Subscription returned null/undefined\n')
		}

		console.log('✅ All tests completed!\n')
	} catch (error: any) {
		console.error('\n❌ Test failed with error:')
		console.error(error.message || error)
		if (error.stack) {
			console.error('\nStack trace:')
			console.error(error.stack)
		}
		process.exit(1)
	}
}

// Run the test
testSomniaStreams()
	.then(() => {
		console.log('✨ Test script finished')
		process.exit(0)
	})
	.catch((error) => {
		console.error('💥 Fatal error:', error)
		process.exit(1)
	})

