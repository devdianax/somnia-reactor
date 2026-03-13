import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, Loader2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/contexts/WalletContext";
import { useWalletBalances, useWalletTransactions, useYieldPositions, usePortfolioValue, useSomniaConnection } from "@/hooks/use-somnia-streams";
import { formatDistanceToNow } from "date-fns";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
	const { address, isConnected } = useWallet();
	const navigate = useNavigate();

	useEffect(() => {
		if (!isConnected || !address) {
			navigate("/connect-wallet", { replace: true });
		}
	}, [isConnected, address, navigate]);
	const { isConnected: streamsConnected } = useSomniaConnection();
	const { balances, isLoading: balancesLoading, useMockData: balancesMock } = useWalletBalances(address);
	const { transactions, isLoading: transactionsLoading, useMockData: transactionsMock } = useWalletTransactions(address, 10);
	const { positions, isLoading: positionsLoading, useMockData: positionsMock } = useYieldPositions(address);
	const { totalValue, change24h } = usePortfolioValue(balances);
	const isPositive = change24h > 0;

	const displayAddress = address 
		? `${address.slice(0, 6)}...${address.slice(-4)}`
		: "Not connected";

	const formatTransactionTime = (timestamp: number) => {
		try {
			const distance = formatDistanceToNow(new Date(timestamp * 1000), { addSuffix: true });
			// Fix "1 minutes" to "1 minute" (date-fns sometimes returns plural incorrectly)
			return distance.replace(/\b1 minutes\b/, '1 minute');
		} catch {
			return "Recently";
		}
	};

	const totalYieldValue = positions.reduce((sum, pos) => {
		const value = parseFloat(pos.deposited.replace(/[^0-9.-]/g, '')) || 0;
		return sum + value;
	}, 0);

  return (
    <div className="min-h-screen bg-gradient-hero pt-24 pb-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Wallet className="w-4 h-4" />
            <span className="font-mono">{displayAddress}</span>
            {isConnected ? (
              <Badge variant="outline" className="glass border-success/50 text-success">
                Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="glass border-border">
                Not Connected
              </Badge>
            )}
          </div>
          <h1 className="text-4xl font-bold">Portfolio Dashboard</h1>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-sm text-muted-foreground">
              Real-time data powered by Somnia Data Streams
            </p>
          </div>
        </div>

        {/* Portfolio Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="glass border-border col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Portfolio Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              {balancesLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  <span className="text-muted-foreground">Loading portfolio...</span>
                </div>
              ) : (
                <>
                  <div className="text-4xl font-bold mb-2">
                    ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className={`flex items-center gap-1 ${isPositive ? 'text-success' : 'text-danger'}`}>
                    {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    <span className="font-medium">
                      {isPositive ? '+' : ''}{change24h.toFixed(2)}% (24h)
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="glass border-border hover:border-accent/50 transition-all cursor-pointer group">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent" />
                Yield Farming
              </CardTitle>
            </CardHeader>
            <CardContent>
              {positionsLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  <span className="text-muted-foreground">Loading...</span>
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold mb-2">
                    ${totalYieldValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Across {positions.length} {positions.length === 1 ? 'protocol' : 'protocols'}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Token List */}
        <Card className="glass border-border mb-8">
          <CardHeader>
            <CardTitle>Token Holdings</CardTitle>
          </CardHeader>
          <CardContent>
            {balancesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : balances.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {isConnected ? "No tokens found" : "Connect your wallet to view token holdings"}
              </div>
            ) : (
              <div className="space-y-4">
                {balances.map((token, index) => (
                  <div
                    key={token.address && token.address.trim() ? token.address : `token-${index}-${token.symbol || 'unknown'}`}
                    className="flex items-center justify-between p-4 glass rounded-lg border border-border hover:border-primary/50 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-xl">
                        {token.symbol.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold">{token.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {parseFloat(token.balance).toLocaleString('en-US', { maximumFractionDigits: 6 })} {token.symbol}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{token.value}</div>
                      <div className={`text-sm flex items-center justify-end gap-1 ${
                        token.change24h > 0 ? 'text-success' : token.change24h < 0 ? 'text-danger' : 'text-muted-foreground'
                      }`}>
                        {token.change24h > 0 && <ArrowUpRight className="w-3 h-3" />}
                        {token.change24h < 0 && <ArrowDownRight className="w-3 h-3" />}
                        {token.change24h > 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <Card className="glass border-border">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {isConnected ? "No recent transactions" : "Connect your wallet to view transactions"}
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx, index) => (
                    <div
                      key={tx.hash && tx.hash.trim() ? tx.hash : `tx-${index}-${tx.timestamp || Date.now()}`}
                      className="flex items-center justify-between p-3 glass rounded-lg border border-border"
                    >
                      <div>
                        <div className="font-medium">{tx.type}</div>
                        <div className="text-sm text-muted-foreground">{tx.token}</div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${
                          tx.type === 'Received' ? 'text-success' : 'text-foreground'
                        }`}>
                          {tx.amount}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatTransactionTime(tx.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Yield Positions */}
          <Card className="glass border-border">
            <CardHeader>
              <CardTitle>Active Yield Positions</CardTitle>
            </CardHeader>
            <CardContent>
              {positionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : positions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {isConnected ? "No active yield positions" : "Connect your wallet to view yield positions"}
                </div>
              ) : (
                <div className="space-y-4">
                  {positions.map((position, index) => (
                    <div
                      key={`${position.protocol}-${position.contractAddress}-${index}`}
                      className="p-4 glass rounded-lg border border-border hover:border-accent/50 transition-all"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-semibold">{position.protocol}</div>
                        <Badge className="bg-accent/20 text-accent border-accent/30">
                          {position.apy} APY
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground mb-1">Deposited</div>
                          <div className="font-medium">{position.deposited}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground mb-1">Earned</div>
                          <div className="font-medium text-success">{position.earned}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
