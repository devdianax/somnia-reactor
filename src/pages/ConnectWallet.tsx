import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useConnect, useAccount, useSwitchChain } from "wagmi";
import { somniaTestnet } from "@/lib/wagmi-config";
import { useEffect, useMemo, useRef } from "react";

const getWalletName = (connector: any): string => {
	const id = connector.id.toLowerCase();
	const name = connector.name;

	if (id.includes('metamask') || name.toLowerCase().includes('metamask')) {
		return 'MetaMask';
	}
	if (id.includes('walletconnect') || name.toLowerCase().includes('walletconnect')) {
		return 'WalletConnect';
	}
	if (id.includes('coinbase') || name.toLowerCase().includes('coinbase')) {
		return 'Coinbase Wallet';
	}
	if (id.includes('rabby') || name.toLowerCase().includes('rabby')) {
		return 'Rabby Wallet';
	}
	if (id.includes('phantom') || name.toLowerCase().includes('phantom')) {
		return 'Phantom';
	}
	if (id.includes('uniswap') || name.toLowerCase().includes('uniswap')) {
		return 'Uniswap Extension';
	}
	
	return name || 'Injected';
};

const ConnectWallet = () => {
	const navigate = useNavigate();
	const { connect, connectors, isPending, error, pendingConnector } = useConnect();
	const { address, isConnected, chainId } = useAccount();
	const { switchChain } = useSwitchChain();
	const wasConnectedRef = useRef(false);
	const hasShownToastRef = useRef(false);
	const justDisconnectedRef = useRef(false);

	// Check if we just disconnected when component mounts
	useEffect(() => {
		if (sessionStorage.getItem('justDisconnected') === 'true') {
			justDisconnectedRef.current = true;
			sessionStorage.removeItem('justDisconnected');
			// Clear the flag after a delay to allow for legitimate reconnections
			setTimeout(() => {
				justDisconnectedRef.current = false;
			}, 2000);
		}
	}, []);

	const availableConnectors = useMemo(() => {
		const seen = new Set<string>();
		return connectors
			.filter((connector) => {
				if (connector.id === 'walletConnect') {
					return !!import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
				}
				const key = getWalletName(connector).toLowerCase();
				if (seen.has(key)) {
					return false;
				}
				seen.add(key);
				return true;
			})
			.sort((a, b) => {
				const aName = getWalletName(a).toLowerCase();
				const bName = getWalletName(b).toLowerCase();
				if (aName.includes('metamask')) return -1;
				if (bName.includes('metamask')) return 1;
				if (aName.includes('walletconnect')) return -1;
				if (bName.includes('walletconnect')) return 1;
				return 0;
			});
	}, [connectors]);

	useEffect(() => {
		if (!isConnected) {
			wasConnectedRef.current = false;
			hasShownToastRef.current = false;
			// If we just disconnected, set a flag to prevent showing "connected" toast
			if (justDisconnectedRef.current) {
				justDisconnectedRef.current = false;
				// Reset after a short delay to allow for reconnection
				setTimeout(() => {
					justDisconnectedRef.current = false;
				}, 1000);
			}
		}
	}, [isConnected]);

	useEffect(() => {
		if (isConnected && address && !wasConnectedRef.current) {
			// Don't show toast if we just disconnected (prevent false positive)
			if (justDisconnectedRef.current) {
				return;
			}
			
			wasConnectedRef.current = true;
			
			if (chainId !== somniaTestnet.id) {
				switchChain({ chainId: somniaTestnet.id });
			} else {
				if (!hasShownToastRef.current) {
					toast.success("Wallet connected!");
					hasShownToastRef.current = true;
				}
				setTimeout(() => {
					navigate("/dashboard");
				}, 500);
			}
		}
	}, [isConnected, address, chainId, navigate, switchChain]);

	useEffect(() => {
		if (isConnected && chainId === somniaTestnet.id && wasConnectedRef.current && !hasShownToastRef.current) {
			// Don't show toast if we just disconnected (prevent false positive)
			if (justDisconnectedRef.current) {
				return;
			}
			
			toast.success("Connected to Somnia Testnet!");
			hasShownToastRef.current = true;
			setTimeout(() => {
				navigate("/dashboard");
			}, 500);
		}
	}, [chainId, isConnected, navigate]);

	const handleConnect = (connector: any) => {
		try {
			connect({ connector });
		} catch (err: any) {
			toast.error(err.message || "Failed to connect wallet");
		}
	};

	return (
		<div className="min-h-screen bg-gradient-hero pt-24 pb-16">
			<div className="container mx-auto px-4 max-w-2xl">
				<div className="text-center mb-8">
					<div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-primary items-center justify-center mb-4 glow">
						<Wallet className="w-8 h-8 text-primary-foreground" />
					</div>
					<h1 className="text-4xl font-bold mb-3">Connect Your Wallet</h1>
					<p className="text-muted-foreground text-lg">
						Connect to access your DeFi portfolio on Somnia Testnet
					</p>
				</div>

				<Card className="glass border-border">
					<CardHeader>
						<CardTitle>Select Wallet</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						{availableConnectors.map((connector) => {
							const isConnecting = isPending && pendingConnector?.id === connector.id;
							const walletName = getWalletName(connector);
							// Allow injected connectors even if not "ready" - they might work
							const isDisabled = isPending && !isConnecting;

							return (
								<button
									key={connector.id}
									className="w-full h-14 glass border border-border hover:border-primary/50 hover:glow rounded-lg flex items-center justify-between px-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										handleConnect(connector);
									}}
									disabled={isDisabled}
									type="button"
								>
									<span className="font-semibold text-foreground">{walletName}</span>
									{isConnecting ? (
										<Loader2 className="w-4 h-4 animate-spin text-foreground" />
									) : null}
								</button>
							);
						})}

						{availableConnectors.length === 0 && (
							<div className="text-center py-8 text-muted-foreground">
								<p>No wallets available. Please install a Web3 wallet.</p>
							</div>
						)}
					</CardContent>
				</Card>

				{error && (
					<div className="mt-6 p-4 glass rounded-lg border border-danger/50 text-center">
						<p className="text-danger font-medium">{error.message || "Failed to connect wallet"}</p>
					</div>
				)}

				{isConnected && (
					<div className="mt-6 p-4 glass rounded-lg border border-success/50 text-center">
						<p className="text-success font-medium">Wallet Connected Successfully!</p>
						<p className="text-sm text-muted-foreground mt-1">
							{chainId === somniaTestnet.id 
								? "Connected to Somnia Testnet. Redirecting to dashboard..."
								: "Switching to Somnia Testnet..."}
						</p>
					</div>
				)}
			</div>
		</div>
	);
};

export default ConnectWallet;
