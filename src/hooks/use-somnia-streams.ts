import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { somniaStreams, TokenBalance, Transaction, YieldPosition, PriceUpdate } from '@/lib/somnia-sdk'
import { getTokenBalances } from '@/lib/fetch-real-balances'

export function useSomniaConnection() {
	const [isConnected, setIsConnected] = useState(false)
	const [isConnecting, setIsConnecting] = useState(false)
	const [error, setError] = useState<Error | null>(null)

	useEffect(() => {
		setIsConnecting(true)
		
		const initTimeout = setTimeout(() => {
			somniaStreams.initialize()
				.then(() => {
					setIsConnected(true)
					setIsConnecting(false)
					setError(null)
				})
				.catch((err) => {
					setError(err)
					setIsConnecting(false)
					setIsConnected(false)
					console.warn('Somnia Data Streams initialization failed, using mock data:', err)
				})
		}, 100)

		return () => {
			clearTimeout(initTimeout)
			somniaStreams.disconnect()
			setIsConnected(false)
		}
	}, [])

	useEffect(() => {
		const checkConnection = setInterval(() => {
			const connected = somniaStreams.isConnected()
			setIsConnected(connected)
		}, 1000)

		return () => clearInterval(checkConnection)
	}, [])

	return { isConnected, isConnecting, error }
}

