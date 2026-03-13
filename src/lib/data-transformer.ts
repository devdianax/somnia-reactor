/**
 * Data transformation layer to convert Somnia SDK data to our app's data structures
 */

import { formatEther, isAddress, formatUnits } from 'viem'
import { TokenBalance, Transaction, YieldPosition, PriceUpdate } from './somnia-sdk'

/**
 * Transform raw blockchain event to Transaction format
 */
export function transformBlockchainEventToTransaction(event: any): Transaction | null {
	if (!event || !event.result) {
		return null
	}

	const result = event.result
	const topics = result.topics || []
	
	// Extract transaction hash - check multiple possible locations
	const txHash = result.transactionHash 
		|| result.hash 
		|| result.txHash
		|| (event.subscription && typeof event.subscription === 'object' ? event.subscription.transactionHash : null)
		|| ''
	
	// Extract addresses from topics (first topic is usually the event signature)
	// Topics[1] and topics[2] are often addresses
	let fromAddress = ''
	let toAddress = ''
	
	if (topics.length > 1) {
		// Try to extract addresses from topics
		const topic1 = topics[1]
		const topic2 = topics.length > 2 ? topics[2] : null
		
		if (topic1 && typeof topic1 === 'string' && topic1.startsWith('0x')) {
			// Check if it's a valid address (42 chars)
			if (topic1.length === 66) {
				// It's a 32-byte value, might contain an address
				// Address is usually in the last 20 bytes (last 40 hex chars + 0x)
				const possibleAddress = '0x' + topic1.slice(-40)
				if (isAddress(possibleAddress)) {
					fromAddress = possibleAddress
				}
			} else if (isAddress(topic1)) {
				fromAddress = topic1
			}
		}
		
		if (topic2 && typeof topic2 === 'string' && topic2.startsWith('0x')) {
			if (topic2.length === 66) {
				const possibleAddress = '0x' + topic2.slice(-40)
				if (isAddress(possibleAddress)) {
					toAddress = possibleAddress
				}
			} else if (isAddress(topic2)) {
				toAddress = topic2
			}
		}
	}
	
	// Extract amount from data if available
	let amount = '+0.00'
	if (result.data && result.data !== '0x' && result.data.length > 2) {
		try {
			// Try to parse amount from data (usually in wei, last 32 bytes)
			// Data format: 0x + 64 hex chars (32 bytes)
			if (result.data.length >= 66) {
				const dataValue = BigInt(result.data)
				if (dataValue > 0n) {
					const etherValue = parseFloat(formatEther(dataValue))
					if (etherValue > 0.000001) { // Only show if significant
						amount = `+${etherValue.toFixed(4)}`
					}
				}
			}
		} catch {
			// Ignore parsing errors
		}
	}
	
	// If no hash, skip this transaction (it's not useful without a hash)
	if (!txHash || !txHash.trim() || txHash === '0x') {
		return null
	}
	
	// Determine transaction type based on event signature or addresses
	let txType: Transaction['type'] = 'Received'
	if (result.address) {
		// Could determine type from contract address or event signature
		// For now, default to Received
	}

	return {
		hash: txHash,
		type: txType,
		token: 'STT', // Default, could be determined from contract
		amount,
		timestamp: Math.floor(Date.now() / 1000),
		status: 'confirmed',
		from: fromAddress || undefined,
		to: toAddress || undefined,
	}
}

/**
 * Transform balance data to TokenBalance format
 */
export function transformToTokenBalance(
	data: any,
	walletAddress: string,
	defaultSymbol: string = 'STT'
): TokenBalance[] {
	if (Array.isArray(data)) {
		return data.map((item) => transformSingleBalance(item, walletAddress, defaultSymbol))
	}
	
	if (data && typeof data === 'object') {
		return [transformSingleBalance(data, walletAddress, defaultSymbol)]
	}
	
	return []
}

function transformSingleBalance(
	item: any,
	walletAddress: string,
	defaultSymbol: string
): TokenBalance {
	// Handle different balance formats
	let balance = '0'
	let balanceRaw = 0n
	
	if (item.balanceRaw) {
		balanceRaw = BigInt(item.balanceRaw)
		balance = formatEther(balanceRaw)
	} else if (item.balance) {
		if (typeof item.balance === 'string') {
			balance = item.balance
		} else if (typeof item.balance === 'bigint' || typeof item.balance === 'number') {
			balanceRaw = BigInt(item.balance)
			balance = formatEther(balanceRaw)
		}
	}
	
	// Calculate value if not provided
	let value = item.value
	if (!value && balance !== '0') {
		const price = parseFloat(item.price?.replace(/[^0-9.-]/g, '') || '1')
		const balanceNum = parseFloat(balance)
		value = `$${(balanceNum * price).toFixed(2)}`
	}
	
	return {
		address: item.address || walletAddress,
		symbol: item.symbol || defaultSymbol,
		name: item.name || `${defaultSymbol} Token`,
		balance: parseFloat(balance).toLocaleString('en-US', { maximumFractionDigits: 6 }),
		value: value || '$0.00',
		price: item.price || '$1.00',
		change24h: item.change24h || 0,
		decimals: item.decimals || 18,
	}
}

