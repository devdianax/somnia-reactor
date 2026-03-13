/**
 * Test script to verify Somnia testnet connection and data fetching
 * Run with: npx tsx scripts/test-somnia-connection.ts
 */

import { createPublicClient, http, formatEther } from 'viem'
import { defineChain } from 'viem'

// Define Somnia Testnet chain
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
	blockExplorers: {
		default: {
			name: 'Shannon Explorer',
			url: 'https://shannon-explorer.somnia.network',
		},
	},
	testnet: true,
})

const RPC_URL = 'https://dream-rpc.somnia.network'

async function testRpcConnection() {
	console.log('🔍 Testing RPC Connection...')
	console.log(`RPC URL: ${RPC_URL}\n`)

	try {
		const publicClient = createPublicClient({
			chain: somniaTestnet,
			transport: http(RPC_URL),
		})

		// Test 1: Get latest block
		console.log('Test 1: Fetching latest block...')
		const blockNumber = await publicClient.getBlockNumber()
		console.log(`✅ Latest block number: ${blockNumber}\n`)

		// Test 2: Get block details
		console.log('Test 2: Fetching block details...')
		const block = await publicClient.getBlock({ blockNumber })
		console.log(`✅ Block hash: ${block.hash}`)
		console.log(`✅ Block timestamp: ${new Date(Number(block.timestamp) * 1000).toISOString()}\n`)

		// Test 3: Get balance for a test address
		console.log('Test 3: Fetching balance for test address...')
		const testAddress = '0x0000000000000000000000000000000000000001' as `0x${string}`
		const balance = await publicClient.getBalance({ address: testAddress })
		const balanceInEther = formatEther(balance)
		console.log(`✅ Balance for ${testAddress}: ${balanceInEther} STT\n`)

		// Test 4: Test SDK import
		console.log('Test 4: Testing @somnia-chain/streams SDK import...')
		try {
			const sdkModule = await import('@somnia-chain/streams')
			console.log('✅ SDK module loaded successfully')
			console.log(`✅ SDK exports: ${Object.keys(sdkModule).join(', ')}\n`)

			// Test 5: Initialize SDK
			if (sdkModule.SDK) {
				console.log('Test 5: Initializing SDK...')
				const { createWalletClient } = await import('viem')
				const { privateKeyToAccount } = await import('viem/accounts')

				const dummyAccount = privateKeyToAccount(
					'0x0000000000000000000000000000000000000000000000000000000000000001' as `0x${string}`
				)

				const walletClient = createWalletClient({
					chain: somniaTestnet,
					account: dummyAccount,
					transport: http(RPC_URL),
				})

				const sdk = new sdkModule.SDK({
					public: publicClient,
					wallet: walletClient,
				})

				console.log('✅ SDK initialized successfully\n')

				// Test 6: Inspect SDK structure
				console.log('Test 6: Inspecting SDK structure...')
				try {
					const sdkPrototype = Object.getPrototypeOf(sdk)
					const sdkMethods = Object.getOwnPropertyNames(sdkPrototype)
					const sdkProperties = Object.getOwnPropertyNames(sdk)
					
					console.log(`✅ SDK prototype methods: ${sdkMethods.filter(m => m !== 'constructor').join(', ') || 'none'}`)
					console.log(`✅ SDK instance properties: ${sdkProperties.filter(p => typeof sdk[p] === 'function').join(', ') || 'none'}`)
					
					// Try to find common stream methods
					const possibleMethods = ['subscribe', 'watch', 'on', 'listen', 'stream', 'getBalance', 'getBalances', 'watchBalance', 'watchBalances']
					const foundMethods = possibleMethods.filter(m => 
						typeof sdk[m] === 'function' || 
						sdkMethods.includes(m) || 
						sdkProperties.includes(m)
					)
					
					if (foundMethods.length > 0) {
						console.log(`✅ Found potential stream methods: ${foundMethods.join(', ')}`)
					} else {
						console.log('⚠️  No common stream methods found')
					}
					
					// Inspect the streams property
					if (sdk.streams) {
						console.log('\n📡 Inspecting SDK.streams...')
						const streamsKeys = Object.keys(sdk.streams)
						const streamsMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(sdk.streams))
						
						console.log(`✅ streams properties: ${streamsKeys.join(', ') || 'none'}`)
						console.log(`✅ streams methods: ${streamsMethods.filter(m => m !== 'constructor').join(', ') || 'none'}`)
						
						// Try to find balance/price/transaction methods
						const streamMethods = ['balance', 'balances', 'price', 'prices', 'transaction', 'transactions', 'watch', 'subscribe', 'get']
						const foundStreamMethods = streamMethods.filter(m => 
							typeof sdk.streams[m] === 'function' ||
							streamsKeys.includes(m) ||
							streamsMethods.includes(m)
						)
						
						if (foundStreamMethods.length > 0) {
							console.log(`✅ Found stream methods: ${foundStreamMethods.join(', ')}`)
						}
						
						// Log streams structure
						console.log('\n📋 Streams structure:')
						console.log(JSON.stringify({
							keys: streamsKeys,
							methods: streamsMethods.filter(m => m !== 'constructor'),
							sample: streamsKeys.slice(0, 10).reduce((acc, key) => {
								acc[key] = typeof sdk.streams[key]
								return acc
							}, {} as Record<string, string>)
						}, null, 2))
					}
					
					// Log full SDK structure for debugging
					console.log('\n📋 Full SDK structure:')
					console.log(JSON.stringify({
						methods: sdkMethods,
						properties: sdkProperties,
						keys: Object.keys(sdk)
					}, null, 2))
				} catch (error) {
					console.log(`⚠️  SDK inspection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
				}

				return { success: true, sdk }
			} else {
				console.log('⚠️  SDK class not found in module')
				return { success: false, error: 'SDK class not found' }
			}
		} catch (error) {
			console.error('❌ Failed to import SDK:', error)
			return { success: false, error }
		}
	} catch (error) {
		console.error('❌ RPC Connection failed:', error)
		if (error instanceof Error) {
			console.error(`Error message: ${error.message}`)
			console.error(`Error stack: ${error.stack}`)
		}
		return { success: false, error }
	}
}

async function testSomniaDataStreams() {
	console.log('\n📡 Testing Somnia Data Streams...\n')

	try {
		// Try to use the SDK to fetch data streams
		const sdkModule = await import('@somnia-chain/streams')
		
		if (!sdkModule.SDK) {
			console.log('❌ SDK class not available')
			return { success: false }
		}

		console.log('✅ Data Streams SDK is available')
		console.log('Note: Full stream testing requires active wallet connection\n')
		
		return { success: true }
	} catch (error) {
		console.error('❌ Data Streams test failed:', error)
		return { success: false, error }
	}
}

async function main() {
	console.log('🚀 Starting Somnia Testnet Connection Tests\n')
	console.log('=' .repeat(50))
	console.log()

	const rpcResult = await testRpcConnection()
	
	console.log('=' .repeat(50))
	console.log()

	const streamsResult = await testSomniaDataStreams()

	console.log('=' .repeat(50))
	console.log('\n📊 Test Summary:')
	console.log(`RPC Connection: ${rpcResult.success ? '✅ PASSED' : '❌ FAILED'}`)
	console.log(`Data Streams: ${streamsResult.success ? '✅ PASSED' : '❌ FAILED'}`)
	
	if (rpcResult.error) {
		console.log(`\nError details: ${rpcResult.error}`)
	}

	console.log('\n✨ Tests completed!\n')
	
	process.exit(rpcResult.success && streamsResult.success ? 0 : 1)
}

main().catch((error) => {
	console.error('Fatal error:', error)
	process.exit(1)
})

