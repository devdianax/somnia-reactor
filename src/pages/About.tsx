import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Shield, Zap, Users, Mail } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-hero pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">
            About <span className="gradient-text">DeFi Tracker</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Real-time blockchain tracking powered by Somnia Data Streams
          </p>
        </div>

        {/* What is Somnia */}
        <Card className="glass border-border mb-8">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Zap className="w-6 h-6 text-accent" />
              What is Somnia Data Streams?
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Somnia Data Streams is a revolutionary real-time blockchain data infrastructure that
              enables instant access to on-chain events, token prices, and transaction data. Unlike
              traditional polling methods, Somnia provides push-based data delivery, ensuring you
              never miss a market movement or transaction.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Our platform leverages this technology to deliver millisecond-level updates to your
              portfolio, giving you the edge you need in fast-moving DeFi markets.
            </p>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card className="glass border-border mb-8">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-6">How Real-Time Tracking Works</h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0 glow">
                  <span className="text-lg font-bold">1</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Connect Your Wallet</h3>
                  <p className="text-sm text-muted-foreground">
                    Securely connect your Web3 wallet to grant read-only access to your addresses
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0 glow">
                  <span className="text-lg font-bold">2</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Stream Subscription</h3>
                  <p className="text-sm text-muted-foreground">
                    We subscribe to relevant Somnia data streams for your wallet addresses and
                    tracked tokens
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0 glow">
                  <span className="text-lg font-bold">3</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Real-Time Updates</h3>
                  <p className="text-sm text-muted-foreground">
                    As events occur on-chain, data is pushed instantly to your dashboard with zero
                    delay
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0 glow">
                  <span className="text-lg font-bold">4</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Instant Notifications</h3>
                  <p className="text-sm text-muted-foreground">
                    Receive alerts for price changes, transactions, and yield updates the moment
                    they happen
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security & Privacy */}
        <Card className="glass border-border mb-8">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Shield className="w-6 h-6 text-success" />
              Security & Privacy
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <div className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                <p>
                  <strong className="text-foreground">Read-only access:</strong> We never request
                  permissions to move your funds
                </p>
              </div>
              <div className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                <p>
                  <strong className="text-foreground">No private keys:</strong> Your keys remain
                  secure in your wallet at all times
                </p>
              </div>
              <div className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                <p>
                  <strong className="text-foreground">Encrypted connections:</strong> All data
                  streams use end-to-end encryption
                </p>
              </div>
              <div className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                <p>
                  <strong className="text-foreground">Open source:</strong> Our code is audited and
                  publicly available
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="glass border-border">
          <CardContent className="p-8 text-center">
            <Users className="w-12 h-12 text-accent mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-3">Join Our Community</h2>
            <p className="text-muted-foreground mb-6">
              Connect with other users, get support, and stay updated with the latest features
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button className="bg-gradient-accent hover:opacity-90 gap-2">
                <Mail className="w-4 h-4" />
                Contact Support
              </Button>
              <Button variant="outline" className="glass border-border gap-2">
                <ExternalLink className="w-4 h-4" />
                Documentation
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default About;
