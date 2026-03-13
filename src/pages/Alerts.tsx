import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Bell, Plus, Trash2, TrendingUp, TrendingDown, Zap, Volume2, VolumeX } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useTokenPrices } from "@/hooks/use-somnia-streams";
import { Switch } from "@/components/ui/switch";

interface Alert {
	id: number;
	token: string;
	tokenAddress: string;
	condition: "above" | "below";
	targetPrice: number;
	status: "active" | "paused";
	triggered: boolean;
	triggeredAt?: number;
	soundEnabled?: boolean;
	instantTrigger?: boolean;
}

const TOKEN_ADDRESSES: Record<string, string> = {
	ETH: "0x0000000000000000000000000000000000000000", // Native token
	BTC: "0x0000000000000000000000000000000000000001", // Placeholder
	USDC: "0x0000000000000000000000000000000000000002", // Placeholder
	LINK: "0x0000000000000000000000000000000000000003", // Placeholder
	UNI: "0x0000000000000000000000000000000000000004", // Placeholder
};

const ALERT_PRESETS = [
	{ token: "ETH", condition: "above" as const, targetPrice: 2000, label: "ETH above $2,000" },
	{ token: "ETH", condition: "below" as const, targetPrice: 1500, label: "ETH below $1,500" },
	{ token: "BTC", condition: "above" as const, targetPrice: 50000, label: "BTC above $50,000" },
	{ token: "USDC", condition: "below" as const, targetPrice: 0.99, label: "USDC below $0.99" },
];

