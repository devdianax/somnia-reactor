import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Shield, TrendingUp, Bell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import heroDashboard from "@/assets/hero-dashboard.jpg";
import featureRealtime from "@/assets/feature-realtime.jpg";
import featureSecurity from "@/assets/feature-security.jpg";

const Landing = () => {
  const features = [
    {
      icon: Zap,
      title: "Real-Time Updates",
      description: "Instant portfolio updates with no refresh needed. Track your assets as they change.",
    },
    {
      icon: TrendingUp,
      title: "Yield Tracking",
      description: "Monitor your staking rewards and farming positions with live APY calculations.",
    },
    {
      icon: Bell,
      title: "Smart Alerts",
      description: "Get instant notifications when your assets hit target prices or important events occur.",
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your keys, your crypto. We never store your private keys or transaction data.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-hero overflow-hidden">
      <div className="container mx-auto px-4 pt-24 pb-16">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-20">
          <div className="inline-block mb-4 px-4 py-2 glass rounded-full border border-accent/20 animate-fade-in">
            <span className="text-accent text-sm font-medium">Powered by Somnia Data Streams</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight animate-fade-in-up">
            Track Your DeFi Portfolio
            <span className="gradient-text block mt-2">in Real Time</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Never miss a market movement. Get instant updates on your tokens, yields, and transactions
            with our real-time blockchain tracking platform.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <Link to="/connect-wallet">
              <Button size="lg" className="bg-gradient-accent hover:opacity-90 glow text-lg px-8 h-14 hover:scale-105 transition-transform">
                Connect Wallet
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button size="lg" variant="outline" className="glass border-border text-lg px-8 h-14 hover:scale-105 transition-transform">
                View Demo
              </Button>
            </Link>
          </div>

          {/* Hero Image */}
          <div className="mt-16 animate-scale-in" style={{ animationDelay: "0.6s" }}>
            <div className="relative rounded-2xl overflow-hidden border-2 border-primary/30 shadow-card animate-glow-pulse">
              <img
                src={heroDashboard}
                alt="DeFi Portfolio Dashboard Interface"
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="glass border-border hover:border-primary/50 transition-all hover:glow group animate-fade-in hover:scale-105 hover:-translate-y-1"
              style={{ animationDelay: `${0.8 + index * 0.1}s` }}
            >
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mb-4 group-hover:glow transition-all group-hover:scale-110">
                  <feature.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
                
                {/* Feature Image for select cards */}
                {index === 0 && (
                  <div className="mt-4 rounded-lg overflow-hidden border border-border/50">
                    <img
                      src={featureRealtime}
                      alt="Real-time blockchain data visualization"
                      className="w-full h-32 object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                )}
                {index === 3 && (
                  <div className="mt-4 rounded-lg overflow-hidden border border-border/50">
                    <img
                      src={featureSecurity}
                      alt="Security and privacy protection"
                      className="w-full h-32 object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats Section */}
        <div className="glass rounded-2xl p-8 border border-border animate-fade-in" style={{ animationDelay: "1.2s" }}>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="animate-slide-in-left" style={{ animationDelay: "1.3s" }}>
              <div className="text-4xl font-bold gradient-text mb-2">$2.5B+</div>
              <div className="text-muted-foreground">Total Value Tracked</div>
            </div>
            <div className="animate-scale-in" style={{ animationDelay: "1.4s" }}>
              <div className="text-4xl font-bold gradient-text mb-2">50K+</div>
              <div className="text-muted-foreground">Active Wallets</div>
            </div>
            <div className="animate-slide-in-right" style={{ animationDelay: "1.5s" }}>
              <div className="text-4xl font-bold gradient-text mb-2">1M+</div>
              <div className="text-muted-foreground">Transactions Monitored</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center animate-fade-in-up" style={{ animationDelay: "1.6s" }}>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to get started?
          </h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Connect your wallet and start tracking your DeFi portfolio in seconds.
          </p>
          <Link to="/connect-wallet">
            <Button size="lg" className="bg-gradient-accent hover:opacity-90 glow text-lg px-8 h-14 hover:scale-105 transition-transform">
              Get Started Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Landing;
