/**
 * Test script to fetch real data from Somnia and test transformation layer
 * Run with: npx tsx scripts/test-real-data-transformation.ts
 */

import { SDK } from '@somnia-chain/streams'
import { createPublicClient, createWalletClient, http, webSocket, formatEther } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { defineChain } from 'viem'

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
	testnet: true,
})

// Test wallet address (you can change this)
const TEST_WALLET = '0x0000000000000000000000000000000000000001' as `0x${string}`

// Data transformation functions
function transformBalanceData(rawData: any, walletAddress: string) {
	// Handle different data formats from SDK
	if (Array.isArray(rawData)) {
		return rawData.map((item: any) => ({
			address: item.address || walletAddress,
			symbol: item.symbol || 'STT',
			name: item.name || 'Token',
			balance: item.balance || formatEther(BigInt(item.balanceRaw || 0)),
			value: item.value || `$${parseFloat(formatEther(BigInt(item.balanceRaw || 0))).toFixed(2)}`,
			price: item.price || '$1.00',
			change24h: item.change24h || 0,
			decimals: item.decimals || 18,
		}))
	}
	
	// Single balance object
	if (rawData && typeof rawData === 'object') {
		return [{
			address: rawData.address || walletAddress,
			symbol: rawData.symbol || 'STT',
			name: rawData.name || 'Token',
			balance: rawData.balance || formatEther(BigInt(rawData.balanceRaw || 0)),
			value: rawData.value || `$${parseFloat(formatEther(BigInt(rawData.balanceRaw || 0))).toFixed(2)}`,
			price: rawData.price || '$1.00',
			change24h: rawData.change24h || 0,
			decimals: rawData.decimals || 18,
		}]
	}
	
	return []
}

function transformTransactionData(rawData: any) {
	// Handle blockchain event format
	if (rawData?.result) {
		// Raw blockchain log
		return {
			hash: rawData.result.transactionHash || rawData.result.hash || '',
			type: 'Received', // Default, could be determined from topics
			token: 'STT',
			amount: '+0.00',
			timestamp: Math.floor(Date.now() / 1000),
			status: 'confirmed',
			from: rawData.result.topics?.[1] || '',
			to: rawData.result.topics?.[2] || '',
		}
	}
	
	// Already formatted transaction
	if (rawData && typeof rawData === 'object') {
		return {
			hash: rawData.hash || rawData.txHash || '',
			type: rawData.type || 'Received',
			token: rawData.token || rawData.symbol || 'STT',
			amount: rawData.amount || '+0.00',
			timestamp: rawData.timestamp || Math.floor(Date.now() / 1000),
			status: rawData.status || 'confirmed',
			from: rawData.from,
			to: rawData.to,
		}
	}
	
	return null
}

function transformPriceData(rawData: any, tokenAddress: string) {
	if (rawData && typeof rawData === 'object') {
		return {
			token: tokenAddress,
			symbol: rawData.symbol || 'TOKEN',
			price: rawData.price || '$0.00',
			change24h: rawData.change24h || 0,
			timestamp: rawData.timestamp || Math.floor(Date.now() / 1000),
		}
	}
	
	return null
}

