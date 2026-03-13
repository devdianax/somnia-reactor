import { createConfig, http } from 'wagmi'
import { 
	metaMask, 
	walletConnect, 
	coinbaseWallet,
	injected
} from 'wagmi/connectors'
import { defineChain } from 'viem'

export const somniaTestnet = defineChain({
	id: Number(import.meta.env.VITE_SOMNIA_CHAIN_ID) || 50312,
	name: 'Somnia Testnet',
	network: 'somnia-testnet',
	nativeCurrency: {
		decimals: 18,
		name: 'Somnia Testnet Token',
		symbol: 'STT',
	},
	rpcUrls: {
		default: {
			http: [import.meta.env.VITE_SOMNIA_RPC_URL || 'https://dream-rpc.somnia.network'],
			webSocket: [import.meta.env.VITE_SOMNIA_WS_URL || 'wss://dream-rpc.somnia.network/ws'],
		},
		public: {
			http: [import.meta.env.VITE_SOMNIA_RPC_URL || 'https://dream-rpc.somnia.network'],
			webSocket: [import.meta.env.VITE_SOMNIA_WS_URL || 'wss://dream-rpc.somnia.network/ws'],
		},
	},
	blockExplorers: {
		default: {
			name: 'Somnia Explorer',
			url: import.meta.env.VITE_SOMNIA_EXPLORER_URL || 'https://somnia-testnet.socialscan.io',
		},
	},
	testnet: true,
})

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || ''

const chains = [somniaTestnet] as const

export const wagmiConfig = createConfig({
	chains,
	connectors: [
		metaMask({
			dappMetadata: {
				name: 'DeFi Stream Insight',
				url: typeof window !== 'undefined' ? window.location.origin : '',
			},
		}),
		...(projectId
			? [
					walletConnect({
						projectId,
						metadata: {
							name: 'DeFi Stream Insight',
							description: 'Real-time DeFi portfolio monitoring powered by Somnia Data Streams',
							url: typeof window !== 'undefined' ? window.location.origin : '',
							icons: typeof window !== 'undefined' ? [`${window.location.origin}/favicon.ico`] : [],
						},
						showQrModal: true,
					}),
				]
			: []),
		coinbaseWallet({
			appName: 'DeFi Stream Insight',
		}),
		injected(),
	],
	transports: {
		[somniaTestnet.id]: http(),
	},
	ssr: false,
})

