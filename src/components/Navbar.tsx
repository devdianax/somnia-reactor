import { Link, useLocation, useNavigate } from "react-router-dom";
import { Wallet, Activity, TrendingUp, Bell, Settings, BookOpen, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWallet } from "@/contexts/WalletContext";
import { useEffect } from "react";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { address, isConnected, disconnect } = useWallet();
  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: Activity },
    { path: "/yield", label: "Yield", icon: TrendingUp },
    { path: "/alerts", label: "Alerts", icon: Bell },
    { path: "/settings", label: "Settings", icon: Settings },
  ];

  const displayAddress = address 
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

  const handleDisconnect = () => {
    // Set a flag in sessionStorage to indicate we just disconnected
    // This will be checked by ConnectWallet to prevent false "connected" toast
    sessionStorage.setItem('justDisconnected', 'true');
    disconnect();
    // Navigate immediately - wagmi will update state automatically
    navigate("/connect-wallet", { replace: true });
  };

  // Navigate to connect wallet if disconnected while on protected routes
  useEffect(() => {
    if (!isConnected && !address && location.pathname !== "/connect-wallet" && location.pathname !== "/" && location.pathname !== "/about") {
      navigate("/connect-wallet", { replace: true });
    }
  }, [isConnected, address, location.pathname, navigate]);

  return (
    <nav className="glass fixed top-0 left-0 right-0 z-50 border-b border-border">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center glow">
            <Wallet className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold gradient-text">DeFi Tracker</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path}>
              <Button
                variant="ghost"
                className={cn(
                  "gap-2 transition-all",
                  isActive(item.path) &&
                    "bg-primary/10 text-primary hover:bg-primary/20"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Button>
            </Link>
          ))}
          
          <Link to="/about">
            <Button variant="ghost" className="gap-2">
              <BookOpen className="w-4 h-4" />
              About
            </Button>
          </Link>
        </div>

        {isConnected && address ? (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="glass border-border"
              onClick={handleDisconnect}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Disconnect
            </Button>
            <Button
              variant="outline"
              className="glass border-success/50 text-success"
              onClick={() => navigate("/dashboard")}
            >
              <Wallet className="w-4 h-4 mr-2" />
              <span className="font-mono text-sm">{displayAddress}</span>
            </Button>
          </div>
        ) : (
          <Link to="/connect-wallet">
            <Button className="bg-gradient-accent hover:opacity-90 glow">
              <Wallet className="w-4 h-4 mr-2" />
              Connect Wallet
            </Button>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
