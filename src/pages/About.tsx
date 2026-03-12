import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Shield, Zap, Users, Mail, Cpu, BrainCircuit, Activity } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-hero pt-24 pb-16 text-foreground">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12 relative">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-64 h-64 bg-reactor-purple/10 blur-[80px] rounded-full" />
          <h1 className="text-6xl font-black mb-4 tracking-tighter italic">
            About <span className="bg-gradient-reactor bg-clip-text text-transparent">Somnia Reactor</span>
          </h1>
          <p className="text-xl text-muted-foreground font-medium uppercase tracking-widest text-sm font-mono">
            Autonomous DeFi Intelligence // Powered by Somnia Reactivity
          </p>
        </div>

        {/* What is Somnia Reactor */}
        <Card className="glass border-white/5 mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-reactor" />
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 italic tracking-tight">
              <BrainCircuit className="w-6 h-6 text-reactor-purple" />
              Intelligence at Sub-Second Latency
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Somnia Reactor is a high-performance autonomous intelligence engine built on the 
              <strong> Somnia Reactivity SDK</strong>. Unlike traditional DeFi dashboards that rely 
              on polling and siloed data, the Reactor utilizes native on-chain triggers to monitor 
              market fluctuations and portfolio health in real-time.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              By leveraging the <strong>BlockTick</strong> system event, the Reactor Engine 
              evaluates every single block for yield rebalancing and arbitrage opportunities, 
              ensuring your assets are always where the highest efficiency is detected.
            </p>
          </CardContent>
        </Card>

        {/* Core Architecture */}
        <Card className="glass border-white/5 mb-8">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 italic tracking-tight">
              <Cpu className="w-6 h-6 text-reactor-blue" />
              The Reactor Core Architecture
            </h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0 glow font-black italic">
                  01
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1 group-hover:text-reactor-blue transition-colors">Atomic Connection</h3>
                  <p className="text-sm text-muted-foreground">
                    Direct integration with Somnia Testnet using sub-second web-socket streams for millisecond state awareness.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0 glow font-black italic">
                  02
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Reactive Subscription</h3>
                  <p className="text-sm text-muted-foreground">
                    The engine subscribes to the Somnia Reactivity Precompile (0x0100) to receive BlockTick signals the moment a block is confirmed.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0 glow font-black italic">
                  03
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Intent Detection</h3>
                  <p className="text-sm text-muted-foreground">
                    Proprietary algorithms analyze liquidity depth and APY spreads to generate executable intents for yield capture.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0 glow font-black italic">
                  04
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Autonomous Guard</h3>
                  <p className="text-sm text-muted-foreground">
                    Sub-second liquidation protection and volatility monitoring ensures portfolio safety in rapidly shifting DeFi markets.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Specs */}
        <Card className="glass border-white/5 mb-8 bg-black/20">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 italic tracking-tight text-reactor-pink">
              <Activity className="w-6 h-6" />
              Technical Specifications
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-white/5 border border-white/5 font-mono text-xs">
                <div className="text-reactor-pink font-bold mb-1 uppercase tracking-tighter">DATA INFRASTRUCTURE</div>
                <div className="opacity-70">Somnia Data Streams (SDS-1)</div>
              </div>
              <div className="p-4 rounded-lg bg-white/5 border border-white/5 font-mono text-xs">
                <div className="text-reactor-pink font-bold mb-1 uppercase tracking-tighter">REACTIVE ENGINE</div>
                <div className="opacity-70">BlockTick Event (Precompile 0x0100)</div>
              </div>
              <div className="p-4 rounded-lg bg-white/5 border border-white/5 font-mono text-xs">
                <div className="text-reactor-pink font-bold mb-1 uppercase tracking-tighter">NETWORK</div>
                <div className="opacity-70">Somnia Testnet (Dream-RPC)</div>
              </div>
              <div className="p-4 rounded-lg bg-white/5 border border-white/5 font-mono text-xs">
                <div className="text-reactor-pink font-bold mb-1 uppercase tracking-tighter">RESPONSE LATENCY</div>
                <div className="opacity-70">&lt; 1000ms (Atomic Block Update)</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Community */}
        <Card className="glass border-white/5">
          <CardContent className="p-8 text-center bg-gradient-hero rounded-3xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-reactor opacity-[0.05]" />
            <Users className="w-12 h-12 text-reactor-blue mx-auto mb-4" />
            <h2 className="text-3xl font-black mb-3 italic tracking-tighter">INITIALIZE EXPLORATION</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Join the new era of event-driven DeFi. Contribute to the Reactor core and build the future of autonomous finance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
              <Button className="bg-gradient-reactor hover:opacity-90 gap-2 font-bold italic tracking-tight shadow-glow">
                <Mail className="w-4 h-4" />
                GET DEV ACCESS
              </Button>
              <Button variant="outline" className="glass border-white/10 gap-2 font-bold">
                <ExternalLink className="w-4 h-4" />
                SDK CORE DOCS
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default About;