/**
 * Transform price data to PriceUpdate format
 */
export function transformToPriceUpdate(data: any, tokenAddress: string): PriceUpdate | null {
	if (!data || typeof data !== 'object') {
		return null
	}
	
	return {
		token: tokenAddress,
		symbol: data.symbol || 'TOKEN',
		price: data.price || '$0.00',
		change24h: data.change24h || 0,
		timestamp: data.timestamp || Math.floor(Date.now() / 1000),
	}
}

/**
 * Transform yield position data
 */
export function transformToYieldPosition(data: any): YieldPosition[] {
	if (Array.isArray(data)) {
		return data.map((item) => transformSingleYieldPosition(item))
	}
	
	if (data && typeof data === 'object') {
		return [transformSingleYieldPosition(data)]
	}
	
	return []
}

/**
 * Extract protocol name from contract address or data
 */
function extractProtocolName(item: any): string {
	// If protocol is explicitly provided, use it
	if (item.protocol && item.protocol !== 'Unknown') {
		return item.protocol
	}

	// Try to extract from contract address or event data
	const contractAddress = item.contractAddress || item.address || item.contract || ''
	
	// Common protocol patterns in contract addresses (you can expand this)
	const protocolPatterns: Record<string, string> = {
		'curve': 'Curve Finance',
		'uniswap': 'Uniswap',
		'balancer': 'Balancer',
		'yearn': 'Yearn Finance',
		'aave': 'Aave',
		'compound': 'Compound',
		'sushiswap': 'SushiSwap',
	}

	const addressLower = contractAddress.toLowerCase()
	for (const [pattern, protocol] of Object.entries(protocolPatterns)) {
		if (addressLower.includes(pattern)) {
			return protocol
		}
	}

	// Try to extract from event topics or logs
	if (item.topics && Array.isArray(item.topics)) {
		// Check if topics contain protocol identifiers
		for (const topic of item.topics) {
			if (typeof topic === 'string') {
				const topicLower = topic.toLowerCase()
				for (const [pattern, protocol] of Object.entries(protocolPatterns)) {
					if (topicLower.includes(pattern)) {
						return protocol
					}
				}
			}
		}
	}

	// If we have a contract address, try to derive a name from it
	if (contractAddress && contractAddress !== '0x' && contractAddress.length > 10) {
		// Use first 6 chars of address as identifier
		const shortAddr = contractAddress.slice(0, 8)
		return `Pool ${shortAddr}`
	}

	return 'Unknown'
}

function transformSingleYieldPosition(item: any): YieldPosition {
	const protocol = extractProtocolName(item)
	
	// Try to get contract address from various possible fields
	const contractAddress = item.contractAddress 
		|| item.address 
		|| item.contract 
		|| (item.result && item.result.address)
		|| ''
	
	// If we have a contract address but protocol is still Unknown, use a better name
	let finalProtocol = protocol
	if (protocol === 'Unknown' && contractAddress && contractAddress.length > 10) {
		// Use a more descriptive name based on contract address
		const shortAddr = contractAddress.slice(2, 8).toUpperCase()
		finalProtocol = `Staking Pool (${shortAddr})`
	} else if (protocol === 'Unknown') {
		// If no contract address, try to infer from token symbol
		const tokenSymbol = (item.token || item.symbol || '').toUpperCase()
		if (tokenSymbol && tokenSymbol !== 'STT') {
			finalProtocol = `${tokenSymbol} Staking`
		} else {
			finalProtocol = 'Staking Position'
		}
	}
	
	return {
		protocol: finalProtocol,
		token: item.token || item.symbol || 'STT',
		deposited: item.deposited || item.amount || '$0.00',
		apy: item.apy || item.apyPercent || '0%',
		earned: item.earned || item.rewards || '$0.00',
		dailyRewards: item.dailyRewards || item.dailyReward || '$0.00',
		contractAddress,
	}
}

/**
 * Check if data is a blockchain event
 */
export function isBlockchainEvent(data: any): boolean {
	return data && typeof data === 'object' && 'result' in data && data.result
}

/**
 * Check if data is balance data
 */
export function isBalanceData(data: any): boolean {
	return data && typeof data === 'object' && ('balance' in data || 'balanceRaw' in data || 'address' in data)
}

/**
 * Check if data is price data
 */
export function isPriceData(data: any): boolean {
	return data && typeof data === 'object' && ('price' in data || 'symbol' in data)
}