export function useWalletBalances(walletAddress: string | null) {
	const [balances, setBalances] = useState<TokenBalance[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [useMockData, setUseMockData] = useState(false)
	const callbackRef = useRef<((data: TokenBalance[]) => void) | null>(null)

	// Memoized callback to prevent unnecessary re-subscriptions
	const handleBalanceUpdate = useCallback((data: TokenBalance[]) => {
		if (data && data.length > 0) {
			setBalances(data)
			setUseMockData(false)
		}
	}, [])

	useEffect(() => {
		if (!walletAddress) {
			setBalances([])
			setIsLoading(false)
			setUseMockData(false)
			return
		}

		setIsLoading(true)
		setUseMockData(false) // Only real data, no mock

		// Fetch real balances first (only once)
		getTokenBalances(walletAddress)
			.then((realBalances) => {
				if (realBalances && realBalances.length > 0) {
					// This is real data from RPC - always use it
					// Deduplicate by address to prevent duplicates
					const uniqueBalances = realBalances.filter((balance, index, self) =>
						index === self.findIndex(b => b.address === balance.address && b.symbol === balance.symbol)
					)
					setBalances(uniqueBalances)
					setUseMockData(false)
				}
				setIsLoading(false)
			})
			.catch((error) => {
				console.warn('Failed to fetch real balances:', error)
				setBalances([]) // Show empty instead of mock
				setUseMockData(false)
				setIsLoading(false)
			})

		// Update callback to replace data properly (not merge)
		callbackRef.current = (data: TokenBalance[]) => {
			if (data && data.length > 0) {
				// Check if this is real data from stream
				const isRealStreamData = data.some(b => {
					const balance = parseFloat(b.balance.replace(/,/g, ''))
					return balance > 0 && b.address && b.address !== '0x0000000000000000000000000000000000000000'
				})
				
				if (isRealStreamData) {
					// Replace all balances with stream data (don't merge to avoid duplicates)
					// Deduplicate by address to prevent showing same token twice
					const uniqueBalances = data.filter((balance, index, self) =>
						index === self.findIndex(b => b.address === balance.address && b.symbol === balance.symbol)
					)
					setBalances(uniqueBalances)
					setUseMockData(false)
					setIsLoading(false)
				}
			}
		}

		const unsubscribe = somniaStreams.subscribeToWalletBalances(
			walletAddress,
			callbackRef.current
		)

		// Set loading to false after timeout if no data received
		const timeout = setTimeout(() => {
			setIsLoading(false)
		}, 3000)

		return () => {
			clearTimeout(timeout)
			unsubscribe()
		}
	}, [walletAddress, handleBalanceUpdate])

	return { balances, isLoading, useMockData }
}

// Debounce helper for price updates
const debounce = <T extends (...args: any[]) => void>(
	func: T,
	wait: number
): ((...args: Parameters<T>) => void) => {
	let timeout: NodeJS.Timeout | null = null
	return (...args: Parameters<T>) => {
		if (timeout) clearTimeout(timeout)
		timeout = setTimeout(() => func(...args), wait)
	}
}

export function useTokenPrices(tokenAddresses: string[]) {
	const [prices, setPrices] = useState<Map<string, PriceUpdate>>(new Map())
	const [useMockData, setUseMockData] = useState(false)
	const callbackRef = useRef<((data: PriceUpdate) => void) | null>(null)
	const pricesRef = useRef<Map<string, PriceUpdate>>(new Map())

	// Memoize token addresses to avoid unnecessary re-subscriptions
	const tokenAddressesKey = useMemo(() => {
		return [...tokenAddresses].sort().join(',')
	}, [tokenAddresses.join(',')])

	// Optimized price update with immediate state update
	const updatePrice = useCallback((data: PriceUpdate) => {
		pricesRef.current = new Map(pricesRef.current)
		pricesRef.current.set(data.token, data)
		setPrices(new Map(pricesRef.current))
		setUseMockData(false)
	}, [])

	// Debounced update for batch operations (not used for instant alerts)
	const debouncedUpdate = useMemo(
		() => debounce(updatePrice, 100),
		[updatePrice]
	)

	useEffect(() => {
		if (tokenAddresses.length === 0) {
			setPrices(new Map())
			setUseMockData(false)
			return
		}

		// Start with empty prices - only show real data
		setPrices(new Map())
		setUseMockData(false)

		// Use immediate update for instant alerts
		callbackRef.current = updatePrice

		const unsubscribe = somniaStreams.subscribeToTokenPrices(
			tokenAddresses,
			callbackRef.current
		)

		return () => {
			unsubscribe()
		}
	}, [tokenAddressesKey, updatePrice])

	return { prices, useMockData }
}

export function useWalletTransactions(walletAddress: string | null, limit: number = 10) {
	const [transactions, setTransactions] = useState<Transaction[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [useMockData, setUseMockData] = useState(false)
	const callbackRef = useRef<((data: Transaction) => void) | null>(null)

	useEffect(() => {
		if (!walletAddress) {
			setTransactions([])
			setIsLoading(false)
			setUseMockData(false)
			return
		}

		setIsLoading(true)
		setUseMockData(false) // Only real data, no mock

		callbackRef.current = (data: Transaction) => {
			setTransactions((prev) => {
				// Only add if it's a real transaction (has hash)
				if (data.hash && data.hash.trim() && data.hash !== '0x') {
					const updated = [data, ...prev]
					// Remove duplicates by hash
					const unique = updated.filter((tx, idx, arr) => 
						arr.findIndex(t => t.hash === tx.hash) === idx
					)
					setUseMockData(false)
					setIsLoading(false)
					return unique.slice(0, limit)
				}
				return prev
			})
		}

		const unsubscribe = somniaStreams.subscribeToTransactions(
			walletAddress,
			callbackRef.current
		)

		// Set loading to false after a short delay if no data comes
		const timeout = setTimeout(() => {
			setIsLoading(false)
			// Don't use mock data - show empty state instead
		}, 3000)

		return () => {
			clearTimeout(timeout)
			unsubscribe()
		}
	}, [walletAddress, limit])

	return { transactions, isLoading, useMockData }
}

export function useYieldPositions(walletAddress: string | null) {
	const [positions, setPositions] = useState<YieldPosition[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [useMockData, setUseMockData] = useState(false)
	const callbackRef = useRef<((data: YieldPosition[]) => void) | null>(null)

	useEffect(() => {
		if (!walletAddress) {
			setPositions([])
			setIsLoading(false)
			setUseMockData(false)
			return
		}

		setIsLoading(true)
		setUseMockData(false) // Only real data, no mock
		setPositions([]) // Start with empty - no mock data

		callbackRef.current = (data: YieldPosition[]) => {
			if (data && data.length > 0) {
				// Deduplicate positions
				const uniquePositions = data.filter((pos, index, self) =>
					index === self.findIndex(p => 
						p.contractAddress === pos.contractAddress && 
						p.protocol === pos.protocol &&
						p.token === pos.token
					)
				)
				setPositions(uniquePositions)
				setUseMockData(false)
				setIsLoading(false)
			}
		}

		const unsubscribe = somniaStreams.subscribeToYieldPositions(
			walletAddress,
			callbackRef.current
		)

		// Set loading to false after timeout if no data received
		const timeout = setTimeout(() => {
			setIsLoading(false)
			// Don't use mock data - show empty state instead
		}, 3000)

		return () => {
			clearTimeout(timeout)
			unsubscribe()
		}
	}, [walletAddress])

	return { positions, isLoading, useMockData }
}

export function usePortfolioValue(balances: TokenBalance[]) {
	const [totalValue, setTotalValue] = useState(0)
	const [change24h, setChange24h] = useState(0)

	useEffect(() => {
		// Deduplicate balances by address+symbol before calculating to prevent double counting
		const uniqueBalances = balances.filter((balance, index, self) =>
			index === self.findIndex(b => b.address === balance.address && b.symbol === balance.symbol)
		)

		const total = uniqueBalances.reduce((sum, balance) => {
			const value = parseFloat(balance.value.replace(/[^0-9.-]/g, '')) || 0
			return sum + value
		}, 0)

		const weightedChange = uniqueBalances.length > 0 && total > 0
			? uniqueBalances.reduce((sum, balance) => {
				const value = parseFloat(balance.value.replace(/[^0-9.-]/g, '')) || 0
				const weight = value / total
				return sum + (balance.change24h * weight)
			}, 0)
			: 0

		setTotalValue(total)
		setChange24h(weightedChange)
	}, [balances])

	return { totalValue, change24h }
}

