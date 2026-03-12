import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Shield, Activity, Cpu, BrainCircuit } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import heroDashboard from "@/assets/hero-dashboard.jpg";

const Landing = () => {
  const features = [
    {
      icon: BrainCircuit,
      title: "Autonomous Intelligence",
      description: "Reactor Engine detects rebalance and arbitrage opportunities in real-time using Somnia Reactivity.",
    },
    {
      icon: Activity,
      title: "Reactive Portfolios",
      description: "Your dashboard responds instantly to on-chain events without polling, powered by BlockTick triggers.",
    },
    {
      icon: Zap,
      title: "Intent-Based Execution",
      description: "Define your yield targets and let the Reactor monitor the network for the perfect entry.",
    },
    {
      icon: Shield,
      title: "Atomic Security",
      description: "Protocol-level guards ensure your assets are protected against volatility with sub-second reactivity.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-hero overflow-hidden text-foreground">
      <div className="container mx-auto px-4 pt-24 pb-16">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-20 relative">
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-reactor-purple/20 blur-[120px] rounded-full" />
          
          <div className="inline-block mb-6 px-4 py-2 glass rounded-full border border-reactor-blue/30 animate-fade-in">
            <span className="text-reactor-blue text-xs font-mono font-bold tracking-widest uppercase">Powered by Somnia Reactivity SDK</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black mb-6 leading-tight animate-fade-in-up tracking-tighter">
            <span className="italic bg-gradient-reactor bg-clip-text text-transparent">SOMNIA</span>
            <span className="block italic">REACTOR</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in font-medium leading-relaxed" style={{ animationDelay: "0.2s" }}>
            The world's first autonomous DeFi intelligence engine. 
            Transform your passive monitoring into active, reactive wealth optimization.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <Link to="/connect-wallet">
              <Button size="lg" className="bg-gradient-primary hover:opacity-90 glow text-lg px-10 h-16 hover:scale-105 transition-all font-bold italic tracking-tight">
                ENGAGE REACTOR CORE
                <Cpu className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button size="lg" variant="outline" className="glass border-white/10 text-lg px-10 h-16 hover:scale-105 transition-all font-bold">
                VIEW LIVE FEED
              </Button>
            </Link>
          </div>

          {/* Hero Image / Mockup */}
          <div className="mt-20 animate-scale-in" style={{ animationDelay: "0.6s" }}>
            <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-glow animate-glow-pulse group">
              <img
                src={heroDashboard}
                alt="Somnia Reactor Interface"
                className="w-full h-auto opacity-80 group-hover:opacity-100 transition-opacity duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 px-6 py-3 glass rounded-full border border-reactor-pink/50 animate-bounce">
                <Activity className="w-4 h-4 text-reactor-pink" />
                <span className="text-xs font-mono font-bold text-white uppercase tracking-widest">System Online: Live Intelligence Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Features Matrix */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="glass border-white/5 hover:border-reactor-blue/30 transition-all hover:glow group animate-fade-in relative overflow-hidden"
              style={{ animationDelay: `${0.8 + index * 0.1}s` }}
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <feature.icon className="w-16 h-16" />
              </div>
              <CardContent className="p-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform glow">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 italic tracking-tight">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* System Stats */}
        <div className="glass rounded-3xl p-12 border border-white/5 animate-fade-in relative overflow-hidden" style={{ animationDelay: "1.2s" }}>
          <div className="absolute inset-0 bg-gradient-reactor opacity-[0.03]" />
          <div className="grid md:grid-cols-3 gap-12 text-center relative z-10">
            <div className="animate-slide-in-left" style={{ animationDelay: "1.3s" }}>
              <div className="text-5xl font-black bg-gradient-reactor bg-clip-text text-transparent mb-2">~1s</div>
              <div className="text-xs font-mono uppercase tracking-widest opacity-60">Reactivity Latency</div>
            </div>
            <div className="animate-scale-in" style={{ animationDelay: "1.4s" }}>
              <div className="text-5xl font-black bg-gradient-reactor bg-clip-text text-transparent mb-2">100%</div>
              <div className="text-xs font-mono uppercase tracking-widest opacity-60">Atomic Guarantee</div>
            </div>
            <div className="animate-slide-in-right" style={{ animationDelay: "1.5s" }}>
              <div className="text-5xl font-black bg-gradient-reactor bg-clip-text text-transparent mb-2">24/7</div>
              <div className="text-xs font-mono uppercase tracking-widest opacity-60">Autonomous Uptime</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-32 text-center animate-fade-in-up pb-20" style={{ animationDelay: "1.6s" }}>
          <h2 className="text-4xl md:text-5xl font-black mb-6 italic italic tracking-tighter">
            READY TO ACTIVATE?
          </h2>
          <p className="text-muted-foreground mb-10 text-lg max-w-xl mx-auto">
            Join the new era of event-driven DeFi. Deploy your first reactor on the Somnia Testnet today.
          </p>
          <Link to="/connect-wallet">
            <Button size="lg" className="bg-gradient-reactor hover:scale-105 transition-all text-white text-xl px-12 h-20 rounded-2xl font-black italic shadow-glow">
              INITIALIZE SYSTEM
              <ArrowRight className="ml-3 w-6 h-6" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Landing;
