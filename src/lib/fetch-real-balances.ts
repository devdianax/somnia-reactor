import { createPublicClient, http, formatEther } from 'viem'
import { somniaTestnet } from './wagmi-config'
import { TokenBalance } from './somnia-sdk'

const rpcUrl = import.meta.env.VITE_SOMNIA_RPC_URL || 'https://dream-rpc.somnia.network'

export async function fetchRealTokenBalances(walletAddress: string): Promise<TokenBalance[]> {
	try {
		const publicClient = createPublicClient({
			chain: somniaTestnet,
			transport: http(rpcUrl),
		})

		const nativeBalance = await publicClient.getBalance({
			address: walletAddress as `0x${string}`,
		})

		const sttBalance = parseFloat(formatEther(nativeBalance))
		
		if (sttBalance > 0) {
			const balances: TokenBalance[] = [
				{
					address: walletAddress,
					symbol: 'STT',
					name: 'Somnia Test Token',
					balance: sttBalance.toLocaleString('en-US', { maximumFractionDigits: 6 }),
					value: `$${sttBalance.toFixed(2)}`,
					price: '$1.00',
					change24h: 0.0,
					decimals: 18,
				},
			]

			return balances
		}

		return []
	} catch (error) {
		console.warn('Failed to fetch real balances:', error)
		return []
	}
}

export async function getTokenBalances(walletAddress: string | null): Promise<TokenBalance[]> {
	if (!walletAddress) return []

	try {
		const realBalances = await fetchRealTokenBalances(walletAddress)
		
		// Only return real balances - no mock data
		if (realBalances.length > 0) {
			return realBalances
		}
		
		// Return empty array - no mock data fallback
		return []
	} catch (error) {
		console.warn('Error fetching balances:', error)
		return []
	}
}

