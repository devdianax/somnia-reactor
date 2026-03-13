import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Settings as SettingsIcon, Wallet, Bell, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWallet } from "@/contexts/WalletContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Settings = () => {
	const { address, isConnected, disconnect } = useWallet();
	const navigate = useNavigate();

	const handleDisconnect = () => {
		// Set a flag in sessionStorage to indicate we just disconnected
		// This will be checked by ConnectWallet to prevent false "connected" toast
		sessionStorage.setItem('justDisconnected', 'true');
		disconnect();
		// Navigate immediately - wagmi will update state automatically
		navigate("/connect-wallet", { replace: true });
	};

	const displayAddress = address 
		? `${address.slice(0, 6)}...${address.slice(-4)}`
		: "Not connected";

	return (
		<div className="min-h-screen bg-gradient-hero pt-24 pb-16">
			<div className="container mx-auto px-4 max-w-4xl">
				<div className="mb-8">
					<div className="flex items-center gap-2 mb-3">
						<SettingsIcon className="w-8 h-8 text-accent" />
						<h1 className="text-4xl font-bold">Settings</h1>
					</div>
					<p className="text-muted-foreground text-lg">
						Manage your account preferences and notifications
					</p>
				</div>

				<div className="space-y-6">
					{/* Wallet Settings */}
					<Card className="glass border-border">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Wallet className="w-5 h-5" />
								Wallet Settings
							</CardTitle>
							<CardDescription>Manage your connected wallets</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{isConnected && address ? (
								<div className="p-4 glass rounded-lg border border-border">
									<div className="flex items-center justify-between mb-2">
										<div>
											<div className="font-semibold">Connected Wallet</div>
											<div className="text-sm text-muted-foreground font-mono">
												{displayAddress}
											</div>
										</div>
										<div className="px-3 py-1 rounded-full bg-success/20 text-success text-sm">
											Connected
										</div>
									</div>
									<Button 
										variant="outline" 
										className="w-full mt-3 glass border-border"
										onClick={handleDisconnect}
									>
										Disconnect Wallet
									</Button>
								</div>
							) : (
								<div className="p-4 glass rounded-lg border border-border text-center">
									<p className="text-muted-foreground mb-3">No wallet connected</p>
									<Button 
										className="w-full bg-gradient-accent hover:opacity-90"
										onClick={() => navigate("/connect-wallet")}
									>
										Connect Wallet
									</Button>
								</div>
							)}
						</CardContent>
					</Card>

          {/* Display Settings */}
          <Card className="glass border-border">
            <CardHeader>
              <CardTitle>Display Settings</CardTitle>
              <CardDescription>Customize how you view your portfolio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Currency Display</Label>
                  <p className="text-sm text-muted-foreground">
                    Choose your preferred currency
                  </p>
                </div>
                <Select defaultValue="usd">
                  <SelectTrigger className="w-32 glass border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass border-border">
                    <SelectItem value="usd">USD ($)</SelectItem>
                    <SelectItem value="eur">EUR (€)</SelectItem>
                    <SelectItem value="gbp">GBP (£)</SelectItem>
                    <SelectItem value="eth">ETH (Ξ)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Hide Small Balances</Label>
                  <p className="text-sm text-muted-foreground">
                    Hide tokens with value less than $1
                  </p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Test Networks</Label>
                  <p className="text-sm text-muted-foreground">
                    Display test network balances
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="glass border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>Manage your alert preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Browser Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications in your browser
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Transaction Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified of incoming/outgoing transactions
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Price Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Notifications when price targets are hit
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Weekly Summary</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive a weekly portfolio summary via email
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card className="glass border-border border-danger/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-danger">
                <Trash2 className="w-5 h-5" />
                Data Management
              </CardTitle>
              <CardDescription>Manage your cached data and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full glass border-border hover:border-danger/50 hover:text-danger"
              >
                Clear Cached Data
              </Button>
              <p className="text-xs text-muted-foreground">
                This will clear all locally stored data. Your wallet connection will remain
                intact.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
