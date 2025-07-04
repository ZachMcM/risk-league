import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WaitlistForm } from "@/components/waitlist-form";
import {
  Trophy,
  Target,
  Shield,
  Zap,
  Users,
  TrendingUp,
  Star,
  CheckCircle,
  GamepadIcon,
  BarChart3,
  XCircle,
} from "lucide-react";
import { LogoIcon } from "@/components/ui/logo-icon";

export default function RiskLeagueLanding() {
  return (
    <main>
      {/* Hero Section */}
      <section className="hero-gradient py-20 md:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-8 text-center">
            <Badge variant="secondary" className="px-4 py-2">
              🎮 The Future of Sports Betting
            </Badge>
            <div className="flex flex-col gap-2 items-center">
              <LogoIcon className="h-12 w-12 text-primary" />
              <div className="space-y-4 max-w-4xl">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
                  Play. <span className="gradient-text">Risk. </span>Win.
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground text-lg md:text-xl">
                  Experience the thrill of competitive sports betting without
                  the financial risk. Build parlays, battle opponents, and climb
                  the ELO rankings in the ultimate skill-based gaming
                  experience.
                </p>
              </div>
            </div>

            {/* Waitlist Form */}
            <div className="w-full max-w-md space-y-4">
              <WaitlistForm size="lg" />
              <p className="text-sm text-muted-foreground">
                🔥 Join 10,000+ players already on the waitlist
              </p>
            </div>

            {/* Hero Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">10K+</div>
                <div className="text-sm text-muted-foreground">
                  Players Waiting
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">0$</div>
                <div className="text-sm text-muted-foreground">
                  Financial Risk
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">∞</div>
                <div className="text-sm text-muted-foreground">
                  Skill Ceiling
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32">
        <div className="container px-4 md:px-6">
          <div className="text-center space-y-4 mb-16">
            <Badge variant="outline" className="px-4 py-2">
              ⚡ Core Features
            </Badge>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Built for <span className="gradient-text">Champions</span>
            </h2>
            <p className="mx-auto max-w-[700px] text-muted-foreground text-lg">
              Every feature designed to elevate your competitive gaming
              experience
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="card-hover border-2">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>ELO Ranking System</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Climb the competitive ladder with our sophisticated ELO
                  system. Every win matters, every loss teaches.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="card-hover border-2">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>1v1 Battles</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Face off against opponents in intense head-to-head matches.
                  Pure skill, no luck.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="card-hover border-2">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Player Prop Parlays</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Create strategic parlays from all major sports leagues. Your
                  knowledge is your weapon.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="card-hover border-2">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Zero Financial Risk</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  All the thrill, none of the financial danger. Perfect for
                  recovering gamblers and smart players.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="card-hover border-2">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Quick Play Mode</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Jump into casual matches when you want to relax. Low pressure,
                  high fun.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="card-hover border-2">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Trophy className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Tournaments</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Compete in exclusive tournaments to prove you're among the
                  elite players.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Risk League Section */}
      <section id="why-us" className="py-20 md:py-32 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="text-center space-y-4 mb-16">
            <Badge variant="outline" className="px-4 py-2">
              🚀 Why Choose Us
            </Badge>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Beyond Traditional{" "}
              <span className="gradient-text">Sports Betting</span>
            </h2>
          </div>

          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-primary/10 rounded-lg mt-1">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    Skill Over Luck
                  </h3>
                  <p className="text-muted-foreground">
                    Traditional betting relies heavily on chance. Risk League
                    rewards knowledge, strategy, and skill development.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="p-2 bg-primary/10 rounded-lg mt-1">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    No Financial Ruin
                  </h3>
                  <p className="text-muted-foreground">
                    Enjoy the competitive thrill without risking your savings.
                    Perfect for those seeking a healthier alternative.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="p-2 bg-primary/10 rounded-lg mt-1">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    Competitive Growth
                  </h3>
                  <p className="text-muted-foreground">
                    Our ELO system ensures you're always matched with players of
                    similar skill, promoting continuous improvement.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="p-2 bg-primary/10 rounded-lg mt-1">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    Community Focused
                  </h3>
                  <p className="text-muted-foreground">
                    Build lasting connections with fellow sports enthusiasts in
                    a positive, competitive environment.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-pink-400/20 rounded-3xl blur-3xl"></div>
              <Card className="relative border-2 border-primary/20">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">
                    Traditional Sports Betting vs Risk League
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <h4 className="font-semibold mb-2">
                        Traditional Betting
                      </h4>

                      <div className="flex justify-center">
                        <ul className="space-y-1 text-destructive flex flex-col items-start">
                          <li className="flex items-center gap-2">
                            <XCircle className="h-4 w-4" />
                            Financial risk
                          </li>
                          <li className="flex items-center gap-2">
                            <XCircle className="h-4 w-4" />
                            Addiction potential
                          </li>
                          <li className="flex items-center gap-2">
                            <XCircle className="h-4 w-4" />
                            House always wins
                          </li>
                          <li className="flex items-center gap-2">
                            <XCircle className="h-4 w-4" />
                            Luck-based outcomes
                          </li>
                        </ul>
                      </div>
                    </div>
                    <div className="text-center p-4 bg-primary/10 border border-primary/20 rounded-lg">
                      <h4 className="font-semibold mb-2">Risk League</h4>
                      <div className="flex justify-center">
                        <ul className="space-y-1 text-green-600 flex flex-col items-start">
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" /> Zero financial
                            risk
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" /> Healthy
                            competition
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" /> Skill-based
                            rewards
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" /> Strategic
                            gameplay
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 md:py-32">
        <div className="container px-4 md:px-6">
          <div className="text-center space-y-4 mb-16">
            <Badge variant="outline" className="px-4 py-2">
              🎯 Simple Process
            </Badge>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              How <span className="gradient-text">Risk League</span> Works
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-semibold">Battle Opponents</h3>
              <p className="text-muted-foreground">
                Get matched with players of similar skill level for fair,
                competitive 1v1 matches.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-xl font-semibold">Create Your Parlay</h3>
              <p className="text-muted-foreground">
                Select player props from NFL, NBA, MLB, and more. Build your
                perfect parlay strategy.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-xl font-semibold">Climb the Rankings</h3>
              <p className="text-muted-foreground">
                Win to gain ELO points and climb the leaderboard. Become a Risk
                League champion.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 md:py-32 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="text-center space-y-4 mb-16">
            <Badge variant="outline" className="px-4 py-2">
              ⭐ Player Testimonials
            </Badge>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
              What Players Are Saying
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <Card className="card-hover">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <GamepadIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">@SportsGuru23</CardTitle>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-4 w-4 fill-primary text-primary"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  "Finally, a way to compete without losing my shirt! The ELO
                  system keeps matches fair and exciting."
                </p>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">@FantasyPro</CardTitle>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-4 w-4 fill-primary text-primary"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  "This is what sports betting should be - pure skill and
                  strategy. Can't wait for the full launch!"
                </p>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">
                      @RecoveringBettor
                    </CardTitle>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-4 w-4 fill-primary text-primary"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  "Perfect for someone like me who loves the competition but
                  needed to step away from real money betting."
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Media Section */}
      <section className="py-20 md:py-32">
        <div className="container px-4 md:px-6">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <Badge variant="outline" className="px-4 py-2">
                📱 Follow the Action
              </Badge>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Stay Connected with{" "}
                <span className="gradient-text">Risk League</span>
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground text-lg">
                Join our growing community for the latest updates, tips, and
                behind-the-scenes content.
              </p>
            </div>

            <div className="flex justify-center items-center space-x-8">
              <a
                href="https://x.com/riskleaguex"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center space-y-2 p-4 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="p-3 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                  <svg
                    className="h-8 w-8 text-primary"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </div>
                <span className="text-sm font-medium">@riskleaguex</span>
              </a>

              <a
                href="https://www.tiktok.com/@riskleague"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center space-y-2 p-4 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="p-3 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                  <svg
                    className="h-8 w-8 text-primary"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                  </svg>
                </div>
                <span className="text-sm font-medium">@riskleague</span>
              </a>

              <a
                href="https://www.instagram.com/riskleague/"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center space-y-2 p-4 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="p-3 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                  <svg
                    className="h-8 w-8 text-primary"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </div>
                <span className="text-sm font-medium">@riskleague</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-32">
        <div className="container px-4 md:px-6">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Ready to <span className="gradient-text">Risk?</span>
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground text-lg">
                Join thousands of players waiting to experience the future of
                sports betting.
              </p>
            </div>

            <div className="mx-auto max-w-md space-y-4">
              <WaitlistForm size="lg" />
              <p className="text-sm text-muted-foreground">
                🎮 Be among the first to play when we launch
              </p>
            </div>

            <div className="pt-8">
              <Badge variant="secondary" className="px-6 py-3 text-base">
                🔥 Limited Beta Access Available
              </Badge>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
