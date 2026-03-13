import { TokenBalance, Transaction, YieldPosition, PriceUpdate } from './somnia-sdk'

export const getMockTokenBalances = (walletAddress: string | null): TokenBalance[] => {
	if (!walletAddress) return []

	return [
		{
			address: '0x0000000000000000000000000000000000000000',
			symbol: 'STT',
			name: 'Somnia Test Token',
			balance: '125.50',
			value: '$125.50',
			price: '$1.00',
			change24h: 0.0,
			decimals: 18,
		},
		{
			address: '0x0000000000000000000000000000000000000001',
			symbol: 'ETH',
			name: 'Ethereum',
			balance: '0.025',
			value: '$45.00',
			price: '$1,800.00',
			change24h: 2.1,
			decimals: 18,
		},
		{
			address: '0x0000000000000000000000000000000000000002',
			symbol: 'USDC',
			name: 'USD Coin',
			balance: '87.25',
			value: '$87.25',
			price: '$1.00',
			change24h: 0.0,
			decimals: 6,
		},
	]
}

export const getMockTransactions = (walletAddress: string | null): Transaction[] => {
	if (!walletAddress) return []

	const now = Math.floor(Date.now() / 1000)

	return [
		{
			hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
			type: 'Received',
			token: 'STT',
			amount: '+25.50',
			timestamp: now - 120,
			status: 'confirmed',
			from: '0x0000000000000000000000000000000000000001',
			to: walletAddress,
		},
		{
			hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
			type: 'Sent',
			token: 'USDC',
			amount: '-12.50',
			timestamp: now - 3600,
			status: 'confirmed',
			from: walletAddress,
			to: '0x0000000000000000000000000000000000000002',
		},
		{
			hash: '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
			type: 'Received',
			token: 'ETH',
			amount: '+0.01',
			timestamp: now - 10800,
			status: 'confirmed',
			from: '0x0000000000000000000000000000000000000003',
			to: walletAddress,
		},
	]
}

export const getMockYieldPositions = (walletAddress: string | null): YieldPosition[] => {
	if (!walletAddress) return []

	return [
		{
			protocol: 'Aave',
			token: 'USDC',
			deposited: '$50.00',
			apy: '4.5%',
			earned: '$0.23',
			dailyRewards: '$0.01',
			contractAddress: '0x0000000000000000000000000000000000000004',
		},
	]
}

export const getMockPriceUpdates = (tokenAddresses: string[]): Map<string, PriceUpdate> => {
	const prices = new Map<string, PriceUpdate>()
	const now = Math.floor(Date.now() / 1000)

	const mockPrices: Record<string, { symbol: string; price: string; change24h: number }> = {
		'0x0000000000000000000000000000000000000000': { symbol: 'ETH', price: '$1,800.00', change24h: 3.2 },
		'0x0000000000000000000000000000000000000001': { symbol: 'STT', price: '$1.00', change24h: 0.0 },
		'0x0000000000000000000000000000000000000002': { symbol: 'USDC', price: '$1.00', change24h: 0.0 },
		'0x0000000000000000000000000000000000000003': { symbol: 'LINK', price: '$15.00', change24h: 8.7 },
		'0x0000000000000000000000000000000000000004': { symbol: 'UNI', price: '$7.00', change24h: 4.3 },
	}

	tokenAddresses.forEach((address) => {
		const mockPrice = mockPrices[address.toLowerCase()]
		if (mockPrice) {
			prices.set(address, {
				token: address,
				symbol: mockPrice.symbol,
				price: mockPrice.price,
				change24h: mockPrice.change24h,
				timestamp: now,
			})
		}
	})

	return prices
}

