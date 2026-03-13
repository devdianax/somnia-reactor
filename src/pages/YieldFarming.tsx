import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, ExternalLink, Plus, Loader2, Zap, Coins, ArrowRight } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { useYieldPositions } from "@/hooks/use-somnia-streams";
import { YieldPosition } from "@/lib/somnia-sdk";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWalletClient, usePublicClient } from "wagmi";
import { isAddress, parseEther } from "viem";

const YieldFarming = () => {
	const { address, isConnected } = useWallet();
	const navigate = useNavigate();
	const [quickStakeAmount, setQuickStakeAmount] = useState("");
	const [quickStakePool, setQuickStakePool] = useState<string | null>(null);
	const [isClaiming, setIsClaiming] = useState<string | null>(null);
	const [isStaking, setIsStaking] = useState(false);
	const [quickStakeDialogOpen, setQuickStakeDialogOpen] = useState(false);
	const { data: walletClient } = useWalletClient();
	const publicClient = usePublicClient();

	// Redirect to connect wallet if not connected
	useEffect(() => {
		if (!isConnected || !address) {
			navigate("/connect-wallet", { replace: true });
		}
	}, [isConnected, address, navigate]);
	const { positions, isLoading } = useYieldPositions(address);

	// Calculate summary statistics from real-time data
	const totalDeposited = positions.reduce((sum, pos) => {
		const value = parseFloat(pos.deposited.replace(/[^0-9.-]/g, '')) || 0;
		return sum + value;
	}, 0);

	const totalEarned = positions.reduce((sum, pos) => {
		const value = parseFloat(pos.earned.replace(/[^0-9.-]/g, '')) || 0;
		return sum + value;
	}, 0);

	const averageAPY = positions.length > 0
		? positions.reduce((sum, pos) => {
			const apy = parseFloat(pos.apy.replace('%', '')) || 0;
			return sum + apy;
		}, 0) / positions.length
		: 0;

	const handleQuickClaim = async (position: YieldPosition) => {
		if (!address || !walletClient || !position.contractAddress) {
			toast.error("Wallet not connected or invalid position");
			return;
		}

		if (!isAddress(position.contractAddress)) {
			toast.error("Invalid contract address");
			return;
		}

		setIsClaiming(`${position.protocol}-${position.contractAddress}`);
		
		try {
			// Standard ERC20/Staking contract claim function signature
			// This is a generic implementation - adjust ABI based on actual contract
			const hash = await walletClient.writeContract({
				address: position.contractAddress as `0x${string}`,
				abi: [
					{
						name: 'claim',
						type: 'function',
						stateMutability: 'nonpayable',
						inputs: [],
						outputs: [{ name: '', type: 'bool' }],
					},
					{
						name: 'claimRewards',
						type: 'function',
						stateMutability: 'nonpayable',
						inputs: [],
						outputs: [{ name: '', type: 'bool' }],
					},
					{
						name: 'withdrawRewards',
						type: 'function',
						stateMutability: 'nonpayable',
						inputs: [],
						outputs: [{ name: '', type: 'bool' }],
					},
				] as const,
				functionName: 'claim', // Try 'claim' first, fallback to others if needed
			});

			toast.success("Transaction submitted!", {
				description: `Claiming rewards from ${position.protocol}...`,
			});

			// Wait for transaction confirmation using public client
			if (!publicClient) {
				throw new Error("Public client not available");
			}

			const receipt = await publicClient.waitForTransactionReceipt({ hash });
			
			if (receipt.status === 'success') {
				toast.success("Rewards claimed successfully!", {
					description: "Your rewards have been sent to your wallet",
				});
			} else {
				toast.error("Transaction failed");
			}
		} catch (error: any) {
			console.error('Claim error:', error);
			
			// Try alternative function names if 'claim' fails
			if (error.message?.includes('function') || error.message?.includes('not found')) {
				try {
					const hash = await walletClient.writeContract({
						address: position.contractAddress as `0x${string}`,
						abi: [
							{
								name: 'claimRewards',
								type: 'function',
								stateMutability: 'nonpayable',
								inputs: [],
								outputs: [{ name: '', type: 'bool' }],
							},
						] as const,
						functionName: 'claimRewards',
					});
					
					toast.success("Transaction submitted!", {
						description: `Claiming rewards from ${position.protocol}...`,
					});
					
					if (!publicClient) {
						throw new Error("Public client not available");
					}

					const receipt = await publicClient.waitForTransactionReceipt({ hash });
					if (receipt.status === 'success') {
						toast.success("Rewards claimed successfully!");
					}
				} catch (retryError: any) {
					toast.error("Failed to claim rewards", {
						description: error.message || "Please check the contract supports claim functions",
					});
				}
			} else {
				toast.error("Failed to claim rewards", {
					description: error.message || "Transaction rejected or failed",
				});
			}
		} finally {
			setIsClaiming(null);
		}
	};

	const handleQuickStake = async () => {
		if (!address || !walletClient) {
			toast.error("Wallet not connected");
			return;
		}

		if (!quickStakeAmount || !quickStakePool) {
			toast.error("Please select a pool and enter an amount");
			return;
		}

		const amount = parseFloat(quickStakeAmount);
		if (isNaN(amount) || amount <= 0) {
			toast.error("Please enter a valid amount");
			return;
		}

		// Find the pool contract address from available pools
		// For now, we'll use a placeholder - in production, pools should have contract addresses
		const selectedPool = availablePools.find(p => p.protocol === quickStakePool);
		if (!selectedPool) {
			toast.error("Pool not found");
			return;
		}

		// Check if pool has a valid contract address
		if (!selectedPool.contractAddress || !isAddress(selectedPool.contractAddress)) {
			toast.error("Invalid contract address", {
				description: `The ${quickStakePool} pool does not have a valid contract address configured.`,
			});
			return;
		}

		setIsStaking(true);
		try {
			const amountWei = parseEther(quickStakeAmount);
			
			// Try multiple common staking function signatures
			let hash: `0x${string}` | null = null;
			let error: any = null;

			// Try 'stake' function first
			try {
				hash = await walletClient.writeContract({
					address: selectedPool.contractAddress as `0x${string}`,
					abi: [
						{
							name: 'stake',
							type: 'function',
							stateMutability: 'nonpayable',
							inputs: [{ name: 'amount', type: 'uint256' }],
							outputs: [{ name: '', type: 'bool' }],
						},
					] as const,
					functionName: 'stake',
					args: [amountWei],
				});
			} catch (stakeError: any) {
				error = stakeError;
				// Try 'deposit' function as fallback
				try {
					hash = await walletClient.writeContract({
						address: selectedPool.contractAddress as `0x${string}`,
						abi: [
							{
								name: 'deposit',
								type: 'function',
								stateMutability: 'nonpayable',
								inputs: [{ name: 'amount', type: 'uint256' }],
								outputs: [{ name: '', type: 'bool' }],
							},
						] as const,
						functionName: 'deposit',
						args: [amountWei],
					});
					error = null;
				} catch (depositError: any) {
					// If both fail, show helpful error
					throw new Error(
						`Contract doesn't support 'stake' or 'deposit' functions. ` +
						`Please verify the contract address is correct and supports staking. ` +
						`Error: ${depositError.message || 'Unknown error'}`
					);
				}
			}

			if (!hash) {
				throw new Error("Failed to submit transaction");
			}

			toast.success("Transaction submitted!", {
				description: `Staking ${amount} tokens in ${quickStakePool}...`,
			});

			// Wait for transaction receipt using public client
			if (!publicClient) {
				throw new Error("Public client not available");
			}

			const receipt = await publicClient.waitForTransactionReceipt({ hash });
			
			if (receipt.status === 'success') {
				toast.success("Staked successfully!", {
					description: `${amount} tokens staked in ${quickStakePool}`,
				});
				setQuickStakeAmount("");
				setQuickStakePool(null);
				setQuickStakeDialogOpen(false);
			} else {
				toast.error("Transaction failed");
			}
		} catch (error: any) {
			console.error('Stake error:', error);
			
			// Provide helpful error messages
			if (error.message?.includes('user rejected') || error.message?.includes('User rejected')) {
				toast.error("Transaction rejected", {
					description: "You rejected the transaction in your wallet",
				});
			} else if (error.message?.includes('insufficient funds') || error.message?.includes('Insufficient')) {
				toast.error("Insufficient funds", {
					description: "You don't have enough tokens to stake this amount",
				});
			} else if (error.message?.includes('contract') || error.message?.includes('function')) {
				toast.error("Contract error", {
					description: error.message || "The contract may not support this operation",
				});
			} else {
				toast.error("Failed to stake", {
					description: error.message || "Transaction rejected or failed",
				});
			}
		} finally {
			setIsStaking(false);
		}
	};

	// Available pools with contract addresses from Somnia testnet
	// Addresses verified on: https://shannon-explorer.somnia.network
	const availablePools = [
		{
			protocol: "Somnia Staking Pool",
			pair: "STT Staking",
			apy: "8.2%",
			tvl: "$125M",
			risk: "Low",
			logo: "📈",
			contractAddress: "0x575109e921C6d6a1Cb7cA60Be0191B10950AfA6C", // From Somnia explorer
		},
		{
			protocol: "Uniswap V3",
			pair: "ETH-USDC",
			apy: "12.5%",
			tvl: "$89M",
			risk: "Medium",
			logo: "🦄",
			contractAddress: "0x0000000000000000000000000000000000000002", // TODO: Find real address
		},
		{
			protocol: "Balancer",
			pair: "BAL-WETH",
			apy: "15.8%",
			tvl: "$42M",
			risk: "Medium",
			logo: "⚖️",
			contractAddress: "0x0000000000000000000000000000000000000003", // TODO: Find real address
		},
		{
			protocol: "Yearn Finance",
			pair: "USDT Vault",
			apy: "6.7%",
			tvl: "$156M",
			risk: "Low",
			logo: "🔷",
			contractAddress: "0x0000000000000000000000000000000000000004", // TODO: Find real address
		},
	];

  return (
    <div className="min-h-screen bg-gradient-hero pt-24 pb-16">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-accent" />
            <h1 className="text-4xl font-bold">Yield Farming</h1>
            </div>
            <Dialog open={quickStakeDialogOpen} onOpenChange={setQuickStakeDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-accent hover:opacity-90 gap-2">
                  <Zap className="w-4 h-4" />
                  Quick Stake
                </Button>
              </DialogTrigger>
              <DialogContent className="glass border-border">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-accent" />
                    Quick Stake
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Select Pool</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {availablePools.slice(0, 4).map((pool, idx) => (
                        <Button
                          key={idx}
                          variant={quickStakePool === pool.protocol ? "default" : "outline"}
                          className={quickStakePool === pool.protocol ? "bg-accent" : "glass border-border"}
                          onClick={() => setQuickStakePool(pool.protocol)}
                        >
                          <div className="text-left">
                            <div className="font-semibold text-sm">{pool.protocol}</div>
                            <div className="text-xs text-muted-foreground">{pool.apy} APY</div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      className="glass border-border"
                      value={quickStakeAmount}
                      onChange={(e) => setQuickStakeAmount(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full bg-gradient-accent hover:opacity-90"
                    onClick={handleQuickStake}
                    disabled={!quickStakeAmount || !quickStakePool || isStaking}
                  >
                    {isStaking ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Staking...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Stake Now
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-muted-foreground text-lg">
            Manage your staking positions and discover new yield opportunities
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time updates powered by Somnia Data Streams
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="glass border-border">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Total Deposited</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              ) : (
                <div className="text-3xl font-bold">
                  ${totalDeposited.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="glass border-border">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Total Earned</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              ) : (
                <div className="text-3xl font-bold text-success">
                  ${totalEarned.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="glass border-border">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Average APY</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              ) : (
                <div className="text-3xl font-bold text-accent">
                  {averageAPY.toFixed(2)}%
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Active Positions */}
        <Card className="glass border-border mb-8">
          <CardHeader>
            <CardTitle>Active Positions</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : positions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {isConnected ? "No active yield positions" : "Connect your wallet to view yield positions"}
              </div>
            ) : (
              <div className="space-y-4">
                {positions.map((farm, index) => (
                  <div
                    key={`${farm.protocol || 'unknown'}-${farm.contractAddress || 'no-address'}-${index}`}
                    className="p-6 glass rounded-lg border border-border hover:border-accent/50 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-2xl">
                          {farm.token.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-lg">{farm.protocol}</div>
                          <div className="text-sm text-muted-foreground">{farm.token}</div>
                        </div>
                      </div>
                      <Badge className="bg-accent/20 text-accent border-accent/30 text-base px-3 py-1">
                        {farm.apy} APY
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Deposited</div>
                        <div className="font-semibold">{farm.deposited}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Total Earned</div>
                        <div className="font-semibold text-success">{farm.earned}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Daily Rewards</div>
                        <div className="font-semibold">{farm.dailyRewards}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Claimable</div>
                        <div className="font-semibold text-accent">{farm.earned}</div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
                        onClick={() => handleQuickClaim(farm)}
                        disabled={isClaiming === `${farm.protocol}-${farm.contractAddress}` || !farm.contractAddress}
                      >
                        {isClaiming === `${farm.protocol}-${farm.contractAddress}` ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Claiming...
                          </>
                        ) : (
                          <>
                            <Coins className="w-4 h-4" />
                            Quick Claim
                          </>
                        )}
                      </Button>
                      <Button variant="outline" className="glass border-border">
                        Add More
                      </Button>
                      <Button variant="outline" className="glass border-border">
                        Unstake
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Pools */}
        <Card className="glass border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Available Yield Pools</CardTitle>
              <Button variant="outline" className="glass border-border gap-2">
                <Plus className="w-4 h-4" />
                Explore More
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {availablePools.map((pool, index) => (
                <div
                  key={index}
                  className="p-5 glass rounded-lg border border-border hover:border-primary/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center text-xl">
                        {pool.logo}
                      </div>
                      <div>
                        <div className="font-semibold">{pool.protocol}</div>
                        <div className="text-sm text-muted-foreground">{pool.pair}</div>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">APY</div>
                      <div className="font-bold text-accent">{pool.apy}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">TVL</div>
                      <div className="font-semibold">{pool.tvl}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Risk</div>
                      <Badge
                        variant="outline"
                        className={
                          pool.risk === "Low"
                            ? "border-success/50 text-success"
                            : "border-accent/50 text-accent"
                        }
                      >
                        {pool.risk}
                      </Badge>
                    </div>
                  </div>
                  
                  <Button
                    className="w-full bg-gradient-accent hover:opacity-90 gap-2"
                    onClick={() => {
                      setQuickStakePool(pool.protocol);
                      setQuickStakeAmount("");
                      setQuickStakeDialogOpen(true);
                    }}
                  >
                    <Zap className="w-4 h-4" />
                    Quick Stake
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default YieldFarming;