async function testRealDataFetching() {
	console.log('🧪 Testing Real Data Fetching and Transformation\n')
	console.log('='.repeat(60))
	console.log()

	try {
		// Initialize clients
		const publicClient = createPublicClient({
			chain: somniaTestnet,
			transport: webSocket(SOMNIA_TESTNET_WS_URL),
		})

		const dummyAccount = privateKeyToAccount(
			'0x0000000000000000000000000000000000000000000000000000000000000001' as `0x${string}`
		)

		const walletClient = createWalletClient({
			chain: somniaTestnet,
			account: dummyAccount,
			transport: http(SOMNIA_TESTNET_RPC_URL),
		})

		// Initialize SDK
		console.log('📦 Initializing SDK...')
		const sdk = new SDK({
			public: publicClient,
			wallet: walletClient,
		})
		console.log('✅ SDK initialized\n')

		// Test 1: Fetch real balance
		console.log('💰 Test 1: Fetching real wallet balance...')
		try {
			const balance = await publicClient.getBalance({ address: TEST_WALLET })
			const balanceInEther = formatEther(balance)
			console.log(`✅ Balance for ${TEST_WALLET}: ${balanceInEther} STT`)
			
			// Transform to our format
			const transformed = transformBalanceData({
				address: TEST_WALLET,
				symbol: 'STT',
				name: 'Somnia Test Token',
				balanceRaw: balance,
				price: '$1.00',
				change24h: 0,
				decimals: 18,
			}, TEST_WALLET)
			console.log('📊 Transformed balance data:')
			console.log(JSON.stringify(transformed, null, 2))
			console.log()
		} catch (error: any) {
			console.error('❌ Failed to fetch balance:', error.message)
		}

		// Test 2: Subscribe to real-time data and transform
		console.log('📡 Test 2: Subscribing to real-time data stream...')
		const receivedData: any[] = []
		
		const subscription = await sdk.streams.subscribe({
			somniaStreamsEventId: undefined,
			ethCalls: [],
			context: 'test-transformation',
			onlyPushChanges: false,
			onData: (payload: any) => {
				receivedData.push(payload)
				
				// Try to transform different data types
				if (payload?.result) {
					// Blockchain event
					const tx = transformTransactionData(payload)
					if (tx) {
						console.log('📨 Transformed Transaction:')
						console.log(JSON.stringify(tx, null, 2))
					}
				} else if (payload?.address || payload?.balance) {
					// Balance data
					const balances = transformBalanceData(payload, TEST_WALLET)
					if (balances.length > 0) {
						console.log('💰 Transformed Balance:')
						console.log(JSON.stringify(balances, null, 2))
					}
				} else {
					console.log('📦 Raw payload structure:')
					console.log(JSON.stringify({
						type: typeof payload,
						isArray: Array.isArray(payload),
						keys: typeof payload === 'object' ? Object.keys(payload) : [],
						sample: typeof payload === 'object' ? JSON.stringify(payload).slice(0, 200) : payload,
					}, null, 2))
				}
			},
			onError: (error: any) => {
				console.error('❌ Stream error:', error.message || error)
			},
		})

		if (subscription) {
			console.log(`✅ Subscription created (ID: ${subscription.subscriptionId})\n`)
			console.log('⏳ Collecting data for 10 seconds...\n')
			
			await new Promise((resolve) => setTimeout(resolve, 10000))
			
			console.log(`\n📊 Summary:`)
			console.log(`   Total payloads received: ${receivedData.length}`)
			console.log(`   Sample payloads: ${Math.min(3, receivedData.length)}`)
			
			// Show sample transformations
			if (receivedData.length > 0) {
				console.log('\n📋 Sample Transformations:')
				receivedData.slice(0, 3).forEach((data, idx) => {
					console.log(`\n   Payload ${idx + 1}:`)
					if (data?.result) {
						const tx = transformTransactionData(data)
						console.log(`   → Transaction: ${tx?.hash || 'N/A'}`)
					} else if (data?.address) {
						const balances = transformBalanceData(data, TEST_WALLET)
						console.log(`   → Balance: ${balances[0]?.symbol || 'N/A'} ${balances[0]?.balance || 'N/A'}`)
					}
				})
			}
			
			subscription.unsubscribe()
			console.log('\n✅ Subscription unsubscribed\n')
		}

		console.log('✅ All tests completed!\n')
	} catch (error: any) {
		console.error('\n❌ Test failed:', error.message || error)
		if (error.stack) {
			console.error('Stack:', error.stack)
		}
		process.exit(1)
	}
}

testRealDataFetching()
	.then(() => {
		console.log('✨ Test script finished')
		process.exit(0)
	})
	.catch((error) => {
		console.error('💥 Fatal error:', error)
		process.exit(1)
	})

