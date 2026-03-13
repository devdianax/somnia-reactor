import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from 'wagmi';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { wagmiConfig } from "./lib/wagmi-config";
import { useSomniaConnection } from "./hooks/use-somnia-streams";
import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import ConnectWallet from "./pages/ConnectWallet";
import Dashboard from "./pages/Dashboard";
import YieldFarming from "./pages/YieldFarming";
import Alerts from "./pages/Alerts";
import Settings from "./pages/Settings";
import About from "./pages/About";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
	const { isConnected: streamsConnected, error: streamsError } = useSomniaConnection()

	if (streamsError) {
		console.warn('Somnia Data Streams connection error:', streamsError)
	}

	return (
		<BrowserRouter>
			<Navbar />
			<Routes>
				<Route path="/" element={<Landing />} />
				<Route path="/connect-wallet" element={<ConnectWallet />} />
				<Route path="/dashboard" element={<Dashboard />} />
				<Route path="/yield" element={<YieldFarming />} />
				<Route path="/alerts" element={<Alerts />} />
				<Route path="/settings" element={<Settings />} />
				<Route path="/about" element={<About />} />
				<Route path="*" element={<NotFound />} />
			</Routes>
		</BrowserRouter>
	)
}

const App = () => (
	<WagmiProvider config={wagmiConfig}>
		<QueryClientProvider client={queryClient}>
			<TooltipProvider>
				<Toaster />
				<Sonner />
				<AppContent />
			</TooltipProvider>
		</QueryClientProvider>
	</WagmiProvider>
);

export default App;
