import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, Loader2, AlertCircle, Zap, Activity, ShieldAlert, Cpu } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/contexts/WalletContext";
import { useWalletBalances, useWalletTransactions, useYieldPositions, usePortfolioValue, useSomniaConnection } from "@/hooks/use-somnia-streams";
import { reactorEngine, ReactorIntent } from "@/lib/reactor-engine";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
	const { address, isConnected } = useWallet();
	const navigate = useNavigate();
	const [intents, setIntents] = useState<ReactorIntent[]>([]);
	const [lastTick, setLastTick] = useState<number>(Date.now());

	useEffect(() => {
		if (!isConnected || !address) {
			navigate("/connect-wallet", { replace: true });
			return;
		}

		// Connect Reactor Engine
		reactorEngine.start(address);
		setIntents(reactorEngine.getIntents());

		const unsub = reactorEngine.onIntent((intent) => {
			setIntents((prev) => [intent, ...prev.slice(0, 19)]);
			setLastTick(Date.now());
		});

		return () => {
			unsub();
			reactorEngine.stop();
		};
	}, [isConnected, address, navigate]);

	const { isConnected: streamsConnected } = useSomniaConnection();
	const { balances, isLoading: balancesLoading } = useWalletBalances(address);
	const { transactions, isLoading: transactionsLoading } = useWalletTransactions(address, 10);
	const { positions, isLoading: positionsLoading } = useYieldPositions(address);
	const { totalValue, change24h } = usePortfolioValue(balances);
	const isPositive = change24h > 0;

	const displayAddress = address 
		? `${address.slice(0, 6)}...${address.slice(-4)}`
		: "Not connected";

	const formatTransactionTime = (timestamp: number) => {
		try {
			return formatDistanceToNow(new Date(timestamp * 1000), { addSuffix: true });
		} catch {
			return "Recently";
		}
	};

	const totalYieldValue = positions.reduce((sum, pos) => {
		const value = parseFloat(pos.deposited.replace(/[^0-9.-]/g, '')) || 0;
		return sum + value;
	}, 0);

  return (
    <div className="min-h-screen bg-gradient-hero pt-24 pb-16 text-foreground">
      <div className="container mx-auto px-4">
        {/* Reactor Header */}
        <div className="mb-12 relative">
          <div className="absolute -top-12 -left-12 w-64 h-64 bg-reactor-purple/10 blur-[100px] rounded-full" />
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-gradient-primary glow">
                  <Cpu className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-reactor bg-clip-text text-transparent italic">
                    SOMNIA REACTOR
                  </h1>
                  <p className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
                    Autonomous DeFi Intelligence Engine // System Active
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm font-mono">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full glass border-reactor-blue/30 text-reactor-blue">
                  <Activity className="w-3 h-3 animate-pulse" />
                  <span>REACTOR ONLINE</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Wallet className="w-4 h-4" />
                  <span>{displayAddress}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="text-xs font-mono text-muted-foreground uppercase opacity-50">Last Reactive Sync</div>
              <div className="text-xl font-bold font-mono text-reactor-pink">
                {new Date(lastTick).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Main Controls & Status */}
          <div className="lg:col-span-8 space-y-8">
            {/* Portfolio Stats */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="glass border-reactor-blue/20 hover:border-reactor-blue/50 transition-all overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <TrendingUp className="w-24 h-24 text-reactor-blue" />
                </div>
                <CardHeader>
                  <CardTitle className="text-xs font-mono uppercase tracking-tighter opacity-70">Control Unit: Portfolio Value</CardTitle>
                </CardHeader>
                <CardContent>
                  {balancesLoading ? (
                    <Loader2 className="w-8 h-8 animate-spin text-reactor-blue" />
                  ) : (
                    <div className="relative">
                      <div className="text-5xl font-black mb-2 tracking-tighter">
                        ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className={`flex items-center gap-1 font-mono text-sm ${isPositive ? 'text-success' : 'text-danger'}`}>
                        {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        <span>{isPositive ? '+' : ''}{change24h.toFixed(2)}% ATOMIC DRIFT</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="glass border-reactor-purple/20 hover:border-reactor-purple/50 transition-all overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Zap className="w-24 h-24 text-reactor-purple" />
                </div>
                <CardHeader>
                  <CardTitle className="text-xs font-mono uppercase tracking-tighter opacity-70">Optimization Unit: Yield Core</CardTitle>
                </CardHeader>
                <CardContent>
                  {positionsLoading ? (
                    <Loader2 className="w-8 h-8 animate-spin text-reactor-purple" />
                  ) : (
                    <div>
                      <div className="text-5xl font-black mb-2 tracking-tighter">
                        ${totalYieldValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-sm font-mono text-reactor-purple">
                        ACTIVE IN {positions.length} REVERBERATION POOLS
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Holdings Table */}
            <Card className="glass border-white/10">
              <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 bg-white/5">
                <CardTitle className="text-xs font-mono uppercase tracking-widest flex items-center gap-2">
                  <Activity className="w-4 h-4 text-reactor-blue" />
                  Asset Matrix
                </CardTitle>
                <Badge variant="outline" className="font-mono text-[10px] border-white/20">REAL-TIME DATA</Badge>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {balances.map((token, index) => (
                    <div key={token.address || index} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-reactor-blue/30 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center text-xl font-black shadow-inner">
                          {token.symbol[0]}
                        </div>
                        <div>
                          <div className="font-bold text-lg group-hover:text-reactor-blue transition-colors">{token.name}</div>
                          <div className="text-xs font-mono text-muted-foreground">{token.balance} {token.symbol}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-xl">{token.value}</div>
                        <div className={`text-xs font-mono flex items-center justify-end gap-1 ${token.change24h >= 0 ? 'text-success' : 'text-danger'}`}>
                          {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Intelligence Sidestack */}
          <div className="lg:col-span-4 space-y-8">
            {/* Intelligence Feed */}
            <Card className="glass border-reactor-pink/30 shadow-glow relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-reactor" />
              <CardHeader className="bg-reactor-pink/5">
                <CardTitle className="text-xs font-extrabold font-mono uppercase tracking-tighter flex items-center gap-2 text-reactor-pink">
                  <Zap className="w-4 h-4 animate-bounce" />
                  Intelligence Feed
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-hide">
                  {intents.length === 0 ? (
                    <div className="text-center py-12 opacity-50 space-y-4">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-reactor-pink" />
                      <p className="text-xs font-mono">SYNCHRONIZING WITH SOMNIA REACTIVITY SDK...</p>
                    </div>
                  ) : (
                    intents.map((intent) => (
                      <div key={intent.id} className="p-4 rounded-lg bg-black/40 border-l-4 border-reactor-pink space-y-2 animate-in fade-in slide-in-from-right duration-500">
                        <div className="flex items-center justify-between">
                          <Badge className="bg-reactor-pink text-[10px] font-mono">{intent.type}</Badge>
                          <span className="text-[10px] font-mono opacity-50">{new Date(intent.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-sm font-semibold leading-tight">{intent.description}</p>
                        <div className="flex items-center gap-1 text-[10px] font-mono text-reactor-blue uppercase">
                          <Activity className="w-3 h-3" />
                          <span>Reactive Response confirmed</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Guard Status */}
            <Card className="glass border-success/30 bg-success/5">
              <CardHeader>
                <CardTitle className="text-xs font-mono uppercase tracking-widest flex items-center gap-2 text-success">
                  <ShieldAlert className="w-4 h-4" />
                  Atomic Guard Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="opacity-70">LIQUIDATION PROTECTION</span>
                    <span className="text-success font-bold">ACTIVE</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="opacity-70">VOLATILITY RADIUS</span>
                    <span className="text-success font-bold">MONITORED</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-success w-[100%] animate-pulse" />
                  </div>
                  <p className="text-[10px] text-muted-foreground italic font-mono uppercase">
                    All conditions atomic with block {lastTick.toString().slice(-4)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