const Alerts = () => {
	const [alerts, setAlerts] = useState<Alert[]>(() => {
		// Load from localStorage
		const saved = localStorage.getItem('price_alerts');
		if (saved) {
			try {
				return JSON.parse(saved);
			} catch {
				return [];
			}
		}
		return [];
	});
	const [soundEnabled, setSoundEnabled] = useState(() => {
		const saved = localStorage.getItem('alert_sound_enabled');
		return saved ? JSON.parse(saved) : true;
	});
	const audioContextRef = useRef<AudioContext | null>(null);
	const triggeredAlertsRef = useRef<Set<number>>(new Set());

	// Get token addresses for price subscriptions
	const tokenAddresses = useMemo(() => {
		return alerts
			.filter(alert => alert.status === 'active' && !alert.triggered)
			.map(alert => alert.tokenAddress)
			.filter((addr, index, arr) => arr.indexOf(addr) === index); // Unique addresses
	}, [alerts]);

	const { prices } = useTokenPrices(tokenAddresses);

	// Initialize audio context for sound alerts
	useEffect(() => {
		if (typeof window !== 'undefined' && 'AudioContext' in window) {
			audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
		}
		return () => {
			if (audioContextRef.current) {
				audioContextRef.current.close();
			}
		};
	}, []);

	// Play alert sound
	const playAlertSound = useCallback(() => {
		if (!soundEnabled || !audioContextRef.current) return;

		try {
			const ctx = audioContextRef.current;
			const oscillator = ctx.createOscillator();
			const gainNode = ctx.createGain();

			oscillator.connect(gainNode);
			gainNode.connect(ctx.destination);

			oscillator.frequency.value = 800;
			oscillator.type = 'sine';

			gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
			gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

			oscillator.start(ctx.currentTime);
			oscillator.stop(ctx.currentTime + 0.5);
		} catch (error) {
			console.warn('Failed to play alert sound:', error);
		}
	}, [soundEnabled]);

	// Check alerts against real-time prices with instant triggers
	useEffect(() => {
		if (prices.size === 0) return;

		setAlerts(prevAlerts => {
			const updated = prevAlerts.map(alert => {
				if (alert.triggered || alert.status !== 'active') return alert;

				const priceUpdate = prices.get(alert.tokenAddress);
				if (!priceUpdate) return alert;

				const currentPrice = parseFloat(priceUpdate.price.replace(/[^0-9.-]/g, '')) || 0;
				const shouldTrigger = alert.condition === 'above' 
					? currentPrice >= alert.targetPrice
					: currentPrice <= alert.targetPrice;

				if (shouldTrigger && !alert.triggered && !triggeredAlertsRef.current.has(alert.id)) {
					triggeredAlertsRef.current.add(alert.id);

					// Instant visual feedback
					const alertElement = document.getElementById(`alert-${alert.id}`);
					if (alertElement) {
						alertElement.classList.add('animate-pulse', 'ring-2', 'ring-accent');
						setTimeout(() => {
							alertElement.classList.remove('animate-pulse', 'ring-2', 'ring-accent');
						}, 2000);
					}

					// Play sound if enabled
					if (alert.soundEnabled !== false) {
						playAlertSound();
					}

					// Show toast with instant feedback
					toast.success(`${alert.token} price alert triggered!`, {
						description: `Price is ${alert.condition} $${alert.targetPrice.toLocaleString()}`,
						duration: 5000,
						action: {
							label: 'View',
							onClick: () => {
								const element = document.getElementById(`alert-${alert.id}`);
								element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
							},
						},
					});
					
					// Show browser notification if permission granted
					if ('Notification' in window && Notification.permission === 'granted') {
						new Notification(`${alert.token} Price Alert`, {
							body: `Price is ${alert.condition} $${alert.targetPrice.toLocaleString()}`,
							icon: '/favicon.ico',
							tag: `alert-${alert.id}`,
							requireInteraction: true,
						});
					}

					return {
						...alert,
						triggered: true,
						triggeredAt: Date.now(),
					};
				}

				return alert;
			});

			// Save to localStorage
			localStorage.setItem('price_alerts', JSON.stringify(updated));
			return updated;
		});
	}, [prices, playAlertSound]);

	// Request notification permission on mount
	useEffect(() => {
		if ('Notification' in window && Notification.permission === 'default') {
			Notification.requestPermission();
		}
	}, []);

	// Save sound preference
	useEffect(() => {
		localStorage.setItem('alert_sound_enabled', JSON.stringify(soundEnabled));
	}, [soundEnabled]);

	const handleDeleteAlert = (id: number) => {
		setAlerts(prev => {
			const updated = prev.filter(alert => alert.id !== id);
			localStorage.setItem('price_alerts', JSON.stringify(updated));
			return updated;
		});
		triggeredAlertsRef.current.delete(id);
		toast.success("Alert deleted successfully");
	};

	const handleToggleSound = (alertId: number) => {
		setAlerts(prev => {
			const updated = prev.map(alert => 
				alert.id === alertId 
					? { ...alert, soundEnabled: !alert.soundEnabled }
					: alert
			);
			localStorage.setItem('price_alerts', JSON.stringify(updated));
			return updated;
		});
	};

	const [selectedToken, setSelectedToken] = useState<string>("");
	const [selectedCondition, setSelectedCondition] = useState<string>("");
	const [targetPrice, setTargetPrice] = useState<string>("");

	const handleCreateAlert = () => {
		if (!selectedToken || !selectedCondition || !targetPrice) {
			toast.error("Please fill in all fields");
			return;
		}

		const tokenAddress = TOKEN_ADDRESSES[selectedToken.toUpperCase()];
		if (!tokenAddress) {
			toast.error("Invalid token selected");
			return;
		}

		const newAlert: Alert = {
			id: Date.now(),
			token: selectedToken.toUpperCase(),
			tokenAddress,
			condition: selectedCondition as "above" | "below",
			targetPrice: parseFloat(targetPrice),
			status: "active",
			triggered: false,
			soundEnabled: soundEnabled,
			instantTrigger: true,
		};

		setAlerts(prev => {
			const updated = [...prev, newAlert];
			localStorage.setItem('price_alerts', JSON.stringify(updated));
			return updated;
		});

		setSelectedToken("");
		setSelectedCondition("");
		setTargetPrice("");
		toast.success("Alert created successfully");
	};

  return (
    <div className="min-h-screen bg-gradient-hero pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-8 h-8 text-accent" />
            <h1 className="text-4xl font-bold">Price Alerts</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Set up notifications for token price movements and important events
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time price monitoring powered by Somnia Data Streams
          </p>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="global-sound" className="cursor-pointer flex items-center gap-2">
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-accent" />
                ) : (
                  <VolumeX className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="text-sm">Sound Alerts</span>
              </Label>
              <Switch
                id="global-sound"
                checked={soundEnabled}
                onCheckedChange={setSoundEnabled}
              />
            </div>
            <Badge variant="outline" className="glass border-border gap-1">
              <Zap className="w-3 h-3 text-accent" />
              Instant Triggers Enabled
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Create Alert Form */}
          <Card className="glass border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Create New Alert
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Token</Label>
                <Select value={selectedToken} onValueChange={setSelectedToken}>
                  <SelectTrigger className="glass border-border">
                    <SelectValue placeholder="Select token" />
                  </SelectTrigger>
                  <SelectContent className="glass border-border">
                    <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                    <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                    <SelectItem value="USDC">USD Coin (USDC)</SelectItem>
                    <SelectItem value="LINK">Chainlink (LINK)</SelectItem>
                    <SelectItem value="UNI">Uniswap (UNI)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Condition</Label>
                <Select value={selectedCondition} onValueChange={setSelectedCondition}>
                  <SelectTrigger className="glass border-border">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent className="glass border-border">
                    <SelectItem value="above">Price goes above</SelectItem>
                    <SelectItem value="below">Price goes below</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Target Price</Label>
                <Input
                  type="number"
                  placeholder="Enter target price"
                  className="glass border-border"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Sound Alert</Label>
                  <Switch
                    checked={soundEnabled}
                    onCheckedChange={setSoundEnabled}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Play sound when alert triggers
                </p>
              </div>

              <Button
                className="w-full bg-gradient-accent hover:opacity-90"
                onClick={handleCreateAlert}
              >
                <Zap className="w-4 h-4 mr-2" />
                Create Alert
              </Button>

              <div className="pt-4 border-t border-border">
                <Label className="text-sm mb-2 block">Quick Presets</Label>
                <div className="grid grid-cols-2 gap-2">
                  {ALERT_PRESETS.map((preset, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      className="glass border-border text-xs h-auto py-2"
                      onClick={() => {
                       	setSelectedToken(preset.token)
						setSelectedCondition(preset.condition)
						setTargetPrice(preset.targetPrice.toString())
						toast.success("Preset applied", {
							description: preset.label,
						})
                      }}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <div className="space-y-6">
            <Card className="glass border-border">
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Alert Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-3xl font-bold mb-1">{alerts.length}</div>
                    <div className="text-sm text-muted-foreground">Total Alerts</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-accent mb-1">
                      {alerts.filter((a) => a.triggered).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Triggered Today</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-border">
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Quick Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2" />
                  <p className="text-muted-foreground">
                    Set multiple alerts for different price levels to track market movements
                  </p>
                </div>
                <div className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2" />
                  <p className="text-muted-foreground">
                    Triggered alerts will send notifications based on your preferences
                  </p>
                </div>
                <div className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2" />
                  <p className="text-muted-foreground">
                    You can edit or delete alerts at any time
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Active Alerts */}
        <Card className="glass border-border">
          <CardHeader>
            <CardTitle>Active Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No alerts set. Create one above to get started!
                </div>
              ) : (
                alerts.map((alert) => {
                  const priceUpdate = prices.get(alert.tokenAddress);
                  const currentPrice = priceUpdate 
                    ? parseFloat(priceUpdate.price.replace(/[^0-9.-]/g, '')) || 0
                    : null;

                  return (
                    <div
                      id={`alert-${alert.id}`}
                      key={alert.id}
                      className={`flex items-center justify-between p-4 glass rounded-lg border transition-all ${
                        alert.triggered
                          ? 'border-accent/50 bg-accent/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            alert.condition === "above"
                              ? "bg-success/20 text-success"
                              : "bg-danger/20 text-danger"
                          }`}
                        >
                          {alert.condition === "above" ? (
                            <TrendingUp className="w-5 h-5" />
                          ) : (
                            <TrendingDown className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold">
                            {alert.token} {alert.condition} ${alert.targetPrice.toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {currentPrice !== null 
                              ? `Current: $${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                              : "Waiting for price data..."
                            }
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {alert.triggered ? (
                          <Badge className="bg-accent/20 text-accent border-accent/30 gap-1">
                            <Zap className="w-3 h-3" />
                            Triggered
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="glass border-border">
                            Active
                          </Badge>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="hover:bg-muted"
                          onClick={() => handleToggleSound(alert.id)}
                          title={alert.soundEnabled !== false ? "Sound enabled" : "Sound disabled"}
                        >
                          {alert.soundEnabled !== false ? (
                            <Volume2 className="w-4 h-4 text-accent" />
                          ) : (
                            <VolumeX className="w-4 h-4 text-muted-foreground" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="hover:bg-danger/20 hover:text-danger"
                          onClick={() => handleDeleteAlert(alert.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Alerts;
