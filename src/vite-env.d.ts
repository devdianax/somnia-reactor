/// <reference types="vite/client" />

interface Window {
	ethereum?: {
		request: (args: { method: string; params?: any[] }) => Promise<any>
		send: (method: string, params?: any[]) => Promise<any>
		isMetaMask?: boolean
		on: (event: string, handler: (...args: any[]) => void) => void
		removeListener: (event: string, handler: (...args: any[]) => void) => void
	}
	Buffer?: typeof Buffer
	global?: typeof globalThis
}

interface ImportMetaEnv {
	readonly VITE_SOMNIA_STREAMS_ENDPOINT?: string
	readonly VITE_SOMNIA_RPC_URL?: string
	readonly VITE_SOMNIA_CHAIN_ID?: string
	readonly VITE_SOMNIA_EXPLORER_URL?: string
	readonly VITE_WALLETCONNECT_PROJECT_ID?: string
	readonly RPC_URL?: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
