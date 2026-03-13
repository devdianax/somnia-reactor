import { useAccount, useDisconnect } from 'wagmi'

export function useWallet() {
	const { address, isConnected, chainId } = useAccount()
	const { disconnect } = useDisconnect({
		// Ensure state updates immediately on disconnect
		onSuccess: () => {
			// State will be updated automatically by wagmi
		},
	})

	return {
		address: address || null,
		isConnected,
		chainId,
		disconnect,
	}
}

